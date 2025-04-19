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
// Создание мероприятия
createEvent: async (eventData) => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.post(`${API_URL}/events`, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при создании мероприятия'
    };
  }
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
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
      
      const response = await axios.get(`/api/users/${userId}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // Получение статистики по бронированиям для админ-панели
// Получение статистики по бронированиям для админ-панели
getAdminBookingStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    throw error;
  }
},

// Получение статистики по мероприятиям для админ-панели
getAdminEventStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
},

// Получение статистики по пользователям для админ-панели
getAdminUserStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
},

// Получение всех пользователей (для админ-панели)
getAllUsers: async () => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
},

// Обновление роли пользователя (для админ-панели)
updateUserRole: async (userId, role) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, 
      { role },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при обновлении роли пользователя'
    };
  }
},

// Удаление пользователя (добавьте этот метод и соответствующий эндпоинт на сервере)
deleteUser: async (userId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении пользователя'
    };
  }
},

// Обновление мероприятия
// Обновление мероприятия
updateEvent: async (eventId, eventData) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/events/${eventId}`, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false, 
      message: error.response?.data?.message || 'Ошибка при обновлении мероприятия'
    };
  }
},

// Удаление мероприятия
deleteEvent: async (eventId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении мероприятия'
    };
  }
},

// Создание места проведения
createVenue: async (venueData) => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.post(`${API_URL}/venues`, venueData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при создании места проведения'
    };
  }
},

// Обновление места проведения
updateVenue: async (venueId, venueData) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/venues/${venueId}`, venueData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при обновлении места проведения'
    };
  }
},

// Удаление места проведения
deleteVenue: async (venueId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/venues/${venueId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении места проведения'
    };
  }
}
  };

  


export default apiService;