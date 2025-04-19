import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import '../../styles/NotificationCenter.css';

const NotificationCenter = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.getUserNotifications(user.id, { limit: 5 });
      if (response.success) {
        const notifications = response.notifications || [];
        const unread = notifications.filter(notification => !notification.read).length;
        
        setUnreadCount(unread);
        setRecentNotifications(notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const goToNotifications = () => {
    setShowDropdown(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return 'notification-dropdown-icon-booking';
      case 'booking_cancelled':
        return 'notification-dropdown-icon-cancel';
      case 'booking_reminder':
        return 'notification-dropdown-icon-reminder';
      case 'event_updated':
        return 'notification-dropdown-icon-update';
      case 'event_cancelled':
        return 'notification-dropdown-icon-cancel';
      case 'system_message':
        return 'notification-dropdown-icon-system';
      default:
        return 'notification-dropdown-icon-default';
    }
  };

  // Форматирование относительной даты (например, "5 минут назад")
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) {
      return t('notifications.justNow');
    } else if (minutes < 60) {
      return t('notifications.minutesAgo', { count: minutes });
    } else if (hours < 24) {
      return t('notifications.hoursAgo', { count: hours });
    } else if (days < 7) {
      return t('notifications.daysAgo', { count: days });
    } else {
      return new Intl.DateTimeFormat(t('locale') || 'kz-KZ', {
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    }
  };

  // Обработчик для пометки уведомления как прочитанного
  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Обновляем локальный список
        setRecentNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Уменьшаем счетчик непрочитанных
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Обработчик для пометки всех уведомлений как прочитанных
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    
    try {
      const response = await apiService.markAllNotificationsAsRead(user.id);
      
      if (response.success) {
        // Обновляем локальный список
        setRecentNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Обнуляем счетчик непрочитанных
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Закрываем выпадающий список при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.notification-center-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  // Если пользователь не авторизован, не показываем компонент
  if (!user) return null;

  return (
    <div className="notification-center-container">
      <div 
        className="notification-center-icon" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge-count">{unreadCount}</span>
        )}
      </div>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>
          
          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-dropdown-loading">
                <div className="notification-loading-spinner"></div>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="notification-dropdown-empty">
                <p>{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              <>
                <ul className="notification-dropdown-list">
                  {recentNotifications.map(notification => (
                    <li 
                      key={notification.id} 
                      className={`notification-dropdown-item ${notification.read ? 'read' : 'unread'}`}
                      onClick={() => {
                        if (notification.action_link) {
                          navigate(notification.action_link);
                        } else {
                          goToNotifications();
                        }
                        setShowDropdown(false);
                      }}
                    >
                      <div className={`notification-dropdown-item-icon ${getNotificationIcon(notification.notification_type)}`}></div>
                      <div className="notification-dropdown-item-content">
                        <div className="notification-dropdown-item-header">
                          <h4>{notification.title}</h4>
                          <span className="notification-dropdown-item-time">
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="notification-dropdown-item-message">
                          {notification.message.length > 80 
                            ? `${notification.message.substring(0, 80)}...` 
                            : notification.message
                          }
                        </p>
                      </div>
                      {!notification.read && (
                        <button 
                          className="notification-dropdown-mark-read"
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          title={t('notifications.markAsRead')}
                        >
                          <span className="check-icon">✓</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                
                <div className="notification-dropdown-footer">
                  <button 
                    className="view-all-notifications-btn"
                    onClick={goToNotifications}
                  >
                    {t('notifications.viewAll')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;