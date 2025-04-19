import { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import PaymentQRModal from './PaymentQRModal'; // Импорт компонента модального окна оплаты
import '../../styles/BookingForm.css';

const BookingForm = ({ event, onBookingSuccess }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [seats, setSeats] = useState(1);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Состояние для модального окна оплаты
  const [showPaymentQRModal, setShowPaymentQRModal] = useState(false);
  const bookingProcessedRef = useRef(false); // Реф для отслеживания, обработано ли уже бронирование
  const [qrImagePath, setQrImagePath] = useState('/payment-qr.png'); // Путь к QR-коду

  const handleBooking = async () => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Проверка корректности кол-ва мест
    if (seats < 1 || seats > event.available_seats) {
      setStatus({
        type: 'error',
        message: t('bookingForm.errors.seatsRange', { max: event.available_seats })
      });
      return;
    }
    
    // Сбрасываем флаг обработки при каждом бронировании
    bookingProcessedRef.current = false;
    
    // Показываем модальное окно оплаты
    setShowPaymentQRModal(true);
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
      const response = await apiService.createBooking({
        user_id: user.id,
        event_id: event.id,
        seats: seats // Передаем ТОЛЬКО количество выбранных мест
      });
      
      if (response.success) {
        // Закрываем модальное окно оплаты
        setShowPaymentQRModal(false);
        
        setStatus({
          type: 'success',
          message: t('common.success')
        });
        
        // Показываем анимацию успеха
        setShowSuccess(true);
        
        // Сбрасываем количество мест
        setSeats(1);
        
        // Вызываем колбэк успешного бронирования
        if (onBookingSuccess) {
          onBookingSuccess();
        }
      } else {
        // Закрываем модальное окно оплаты
        setShowPaymentQRModal(false);
        
        setStatus({
          type: 'error',
          message: response.message || t('bookingForm.errors.bookingError')
        });
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

  const handleIncrement = () => {
    if (seats < event.available_seats) {
      setSeats(seats + 1);
    }
  };

  const handleDecrement = () => {
    if (seats > 1) {
      setSeats(seats - 1);
    }
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
            <div className="booking-input-group">
              <label htmlFor="seats">{t('bookingForm.seatsLabel')}</label>
              <div className="seats-input">
                <div className="seats-control">
                  <button 
                    type="button" 
                    className="seats-btn"
                    onClick={handleDecrement}
                    disabled={seats <= 1 || loading}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="seats"
                    className="seats-input-field"
                    min="1"
                    max={event.available_seats}
                    value={seats}
                    onChange={(e) => {
                      // Проверяем, что введенное значение валидно
                      const newValue = parseInt(e.target.value) || 1;
                      // Ограничиваем значение доступным количеством мест
                      const validValue = Math.min(Math.max(newValue, 1), event.available_seats);
                      setSeats(validValue);
                    }}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="seats-btn"
                    onClick={handleIncrement}
                    disabled={seats >= event.available_seats || loading}
                  >
                    +
                  </button>
                </div>
                <span className="seats-available-text">
                  {t('bookingForm.availableSeats', { count: event.available_seats })}
                </span>
              </div>
            </div>
            
            <div className="price-calculation">
              <div className="price-row">
                <span>{t('bookingForm.pricePerSeat')}</span>
                <span>{event.price} тг</span>
              </div>
              <div className="price-row">
                <span>{t('bookingForm.numberOfSeats')}</span>
                <span>x {seats}</span>
              </div>
              <div className="price-row total">
                <span>{t('bookingForm.totalPayment')}</span>
                <span>{seats * event.price} тг</span>
              </div>
            </div>
            
            <button 
              className="booking-submit-btn"
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? t('bookingForm.processing') : user ? t('bookingForm.booking') : t('bookingForm.loginToBook')}
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
        seats={seats}
      />
    </div>
  );
};

export default BookingForm;