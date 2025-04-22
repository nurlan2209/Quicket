import React from 'react';
import { useTranslation } from 'react-i18next';

const AdminStats = ({ stats }) => {
  const { t } = useTranslation();
  
  if (!stats) {
    return (
      <div className="admin-no-stats">
        <p>Нет доступных данных</p>
      </div>
    );
  }
  
  const { bookings, events, users } = stats;
  
  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="admin-stats-container">
<div className="admin-stats-header">
  <h2>{t('admin.dashboard.title')}</h2>
  <p>{t('admin.dashboard.overview')}</p>
</div>

<div className="admin-stats-overview">
  <div className="admin-stat-card">
    <div className="admin-stat-icon users">👥</div>
    <div className="admin-stat-details">
      <h3>{t('admin.dashboard.users')}</h3>
      <div className="admin-stat-value">{users.total_users}</div>
      <div className="admin-stat-label">{t('admin.dashboard.totalUsers')}</div>
    </div>
  </div>
  
  <div className="admin-stat-card">
    <div className="admin-stat-icon events">🎭</div>
    <div className="admin-stat-details">
      <h3>{t('admin.dashboard.events')}</h3>
      <div className="admin-stat-value">{events.total_events}</div>
      <div className="admin-stat-label">{t('admin.dashboard.totalEvents')}</div>
    </div>
  </div>
  
  <div className="admin-stat-card">
    <div className="admin-stat-icon bookings">🎟️</div>
    <div className="admin-stat-details">
      <h3>{t('admin.dashboard.bookings')}</h3>
      <div className="admin-stat-value">{bookings.total_bookings}</div>
      <div className="admin-stat-label">{t('admin.dashboard.totalBookings')}</div>
    </div>
  </div>
</div>
      
      <div className="admin-stats-details">
        <div className="admin-stats-section">
          <h3>{t('admin.events.type')}</h3>
          <div className="admin-stats-chart">
            {Object.entries(events.type_stats).map(([type, count]) => (
              <div className="admin-stats-bar-item" key={type}>
                <div className="admin-stats-bar-label">{getTypeLabel(type)}</div>
                <div className="admin-stats-bar-container">
                  <div 
                    className="admin-stats-bar" 
                    style={{ 
                      width: `${Math.min(100, (count / events.total_events) * 100)}%`,
                      backgroundColor: getTypeColor(type)
                    }}
                  ></div>
                  <span className="admin-stats-bar-value">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="admin-stats-section">
        <h3>{t('admin.dashboard.bookingStatuses')}</h3>
          <div className="admin-stats-chart">
            {Object.entries(bookings.status_stats).map(([status, count]) => (
              <div className="admin-stats-bar-item" key={status}>
                <div className="admin-stats-bar-label">{getStatusLabel(status)}</div>
                <div className="admin-stats-bar-container">
                  <div 
                    className="admin-stats-bar" 
                    style={{ 
                      width: `${Math.min(100, (count / bookings.total_bookings) * 100)}%`,
                      backgroundColor: getStatusColor(status)
                    }}
                  ></div>
                  <span className="admin-stats-bar-value">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="admin-stats-tables">
        <div className="admin-stats-table-section">
        <h3>{t('admin.dashboard.topEvents')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.dashboard.EventName')}</th>
                  <th>{t('admin.dashboard.Bookings')}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.top_events.map(event => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td className="count-cell">{event.bookings_count}</td>
                  </tr>
                ))}
                {bookings.top_events.length === 0 && (
                  <tr>
                    <td colSpan="2" className="no-data">Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="admin-stats-table-section">
          <h3>{t('admin.dashboard.topUsers')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.dashboard.UserName')}</th>
                  <th>{t('admin.dashboard.BookingCount')}</th>
                </tr>
              </thead>
              <tbody>
                {users.top_users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td className="count-cell">{user.bookings_count}</td>
                  </tr>
                ))}
                {users.top_users.length === 0 && (
                  <tr>
                    <td colSpan="2" className="no-data">Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="admin-stats-table-section">
          <h3>{t('admin.dashboard.topVenues')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.dashboard.VenueName')}</th>
                  <th>{t('admin.dashboard.EventCount')}</th>
                </tr>
              </thead>
              <tbody>
                {events.venue_stats.map(venue => (
                  <tr key={venue.id}>
                    <td>{venue.name}</td>
                    <td className="count-cell">{venue.events_count}</td>
                  </tr>
                ))}
                {events.venue_stats.length === 0 && (
                  <tr>
                    <td colSpan="2" className="no-data">Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Функция для получения читаемого названия типа мероприятия
const getTypeLabel = (type) => {
  const types = {
    'SPORT': 'Спорт',
    'CONCERT': 'Концерт',
    'THEATER': 'Театр',
    'EXHIBITION': 'Выставка',
    'WORKSHOP': 'Мастер-класс',
    'OTHER': 'Другое'
  };
  
  return types[type] || type;
};

// Функция для получения читаемого названия статуса бронирования
const getStatusLabel = (status) => {
  const statuses = {
    'confirmed': 'Подтверждено',
    'cancelled': 'Отменено',
    'pending': 'В ожидании'
  };
  
  return statuses[status] || status;
};

// Вспомогательные функции для цветов графиков
const getTypeColor = (type) => {
  const colors = {
    'SPORT': '#4CAF50',
    'CONCERT': '#2196F3',
    'THEATER': '#9C27B0',
    'EXHIBITION': '#FF9800',
    'WORKSHOP': '#795548',
    'OTHER': '#607D8B'
  };
  
  return colors[type] || '#607D8B';
};

const getStatusColor = (status) => {
  const colors = {
    'confirmed': '#4CAF50',
    'cancelled': '#F44336',
    'pending': '#FFC107'
  };
  
  return colors[status] || '#607D8B';
};

export default AdminStats;