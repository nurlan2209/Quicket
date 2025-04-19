import axios from 'axios';
// Базовый URL API
const API_URL = '/api';

// Вспомогательная функция для проверки ответа от сервера
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Если ответ не успешный, генерируем ошибку с сообщением от сервера
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

// Сервис для работы с API
const apiService = {
  // Авторизация
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },
  
  // Регистрация
  register: async (username, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(response);
  },
  
  // Получение всех мероприятий
  getEvents: async () => {
    const response = await fetch(`${API_URL}/events`);
    return handleResponse(response);
  },
  
  // Получение информации о конкретном мероприятии
  getEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/events/${eventId}`);
    return handleResponse(response);
  },
  
  // Создание мероприятия (требует прав администратора)
  createEvent: async (eventData, token) => {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    return handleResponse(response);
  },
  
  // Бронирование места на мероприятии
  createBooking: async (bookingData) => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return handleResponse(response);
  },
  
  // Получение всех бронирований пользователя
  getUserBookings: async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}/bookings`);
    return handleResponse(response);
  },
  
  // Отмена бронирования
  cancelBooking: async (bookingId, userId) => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return handleResponse(response);
  },
  
  // Получение всех спортивных объектов
  getVenues: async () => {
    const response = await fetch(`${API_URL}/venues`);
    return handleResponse(response);
  },

  // Добавьте эти методы в ваш существующий apiService.js

// Получение уведомлений пользователя
  getUserNotifications: async (userId, options = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) {
        params.append('limit', options.limit);
      }
    
    if (options.page) {
      params.append('page', options.page);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(`/api/users/${userId}/notifications${queryString}`);
    
    return {
      success: true,
      data: response.data
    };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка при загрузке уведомлений'
      };
    }
  },

  // Получение количества непрочитанных уведомлений
  getUnreadNotificationsCount: async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/notifications/unread-count`);
      
      return {
        success: true,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      return {
        success: false,
        count: 0
      };
    }
  },

  // Отметить уведомление как прочитанное
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await axios.patch(`/api/notifications/${notificationId}/read`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка при обновлении статуса уведомления'
      };
    }
  },

  // Отметить все уведомления пользователя как прочитанные
  markAllNotificationsAsRead: async (userId) => {
    try {
      const response = await axios.patch(`/api/users/${userId}/notifications/mark-all-read`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка при обновлении статуса уведомлений'
      };
    }
  },

  // Удаление уведомления
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка при удалении уведомления'
      };
    }
  },
  };


export default apiService;