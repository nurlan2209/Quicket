import { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom'; // Добавлен импорт useNavigate
import { AuthContext } from '../contexts/AuthContext';
import apiService from '../services/api';
import EventCard from '../components/Booking/EventCard';
import '../styles/EventCard.css';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate(); // Получаем функцию навигации
  const [bookings, setBookings] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelStatus, setCancelStatus] = useState({ id: null, status: null, message: '' });
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' или 'favorites'

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        const data = await apiService.getUserBookings(user.id);
        setBookings(data);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке бронирований:', err);
        
        // Проверяем, связана ли ошибка с авторизацией
        if (typeof err === 'string' && (err.includes('авторизац') || err.includes('сессия'))) {
          setError('Ваша сессия истекла. Выполняется перенаправление на страницу входа...');
          
          // Перенаправляем на страницу входа
          setTimeout(() => {
            // Выходим из системы (очищаем данные авторизации)
            if (typeof logout === 'function') {
              logout();
            } else {
              // Если функция logout не доступна, очищаем localStorage самостоятельно
              localStorage.removeItem('user');
              localStorage.removeItem('authToken');
            }
            
            // Перенаправляем на страницу входа
            navigate('/login');
          }, 2000);
        } else {
          setError(t('bookings.error'));
        }
        
        setLoading(false);
      }
    };

    // Получение избранных мероприятий из localStorage
    const fetchFavorites = async () => {
      try {
        // Получаем ID избранных мероприятий из localStorage
        const favoriteIds = JSON.parse(localStorage.getItem('favoriteEvents') || '[]');
        
        if (favoriteIds.length > 0) {
          // Загружаем данные о всех мероприятиях
          const allEvents = await apiService.getEvents();
          
          // Фильтруем только избранные
          const favorites = allEvents.filter(event => favoriteIds.includes(event.id));
          setFavoriteEvents(favorites);
        } else {
          setFavoriteEvents([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке избранных мероприятий:', err);
        setFavoriteEvents([]);
      }
    };

    fetchBookings();
    fetchFavorites();
  }, [user, t, navigate, logout]); // Добавлены navigate и logout в зависимости

  // Форматирование даты с учетом языка
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const language = i18n.language || 'kz';
    // Маппинг языков для корректного отображения дат
    const localeMap = {
      kz: 'kk-KZ',
      ru: 'ru-RU',
      en: 'en-US'
    };
    return new Date(dateString).toLocaleDateString(localeMap[language], options);
  };

  // Отмена бронирования
  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await apiService.cancelBooking(bookingId, user.id);
      
      if (response.success) {
        // Обновление локального состояния
        const updatedBookings = bookings.map(booking => {
          if (booking.id === bookingId) {
            return { ...booking, status: 'cancelled' };
          }
          return booking;
        });
        
        setBookings(updatedBookings);
        
        setCancelStatus({
          id: bookingId,
          status: 'success',
          message: t('bookings.cancel.success')
        });
      } else {
        // Проверяем, связана ли ошибка с авторизацией
        if (response.message && (response.message.includes('авторизац') || response.message.includes('сессия'))) {
          setCancelStatus({
            id: bookingId,
            status: 'error',
            message: 'Ваша сессия истекла. Перенаправление на страницу входа...'
          });
          
          // Перенаправляем на страницу входа
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        } else {
          setCancelStatus({
            id: bookingId,
            status: 'error',
            message: response.message || t('bookings.cancel.error')
          });
        }
      }
    } catch (err) {
      setCancelStatus({
        id: bookingId,
        status: 'error',
        message: t('bookings.cancel.error')
      });
    }
  };

  // Удаление из избранного
  const handleRemoveFromFavorites = (eventId) => {
    // Получаем текущий список избранных
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteEvents') || '[]');
    
    // Удаляем текущее событие из списка
    const updatedFavorites = favoriteIds.filter(id => id !== eventId);
    
    // Обновляем localStorage
    localStorage.setItem('favoriteEvents', JSON.stringify(updatedFavorites));
    
    // Обновляем состояние
    setFavoriteEvents(favoriteEvents.filter(event => event.id !== eventId));
  };

  if (loading) {
    return <div className="container text-center mt-5">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
  }

  // Группировка бронирований по статусу
  const activeBookings = bookings.filter(booking => booking.status === 'confirmed');
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled');

  return (
    <div className="container mt-4">
      <h1 className="mb-4">{t('profilePage.myProfile')}</h1>
      
      {/* Вкладки */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          {t('profilePage.myBookings')}
        </button>
        <button 
          className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t('profilePage.favoriteEvents')}
        </button>
      </div>
      
      {activeTab === 'bookings' ? (
        // Секция бронирований
        <>
          {bookings.length === 0 ? (
            <div className="alert alert-info">
              {t('bookings.no_bookings')} <Link to="/events">{t('bookings.view_events')}</Link>
            </div>
          ) : (
            <>
              <h2 className="mb-3">{t('bookings.active_bookings')}</h2>
              
              {activeBookings.length === 0 ? (
                <div className="alert alert-info mb-4">{t('bookings.no_active_bookings')}</div>
              ) : (
                <div className="grid grid-1">
                  {activeBookings.map(booking => (
                    <div key={booking.id} className="card mb-3">
                      <div className="grid grid-2">
                        <div>
                          <h3>{booking.event_title}</h3>
                          <p><strong>{t('bookings.event_info.date')}:</strong> {formatDate(booking.event_date)}</p>
                          <p><strong>{t('bookings.event_info.time')}:</strong> {booking.event_time}</p>
                          <p><strong>{t('bookings.event_info.venue')}:</strong> {booking.venue_name}</p>
                          <p><strong>{t('bookings.event_info.seats')}:</strong> {booking.seats}</p>
                          <p><strong>{t('bookings.event_info.total')}:</strong> {booking.total_price} тг</p>
                          <p><strong>{t('bookings.event_info.booking_date')}:</strong> {formatDate(booking.created_at)}</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          {cancelStatus.id === booking.id && (
                            <div className={`alert ${cancelStatus.status === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                              {cancelStatus.message}
                            </div>
                          )}
                          
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            {t('bookings.cancel.button')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {cancelledBookings.length > 0 && (
                <>
                  <h2 className="mb-3 mt-4">{t('bookings.cancelled_bookings')}</h2>
                  
                  <div className="grid grid-1">
                    {cancelledBookings.map(booking => (
                      <div key={booking.id} className="card mb-3" style={{ opacity: 0.7 }}>
                        <h3>{booking.event_title}</h3>
                        <p><strong>{t('bookings.event_info.date')}:</strong> {formatDate(booking.event_date)}</p>
                        <p><strong>{t('bookings.event_info.time')}:</strong> {booking.event_time}</p>
                        <p><strong>{t('bookings.event_info.venue')}:</strong> {booking.venue_name}</p>
                        <p><strong>{t('bookings.event_info.seats')}:</strong> {booking.seats}</p>
                        <p><strong>{t('bookings.event_info.total')}:</strong> {booking.total_price} тг</p>
                        <p><strong>{t('bookings.event_info.status')}:</strong> <span className="badge badge-danger">{t('bookings.event_info.cancelled')}</span></p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        // Секция избранных мероприятий
        <>
          <h2 className="mb-3">Избранные мероприятия</h2>
          
          {favoriteEvents.length === 0 ? (
            <div className="alert alert-info">
              У вас нет избранных мероприятий. <Link to="/events">Найти мероприятия</Link>
            </div>
          ) : (
            <div className="grid grid-3">
              {favoriteEvents.map(event => (
                <div key={event.id} className="favorite-event-container">
                  <EventCard event={event} />
                  <button 
                    className="btn-remove-favorite"
                    onClick={() => handleRemoveFromFavorites(event.id)}
                    title="Удалить из избранного"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;