import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  // Temporary mock data for demonstration
  // In the future, this data will come from the server
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      type: "booking_created",
      title: "Билет забронирован",
      message: "Вы успешно забронировали билет на мероприятие «Баскетбол секциясы»",
      read: false,
      created_at: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutes ago
    },
    {
      id: "n2",
      type: "booking_reminder",
      title: "Напоминание о мероприятии",
      message: "Мероприятие «Жаңадан бастаушыларға арналған жүзу» состоится завтра в 15:00",
      read: false,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString() // 3 hours ago
    },
    {
      id: "n3",
      type: "booking_cancelled",
      title: "Бронирование отменено",
      message: "Ваше бронирование на мероприятие «Футбол» было отменено",
      read: true,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
    },
    {
      id: "n4",
      type: "system_message",
      title: "Добро пожаловать в Quicket!",
      message: "Спасибо за регистрацию в нашем сервисе. Теперь вы можете бронировать билеты на различные мероприятия.",
      read: true,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Function to format date
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

  // In the future, these will be handlers for marking notifications as read and deleting
  const handleMarkAsRead = (notificationId) => {
    console.log('Mark as read:', notificationId);
    // Update local state to mark notification as read
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    // Here would be an API call
  };

  const handleDeleteNotification = (notificationId) => {
    console.log('Delete notification:', notificationId);
    // Update local state to remove notification
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
    // Here would be an API call
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
    // Update all notifications to read status
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    // Here would be an API call
  };

  // If user is not authenticated, show a message
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
          <button className="retry-btn" onClick={() => window.location.reload()}>
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