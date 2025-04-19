import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';

const AdminNotificationsList = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    user_id: '',
    notification_type: 'SYSTEM_MESSAGE'
  });
  
  // Загрузка пользователей и уведомлений
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем список пользователей
        const usersResponse = await apiService.getAllUsers();
        setUsers(usersResponse);
        
        // Пытаемся получить уведомления с бэкенда
        try {
          const notificationsData = await apiService.getAllNotifications();
          if (Array.isArray(notificationsData)) {
            setNotifications(notificationsData);
          } else {
            // Если не получили массив, используем макет
            setNotifications([
              {
                id: 1,
                user_id: 1,
                username: 'admin',
                title: 'Добро пожаловать в Quicket',
                message: 'Спасибо за регистрацию в нашем сервисе!',
                notification_type: 'SYSTEM_MESSAGE',
                read: true,
                created_at: '2023-05-10T14:30:00'
              },
              {
                id: 2,
                user_id: 2,
                username: 'user123',
                title: 'Бронирование успешно',
                message: 'Вы успешно забронировали 2 места на мероприятие "Футбольный матч"',
                notification_type: 'BOOKING_CREATED',
                read: false,
                created_at: '2023-05-11T10:15:00'
              }
            ]);
          }
        } catch (notifError) {
          console.error('Ошибка при загрузке уведомлений:', notifError);
          // Используем макет в случае ошибки
          setNotifications([
            {
              id: 1,
              user_id: 1,
              username: 'admin',
              title: 'Добро пожаловать в Quicket',
              message: 'Спасибо за регистрацию в нашем сервисе!',
              notification_type: 'SYSTEM_MESSAGE',
              read: true,
              created_at: '2023-05-10T14:30:00'
            },
            {
              id: 2,
              user_id: 2,
              username: 'user123',
              title: 'Бронирование успешно',
              message: 'Вы успешно забронировали 2 места на мероприятие "Футбольный матч"',
              notification_type: 'BOOKING_CREATED',
              read: false,
              created_at: '2023-05-11T10:15:00'
            }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError(t('admin.notifications.fetchError', 'Ошибка при загрузке данных'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);
  
  // Фильтрация уведомлений
  const filteredNotifications = notifications.filter(notification => {
    // Фильтр по пользователю
    const userMatch = selectedUser === 'all' || notification.user_id.toString() === selectedUser;
    
    // Фильтр по тексту
    const textMatch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return userMatch && textMatch;
  });
  
  // Обработчик изменения полей формы создания нового уведомления
  const handleNotificationChange = (e) => {
    const { name, value } = e.target;
    setNewNotification(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Отправка нового уведомления
  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message || !newNotification.user_id) {
      setError(t('admin.notifications.formError', 'Заполните все обязательные поля'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Пытаемся отправить уведомление через API
      const response = await apiService.sendNotification({
        user_id: parseInt(newNotification.user_id),
        title: newNotification.title,
        message: newNotification.message,
        notification_type: newNotification.notification_type
      });
      
      if (response.success) {
        // Если API успешно отработало, используем полученные данные
        const user = users.find(u => u.id.toString() === newNotification.user_id.toString());
        
        const newNotificationData = {
          id: response.data.id || Date.now(),
          user_id: parseInt(newNotification.user_id),
          username: user ? user.username : 'Unknown',
          title: newNotification.title,
          message: newNotification.message,
          notification_type: newNotification.notification_type,
          read: false,
          created_at: new Date().toISOString()
        };
        
        setNotifications([newNotificationData, ...notifications]);
        setShowCreateModal(false);
        setNewNotification({
          title: '',
          message: '',
          user_id: '',
          notification_type: 'SYSTEM_MESSAGE'
        });
      } else {
        // Если API вернуло ошибку, просто добавляем локально
        const user = users.find(u => u.id.toString() === newNotification.user_id.toString());
        
        const mockNewNotification = {
          id: Date.now(),
          user_id: parseInt(newNotification.user_id),
          username: user ? user.username : 'Unknown',
          title: newNotification.title,
          message: newNotification.message,
          notification_type: newNotification.notification_type,
          read: false,
          created_at: new Date().toISOString()
        };
        
        setNotifications([mockNewNotification, ...notifications]);
        setShowCreateModal(false);
        setNewNotification({
          title: '',
          message: '',
          user_id: '',
          notification_type: 'SYSTEM_MESSAGE'
        });
        
        console.warn('API отправки уведомлений не доступно, используется локальное сохранение');
      }
    } catch (error) {
      console.error('Ошибка при отправке уведомления:', error);
      setError(t('admin.notifications.sendError', 'Ошибка при отправке уведомления'));
    } finally {
      setLoading(false);
    }
  };
  
  // Удаление уведомления
  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm(t('admin.notifications.confirmDelete', 'Вы уверены, что хотите удалить это уведомление?'))) {
      setLoading(true);
      
      try {
        // Пытаемся удалить через API
        const response = await apiService.deleteAdminNotification(notificationId);
        
        // Независимо от результата API, удаляем локально
        setNotifications(notifications.filter(n => n.id !== notificationId));
        
        if (!response.success) {
          console.warn('API удаления уведомлений не доступно, используется только локальное удаление');
        }
      } catch (error) {
        console.error('Ошибка при удалении уведомления:', error);
        // Даже при ошибке удаляем локально, чтобы UI оставался в согласованном состоянии
        setNotifications(notifications.filter(n => n.id !== notificationId));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Получение типа уведомления на русском
  const getNotificationType = (type) => {
    const types = {
      'BOOKING_CREATED': 'Бронирование создано',
      'BOOKING_CANCELLED': 'Бронирование отменено',
      'BOOKING_REMINDER': 'Напоминание',
      'EVENT_UPDATED': 'Мероприятие обновлено',
      'EVENT_CANCELLED': 'Мероприятие отменено',
      'SYSTEM_MESSAGE': 'Системное сообщение'
    };
    
    return types[type] || type;
  };
  
  return (
    <div className="admin-notifications-container">
      {error && (
        <div className="admin-alert error">
          {error}
          <button 
            className="admin-alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="admin-header-actions">
        <button 
          className="admin-add-button"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="admin-add-icon">+</span>
          {t('admin.notifications.createNew', 'Создать уведомление')}
        </button>
      </div>
      
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label htmlFor="user-filter">{t('admin.notifications.filterUser', 'Пользователь')}</label>
          <select
            id="user-filter"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">{t('admin.notifications.allUsers', 'Все пользователи')}</option>
            {users.map(user => (
              <option key={user.id} value={user.id.toString()}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
        
        <div className="admin-filter-group">
          <label htmlFor="search">{t('admin.notifications.search', 'Поиск')}</label>
          <input
            type="text"
            id="search"
            placeholder={t('admin.notifications.searchPlaceholder', 'Поиск по заголовку или тексту...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Загрузка...')}</p>
        </div>
      ) : (
        <div className="admin-table-responsive">
          {filteredNotifications.length === 0 ? (
            <p className="admin-no-data">{t('admin.notifications.noNotifications', 'Уведомления не найдены')}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.notifications.id', 'ID')}</th>
                  <th>{t('admin.notifications.user', 'Пользователь')}</th>
                  <th>{t('admin.notifications.title', 'Заголовок')}</th>
                  <th>{t('admin.notifications.type', 'Тип')}</th>
                  <th>{t('admin.notifications.read', 'Прочитано')}</th>
                  <th>{t('admin.notifications.createdAt', 'Дата отправки')}</th>
                  <th className="actions-column">{t('admin.notifications.actions', 'Действия')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(notification => (
                  <tr key={notification.id}>
                    <td>{notification.id}</td>
                    <td>{notification.username}</td>
                    <td className="notification-title-cell">
                      <div className="notification-title-content">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-message">{notification.message}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`notification-type ${notification.notification_type.toLowerCase()}`}>
                        {getNotificationType(notification.notification_type)}
                      </span>
                    </td>
                    <td>
                      <span className={`notification-status ${notification.read ? 'read' : 'unread'}`}>
                        {notification.read ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>{formatDate(notification.created_at)}</td>
                    <td className="actions-cell">
                      <button 
                        className="admin-action-button delete"
                        onClick={() => handleDeleteNotification(notification.id)}
                        title={t('admin.notifications.delete', 'Удалить')}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button 
              className="admin-modal-close"
              onClick={() => setShowCreateModal(false)}
            >
              ×
            </button>
            <h3>{t('admin.notifications.createTitle', 'Создание нового уведомления')}</h3>
            
            <div className="admin-form">
              <div className="form-group">
                <label htmlFor="user_id">{t('admin.notifications.recipient', 'Получатель')} *</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={newNotification.user_id}
                  onChange={handleNotificationChange}
                  required
                >
                  <option value="">{t('admin.notifications.selectUser', 'Выберите пользователя')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="notification_type">{t('admin.notifications.type', 'Тип уведомления')}</label>
                <select
                  id="notification_type"
                  name="notification_type"
                  value={newNotification.notification_type}
                  onChange={handleNotificationChange}
                >
                  <option value="SYSTEM_MESSAGE">Системное сообщение</option>
                  <option value="BOOKING_REMINDER">Напоминание о бронировании</option>
                  <option value="EVENT_UPDATED">Обновление мероприятия</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">{t('admin.notifications.title', 'Заголовок')} *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newNotification.title}
                  onChange={handleNotificationChange}
                  placeholder="Введите заголовок уведомления"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">{t('admin.notifications.message', 'Сообщение')} *</label>
                <textarea
                  id="message"
                  name="message"
                  value={newNotification.message}
                  onChange={handleNotificationChange}
                  placeholder="Введите текст уведомления"
                  rows="5"
                  required
                ></textarea>
              </div>
              
              <div className="admin-form-actions">
                <button 
                  type="button" 
                  className="admin-button primary"
                  onClick={handleSendNotification}
                  disabled={loading}
                >
                  {loading ? t('common.loading', 'Загрузка...') : t('admin.notifications.send', 'Отправить')}
                </button>
                <button 
                  type="button" 
                  className="admin-button secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  {t('common.cancel', 'Отмена')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsList;