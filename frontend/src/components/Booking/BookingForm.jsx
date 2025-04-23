import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import PaymentQRModal from './PaymentQRModal';
import SeatSelection from './SeatSelection';
import StadiumSeatSelection from './StadiumSeatSelection';
import '../../styles/BookingForm.css';

const BookingForm = ({ event, onBookingSuccess }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [seats, setSeats] = useState(1); // Кол-во мест (для обратной совместимости)
  const [selectedSeats, setSelectedSeats] = useState([]); // Выбранные места
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSeatSelection, setShowSeatSelection] = useState(false); // Показывать/скрывать выбор мест

  // Состояние для модального окна оплаты
  const [showPaymentQRModal, setShowPaymentQRModal] = useState(false);
  const bookingProcessedRef = useRef(false);
  const [qrImagePath, setQrImagePath] = useState('../../../public/kaspi_qr.jpeg');

  // Проверяем, является ли место проведения "Astana Arena"
  const isAstanaArena = event?.venue_name?.includes('Astana Arena');

  // Загружаем сохраненные места из localStorage при монтировании
  useEffect(() => {
    if (event) {
      const savedKey = `booking_${user?.id}_${event.id}`;
      const savedData = localStorage.getItem(savedKey);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.selectedSeats && Array.isArray(parsedData.selectedSeats)) {
            setSelectedSeats(parsedData.selectedSeats);
            setSeats(parsedData.selectedSeats.length); // Обновляем количество мест
          }
        } catch (error) {
          console.error('Ошибка при загрузке сохраненных мест:', error);
        }
      }
    }
  }, [event, user]);

  // Сохраняем выбор мест в localStorage при изменении
  useEffect(() => {
    if (event && user) {
      const saveKey = `booking_${user.id}_${event.id}`;
      localStorage.setItem(saveKey, JSON.stringify({
        selectedSeats,
        timestamp: new Date().toISOString()
      }));
    }
  }, [selectedSeats, event, user]);

  const handleBooking = async () => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Проверка выбранных мест
    if (selectedSeats.length === 0) {
      setStatus({
        type: 'error',
        message: t('bookingForm.errors.noSeatsSelected', 'Пожалуйста, выберите хотя бы одно место')
      });
      return;
    }
    
    // Проверка корректности кол-ва мест
    if (selectedSeats.length > event.available_seats) {
      setStatus({
        type: 'error',
        message: t('bookingForm.errors.tooManySeats', 'Выбрано слишком много мест. Доступно: {{count}}', { count: event.available_seats })
      });
      return;
    }
    
    // Сбрасываем флаг обработки при каждом бронировании
    bookingProcessedRef.current = false;
    
    // Показываем модальное окно оплаты
    setShowPaymentQRModal(true);
  };

  // Обработчик выбора места
  const handleSeatSelect = (seatId) => {
    setSelectedSeats(prevSeats => {
      // Если место уже выбрано - удаляем его
      if (prevSeats.includes(seatId)) {
        const newSelectedSeats = prevSeats.filter(id => id !== seatId);
        setSeats(newSelectedSeats.length); // Обновляем количество мест
        return newSelectedSeats;
      } 
      // Иначе добавляем место
      else {
        const newSelectedSeats = [...prevSeats, seatId];
        setSeats(newSelectedSeats.length); // Обновляем количество мест
        return newSelectedSeats;
      }
    });
  };
  
  // Обработчик успешной оплаты
  const handlePaymentSuccess = async () => {
    // Проверяем, не была ли уже обработана оплата
    if (bookingProcessedRef.current) {
      return;
    }
    
    // Устанавливаем флаг, что оплата обработана
    bookingProcessedRef.current = true;
    
    setLoading(true);
    
    try {
      // Добавляем информацию о выбранных местах в запрос бронирования
      const response = await apiService.createBooking({
        user_id: user.id,
        event_id: event.id,
        seats: selectedSeats.length, // Количество выбранных мест
        seat_numbers: selectedSeats // Сами выбранные места
      });
      
      if (response.success) {
        // Закрываем модальное окно оплаты
        setShowPaymentQRModal(false);
        
        setStatus({
          type: 'success',
          message: t('common.success')
        });
        
        // Сохраняем информацию о занятых местах в localStorage
        const venueKey = `venue_${event.venue_id}`;
        const storedVenueData = localStorage.getItem(venueKey);
        let venueData = { occupiedSeats: [] };
        
        if (storedVenueData) {
          try {
            venueData = JSON.parse(storedVenueData);
          } catch (e) {
            console.error('Ошибка при чтении данных о занятых местах:', e);
          }
        }
        
        // Добавляем новые занятые места
        venueData.occupiedSeats = [
          ...(venueData.occupiedSeats || []),
          ...selectedSeats
        ];
        
        // Сохраняем обновленные данные
        localStorage.setItem(venueKey, JSON.stringify(venueData));
        
        // Очищаем данные о выбранных местах
        const saveKey = `booking_${user.id}_${event.id}`;
        localStorage.removeItem(saveKey);
        
        // Показываем анимацию успеха
        setShowSuccess(true);
        
        // Сбрасываем выбранные места
        setSelectedSeats([]);
        setSeats(0);
        
        // Вызываем колбэк успешного бронирования
        if (onBookingSuccess) {
          onBookingSuccess();
        }
      } else {
        // Закрываем модальное окно оплаты
        setShowPaymentQRModal(false);
        
        // Если ошибка связана с авторизацией, перенаправляем на страницу входа
        if (response.message && response.message.includes('авторизац')) {
          // Выводим сообщение об истечении сессии
          setStatus({
            type: 'error',
            message: response.message
          });
          
          // Даем пользователю время прочитать сообщение и перенаправляем
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus({
            type: 'error',
            message: response.message || t('bookingForm.errors.bookingError')
          });
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      
      // Закрываем модальное окно оплаты
      setShowPaymentQRModal(false);
      
      setStatus({
        type: 'error',
        message: t('bookingForm.errors.tryAgain')
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Закрытие модального окна оплаты
  const closePaymentQRModal = () => {
    setShowPaymentQRModal(false);
  };

  // Функция переключения режима выбора мест
  const toggleSeatSelection = () => {
    setShowSeatSelection(!showSeatSelection);
  };

  // Если успешно забронировано - показываем сообщение успеха
  if (showSuccess) {
    return (
      <div className="booking-form">
        <div className="booking-form-header">
          <h3 className="booking-form-title">{t('bookingForm.success.title')}</h3>
          <p className="booking-form-subtitle">{t('bookingForm.success.subtitle')}</p>
        </div>
        <div className="booking-form-content">
          <div className="success-animation">
            <div className="success-icon"></div>
            <h3 className="success-message">{t('bookingForm.success.message')}</h3>
            <p className="success-details">
              {t('bookingForm.success.details')}
            </p>
            <button 
              className="booking-submit-btn"
              onClick={() => navigate('/bookings')}
            >
              {t('bookingForm.success.goToBookings')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="booking-form">
      <div className="booking-form-header">
        <h3 className="booking-form-title">{t('bookingForm.title')}</h3>
        <p className="booking-form-subtitle">{t('bookingForm.subtitle')}</p>
      </div>
      
      <div className="booking-form-content">
        {status.type === 'success' ? (
          <div className="alert alert-success">{status.message}</div>
        ) : status.type === 'error' ? (
          <div className="alert alert-danger">{status.message}</div>
        ) : null}
        
        {event.available_seats > 0 ? (
          <>
            <div className="booking-seats-toggle">
              <button 
                className="toggle-seat-selection-btn"
                onClick={toggleSeatSelection}
              >
                {showSeatSelection 
                  ? t('bookingForm1.hideSeatMap', 'Скрыть схему зала') 
                  : t('bookingForm1.showSeatMap', 'Выбрать места на схеме')}
              </button>
            </div>

            {showSeatSelection ? (
              // Используем разные компоненты выбора мест в зависимости от места проведения
              isAstanaArena ? (
                <StadiumSeatSelection 
                  event={event}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                />
              ) : (
                <SeatSelection 
                  event={event}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                />
              )
            ) : (
              <>
                <div className="booking-input-group">
                  <label htmlFor="seats">{t('bookingForm.seatsLabel')}</label>
                  <div className="seats-input">
                    <div className="seats-display">
                      <span className="selected-seats-count">{selectedSeats.length}</span>
                      <span className="seats-text">{t('bookingForm1.seatsSelected', 'мест выбрано')}</span>
                    </div>
                    <span className="seats-available-text">
                      {t('bookingForm.availableSeats', { count: event.available_seats })}
                    </span>
                  </div>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="selected-seats-display">
                    <h4>{t('bookingForm1.yourSelectedSeats', 'Выбранные места')}:</h4>
                    <div className="seat-tags">
                      {selectedSeats.map(seatId => {
                        // Форматируем ID места в зависимости от типа места проведения
                        let displayText;
                        if (isAstanaArena) {
                          const parts = seatId.split('-');
                          if (parts.length === 3) {
                            const [subsector, row, seat] = parts;
                            displayText = `${t('stadium.sector')} ${subsector}, ${t('stadium.row')} ${row}, ${t('stadium.seat')} ${seat}`;
                          } else {
                            displayText = seatId;
                          }
                        } else {
                          const [row, number] = seatId.split('-');
                          displayText = t('bookingForm.rowSeat', 'Ряд {{row}}, Место {{seat}}', { row, seat: number });
                        }
                        
                        return (
                          <span key={seatId} className="seat-tag">
                            {displayText}
                            <button 
                              className="remove-seat-btn"
                              onClick={() => handleSeatSelect(seatId)}
                              title={t('bookingForm.removeSeat', 'Убрать место')}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="price-calculation">
              <div className="price-row">
                <span>{t('bookingForm.pricePerSeat')}</span>
                <span>{event.price} тг</span>
              </div>
              <div className="price-row">
                <span>{t('bookingForm.numberOfSeats')}</span>
                <span>x {selectedSeats.length}</span>
              </div>
              <div className="price-row total">
                <span>{t('bookingForm.totalPayment')}</span>
                <span>{selectedSeats.length * event.price} тг</span>
              </div>
            </div>
            
            <button 
              className="booking-submit-btn"
              onClick={handleBooking}
              disabled={loading || selectedSeats.length === 0}
            >
              {loading ? t('bookingForm.processing') : 
                user ? t('bookingForm.booking') : t('bookingForm.loginToBook')}
            </button>
            
            {!user && (
              <p className="login-notice">
                {t('bookingForm.loginNotice')} <Link to="/login">{t('navigation.login')}</Link>
              </p>
            )}
          </>
        ) : (
          <div className="alert alert-warning">
            {t('bookingForm.soldOutMessage')}
          </div>
        )}
      </div>
      
      {/* Модальное окно оплаты */}
      <PaymentQRModal 
        isOpen={showPaymentQRModal} 
        onClose={closePaymentQRModal} 
        onPaymentSuccess={handlePaymentSuccess}
        qrImagePath={qrImagePath}
        price={event.price}
        seats={selectedSeats.length}
        selectedSeats={selectedSeats}
        isStadium={isAstanaArena}
      />
    </div>
  );
};

export default BookingForm;