import React from 'react';
import { useTranslation } from 'react-i18next';


const AdminStats = ({ stats }) => {
  const { t } = useTranslation();
  
  if (!stats) {
    return (
      <div className="admin-no-stats">
        <p>{t('admin.stats.noData')}</p>
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
        <h2>{t('admin.stats.title')}</h2>
        <p>{t('admin.stats.description')}</p>
      </div>
      
      <div className="admin-stats-overview">
        <div className="admin-stat-card">
          <div className="admin-stat-icon users">👥</div>
          <div className="admin-stat-details">
            <h3>{t('admin.stats.users.title')}</h3>
            <div className="admin-stat-value">{users.total_users}</div>
            <div className="admin-stat-label">{t('admin.stats.users.total')}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon events">🎭</div>
          <div className="admin-stat-details">
            <h3>{t('admin.stats.events.title')}</h3>
            <div className="admin-stat-value">{events.total_events}</div>
            <div className="admin-stat-label">{t('admin.stats.events.total')}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon bookings">🎟️</div>
          <div className="admin-stat-details">
            <h3>{t('admin.stats.bookings.title')}</h3>
            <div className="admin-stat-value">{bookings.total_bookings}</div>
            <div className="admin-stat-label">{t('admin.stats.bookings.total')}</div>
          </div>
        </div>
      </div>
      
      <div className="admin-stats-details">
        <div className="admin-stats-section">
          <h3>{t('admin.stats.eventTypes')}</h3>
          <div className="admin-stats-chart">
            {Object.entries(events.type_stats).map(([type, count]) => (
              <div className="admin-stats-bar-item" key={type}>
                <div className="admin-stats-bar-label">{type}</div>
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
          <h3>{t('admin.stats.bookingStatus')}</h3>
          <div className="admin-stats-chart">
            {Object.entries(bookings.status_stats).map(([status, count]) => (
              <div className="admin-stats-bar-item" key={status}>
                <div className="admin-stats-bar-label">{status}</div>
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
          <h3>{t('admin.stats.topEvents')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.stats.eventName')}</th>
                  <th>{t('admin.stats.bookings.count')}</th>
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
                    <td colSpan="2" className="no-data">{t('admin.stats.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="admin-stats-table-section">
          <h3>{t('admin.stats.topUsers')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.stats.username')}</th>
                  <th>{t('admin.stats.bookings.count')}</th>
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
                    <td colSpan="2" className="no-data">{t('admin.stats.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="admin-stats-table-section">
          <h3>{t('admin.stats.topVenues')}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>{t('admin.stats.venueName')}</th>
                  <th>{t('admin.stats.events.count')}</th>
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
                    <td colSpan="2" className="no-data">{t('admin.stats.noData')}</td>
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

// Вспомогательные функции для цветов графиков
const getTypeColor = (type) => {
  const colors = {
    'sport': '#4CAF50',
    'concert': '#2196F3',
    'theater': '#9C27B0',
    'exhibition': '#FF9800',
    'workshop': '#795548',
    'other': '#607D8B'
  };
  
  return colors[type.toLowerCase()] || '#607D8B';
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