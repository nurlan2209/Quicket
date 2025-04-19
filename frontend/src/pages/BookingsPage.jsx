import { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import apiService from '../services/api';

const BookingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelStatus, setCancelStatus] = useState({ id: null, status: null, message: '' });

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        const data = await apiService.getUserBookings(user.id);
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setError(t('bookings.error'));
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, t]);

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
        setCancelStatus({
          id: bookingId,
          status: 'error',
          message: response.message || t('bookings.cancel.error')
        });
      }
    } catch (err) {
      setCancelStatus({
        id: bookingId,
        status: 'error',
        message: t('bookings.cancel.error')
      });
    }
  };

  if (loading) {
    return <div className="container text-center mt-5">{t('bookings.loading')}</div>;
  }

  if (error) {
    return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
  }

  // Группировка бронирований по статусу
  const activeBookings = bookings.filter(booking => booking.status === 'confirmed');
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled');

  return (
    <div className="container mt-4">
      <h1 className="mb-4">{t('bookings.title')}</h1>
      
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
                  <div key={booking.id} className="card mb-3" style={{ opacity: 0.7, marginBottom: '150px' }}>
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
    </div>
  );
};

export default BookingsPage;