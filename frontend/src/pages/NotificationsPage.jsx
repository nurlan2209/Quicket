import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка уведомлений при монтировании компонента
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Функция для загрузки уведомлений
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getUserNotifications();
      console.log('Получены уведомления:', data);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка при загрузке уведомлений:', err);
      setError('Не удалось загрузить уведомления. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return 'notification-icon-booking';
      case 'booking_cancelled':
        return 'notification-icon-cancel';
      case 'booking_reminder':
        return 'notification-icon-reminder';
      case 'system_message':
        return 'notification-icon-system';
      default:
        return 'notification-icon-default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(t('locale') || 'ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Оптимистично обновляем UI
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Вызываем API
      await apiService.markNotificationAsRead(notificationId);
      console.log('Уведомление отмечено как прочитанное:', notificationId);
    } catch (err) {
      console.error('Ошибка при отметке уведомления:', err);
      // В случае ошибки обновляем данные заново
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      // Оптимистично обновляем UI
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Вызываем API
      await apiService.deleteNotification(notificationId);
      console.log('Уведомление удалено:', notificationId);
    } catch (err) {
      console.error('Ошибка при удалении уведомления:', err);
      // В случае ошибки обновляем данные заново
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Оптимистично обновляем UI
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Вызываем API
      await apiService.markAllNotificationsAsRead();
      console.log('Все уведомления отмечены как прочитанные');
    } catch (err) {
      console.error('Ошибка при отметке всех уведомлений:', err);
      // В случае ошибки обновляем данные заново
      fetchNotifications();
    }
  };

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>{t('notifications.title')}</h1>
        </div>
        <div className="notifications-error">
          <p>{t('common.unauthorized', 'Необходима авторизация')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>{t('notifications.title')}</h1>
        {notifications.length > 0 && notifications.some(n => !n.read) && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            {t('notifications.markAllAsRead', 'Отметить все как прочитанные')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="notifications-loading">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="notifications-error">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchNotifications}>
            {t('common.retry', 'Повторить')}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="no-notifications">
          <div className="no-notifications-icon"></div>
          <p>{t('notifications.noNotifications', 'У вас пока нет уведомлений')}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className={`notification-icon ${getNotificationIcon(notification.type)}`}></div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-date">{formatDate(notification.created_at)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
                {notification.action_link && (
                  <a href={notification.action_link} className="notification-action">
                    {notification.action_text || t('notifications.viewDetails', 'Подробнее')}
                  </a>
                )}
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="read-btn"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title={t('notifications.markAsRead', 'Отметить как прочитанное')}
                  >
                    <span className="read-icon"></span>
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title={t('notifications.delete', 'Удалить')}
                >
                  <span className="delete-icon"></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;