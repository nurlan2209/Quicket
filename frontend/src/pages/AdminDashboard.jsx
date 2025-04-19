import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import apiService from '../services/api';

import '../styles/AdminDashboard.css';
import '../styles/AdminForm.css';

// Import admin components
import AdminEventForm from '../components/Admin/AdminEventForm';
import AdminEventsList from '../components/Admin/AdminEventsList';
import AdminVenuesList from '../components/Admin/AdminVenuesList';
import AdminVenueForm from '../components/Admin/AdminVenueForm';
import AdminStats from '../components/Admin/AdminStats';
const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  // State for modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  // Fetch statistics for dashboard
  useEffect(() => {
    const fetchAdminData = async () => {
      if (activeTab === 'dashboard') {
        try {
          setLoading(true);
          setError(null);
          
          // In a production app, these would be real API calls
          // For now we'll use a combination of mock data and real API endpoints where available
          
          // Attempt to fetch real stats if available
          try {
            const [bookingsStats, eventsStats, usersStats] = await Promise.all([
              apiService.getAdminBookingStats(),
              apiService.getAdminEventStats(),
              apiService.getAdminUserStats()
            ]);
            
            setStats({
              bookings: bookingsStats,
              events: eventsStats,
              users: usersStats
            });
          } catch (apiError) {
            console.log('Using mock data for stats as API returned error:', apiError);
            
            // Fallback to mock data if API calls fail
            const mockStats = {
              bookings: {
                total_bookings: 152,
                status_stats: { confirmed: 118, cancelled: 34 },
                daily_stats: { 
                  "2023-04-15": 12, 
                  "2023-04-16": 18, 
                  "2023-04-17": 25, 
                  "2023-04-18": 20,
                  "2023-04-19": 28
                },
                top_events: [
                  { id: 1, title: 'Футбол Премьер-лига', bookings_count: 45 },
                  { id: 2, title: 'Баскетбол', bookings_count: 32 },
                  { id: 3, title: 'Волейбол', bookings_count: 24 },
                  { id: 4, title: 'Теннис', bookings_count: 18 },
                  { id: 5, title: 'Плавание', bookings_count: 12 }
                ]
              },
              events: {
                total_events: 36,
                type_stats: { 
                  SPORT: 15, 
                  CONCERT: 8, 
                  THEATER: 5, 
                  EXHIBITION: 4,
                  WORKSHOP: 2,
                  OTHER: 2
                },
                status_stats: { 
                  UPCOMING: 24, 
                  ONGOING: 5, 
                  FINISHED: 3, 
                  CANCELLED: 4 
                },
                venue_stats: [
                  { id: 1, name: 'Центральный стадион', events_count: 12 },
                  { id: 2, name: 'Дворец спорта', events_count: 8 },
                  { id: 3, name: 'Арена', events_count: 6 },
                  { id: 4, name: 'Плавательный бассейн', events_count: 5 },
                  { id: 5, name: 'Теннисный корт', events_count: 4 }
                ]
              },
              users: {
                total_users: 245,
                admin_count: 3,
                top_users: [
                  { id: 1, username: 'user123', bookings_count: 8 },
                  { id: 2, username: 'sport_fan', bookings_count: 6 },
                  { id: 3, username: 'john_doe', bookings_count: 5 },
                  { id: 4, username: 'mary_smith', bookings_count: 4 },
                  { id: 5, username: 'alex_jones', bookings_count: 3 }
                ],
                monthly_stats: { 
                  '2023-01': 45, 
                  '2023-02': 52, 
                  '2023-03': 65,
                  '2023-04': 83 
                }
              }
            };
            
            setStats(mockStats);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching statistics:', error);
          setError(t('admin.dashboard.fetchError', 'Ошибка при загрузке статистики. Пожалуйста, попробуйте позже.'));
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [activeTab, t]);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Handle event creation
  const handleCreateEvent = () => {
    setShowEventModal(true);
  };

  // Handle venue creation
  const handleCreateVenue = () => {
    setSelectedVenue(null);
    setShowVenueModal(true);
  };

  // Handle event save
  const handleSaveEvent = async (eventData) => {
    try {
      setLoading(true);
      const token = user.token || localStorage.getItem('authToken');
      const response = await apiService.createEvent(eventData, token);
      
      if (response.success) {
        setShowEventModal(false);
        
        // Refresh events list if we're on the events tab
        if (activeTab === 'events') {
          // In a real app, we would refresh the events list here
          // For now, just simulate success
        }
      } else {
        setError(response.message || t('admin.events.saveError', 'Ошибка при сохранении мероприятия'));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(t('admin.events.saveError', 'Ошибка при сохранении мероприятия'));
      setLoading(false);
    }
  };

  // Handle venue save
  const handleSaveVenue = async (venueData) => {
    try {
      setLoading(true);
      let response;
      
      if (selectedVenue) {
        // Update existing venue
        response = await apiService.updateVenue(selectedVenue.id, venueData);
      } else {
        // Create new venue
        response = await apiService.createVenue(venueData);
      }
      
      if (response.success) {
        setShowVenueModal(false);
        setSelectedVenue(null);
        
        // Refresh venues list if we're on the venues tab
        if (activeTab === 'venues') {
          // In a real app, we would refresh the venues list here
          // For now, just simulate success
        }
      } else {
        setError(response.message || t('admin.venues.saveError', 'Ошибка при сохранении спортивного объекта'));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving venue:', error);
      setError(t('admin.venues.saveError', 'Ошибка при сохранении спортивного объекта'));
      setLoading(false);
    }
  };

  // Component for dashboard stats overview
  const DashboardOverview = () => (
    <div className="admin-stats-overview">
      <div className="admin-stat-card">
        <div className="admin-stat-icon events">🎭</div>
        <div className="admin-stat-details">
          <h3>{t('admin.dashboard.events', 'Мероприятия')}</h3>
          <div className="admin-stat-value">{stats?.events?.total_events || 0}</div>
          <div className="admin-stat-text">{t('admin.dashboard.totalEvents', 'Всего мероприятий')}</div>
        </div>
      </div>
      
      <div className="admin-stat-card">
        <div className="admin-stat-icon bookings">🎟️</div>
        <div className="admin-stat-details">
          <h3>{t('admin.dashboard.bookings', 'Бронирования')}</h3>
          <div className="admin-stat-value">{stats?.bookings?.total_bookings || 0}</div>
          <div className="admin-stat-text">{t('admin.dashboard.totalBookings', 'Всего бронирований')}</div>
        </div>
      </div>
      
      <div className="admin-stat-card">
        <div className="admin-stat-icon users">👥</div>
        <div className="admin-stat-details">
          <h3>{t('admin.dashboard.users', 'Пользователи')}</h3>
          <div className="admin-stat-value">{stats?.users?.total_users || 0}</div>
          <div className="admin-stat-text">{t('admin.dashboard.totalUsers', 'Всего пользователей')}</div>
        </div>
      </div>
      
      <div className="admin-stat-card">
        <div className="admin-stat-icon admins">👑</div>
        <div className="admin-stat-details">
          <h3>{t('admin.dashboard.admins', 'Администраторы')}</h3>
          <div className="admin-stat-value">{stats?.users?.admin_count || 0}</div>
          <div className="admin-stat-text">{t('admin.dashboard.totalAdmins', 'Администраторов')}</div>
        </div>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Загрузка...')}</p>
        </div>
      );
    }

    if (error && activeTab === 'dashboard') {
      return (
        <div className="admin-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => setActiveTab('dashboard')}
          >
            {t('admin.dashboard.retry', 'Повторить')}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <DashboardOverview />
            <AdminStats stats={stats} />
          </>
        );
      case 'events':
        return <AdminEventsList />;
      case 'venues':
        return (
          <AdminVenuesList 
            onEdit={(venue) => {
              setSelectedVenue(venue);
              setShowVenueModal(true);
            }}
          />
        );
      case 'notifications':
        return <AdminNotificationsList />;
      case 'users':
        return <AdminUsersList />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>Quicket</h2>
            <p className="admin-role-badge">Admin Panel</p>
          </div>
          
          <nav className="admin-sidebar-nav">
            <button 
              className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="admin-nav-icon">📊</span>
              {t('admin.nav.dashboard', 'Статистика')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <span className="admin-nav-icon">🎭</span>
              {t('admin.nav.events', 'Мероприятия')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'venues' ? 'active' : ''}`}
              onClick={() => setActiveTab('venues')}
            >
              <span className="admin-nav-icon">🏟️</span>
              {t('admin.nav.venues', 'Спортивные объекты')}
            </button>

            <button 
              className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="admin-nav-icon">🔔</span>
              {t('admin.nav.notifications', 'Уведомления')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="admin-nav-icon">👥</span>
              {t('admin.nav.users', 'Пользователи')}
            </button>
          </nav>
          
          <div className="admin-sidebar-footer">
            <div className="admin-user-info">
              <div className="admin-avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-user-details">
                <p className="admin-username">{user.username || 'Admin'}</p>
                <p className="admin-email">{user.email || 'admin@quicket.kz'}</p>
              </div>
            </div>
            
            <div className="admin-actions">
              <button 
                className="admin-action-button"
                onClick={() => navigate('/')}
              >
                <span className="admin-action-icon">🏠</span>
                {t('admin.nav.backToSite', 'Вернуться на сайт')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="admin-content">
          <div className="admin-content-header">
            <h1 className="admin-page-title">
              {activeTab === 'dashboard' && t('admin.dashboard.title', 'Статистика')}
              {activeTab === 'events' && t('admin.events.title', 'Управление мероприятиями')}
              {activeTab === 'venues' && t('admin.venues.title', 'Управление спортивными объектами')}
              {activeTab === 'notifications' && t('admin.notifications.title', 'Управление уведомлениями')}
              {activeTab === 'users' && t('admin.users.title', 'Управление пользователями')}
            </h1>
            
            <div className="admin-header-actions">
              {activeTab === 'events' && (
                <button 
                  className="admin-add-button"
                  onClick={handleCreateEvent}
                >
                  <span className="admin-add-icon">+</span>
                  {t('admin.events.addNew', 'Создать мероприятие')}
                </button>
              )}
              
              {activeTab === 'venues' && (
                <button 
                  className="admin-add-button"
                  onClick={handleCreateVenue}
                >
                  <span className="admin-add-icon">+</span>
                  {t('admin.venues.addNew', 'Добавить спортивный объект')}
                </button>
              )}
            </div>
          </div>
          
          <div className="admin-content-body">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Event Creation/Editing Modal */}
      {showEventModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button 
              className="admin-modal-close"
              onClick={() => setShowEventModal(false)}
            >
              ×
            </button>
            <AdminEventForm 
              onSave={handleSaveEvent}
              onCancel={() => setShowEventModal(false)}
            />
          </div>
        </div>
      )}

      {/* Venue Creation/Editing Modal */}
      {showVenueModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button 
              className="admin-modal-close"
              onClick={() => {
                setShowVenueModal(false);
                setSelectedVenue(null);
              }}
            >
              ×
            </button>
            <AdminVenueForm 
              venue={selectedVenue}
              onSave={handleSaveVenue}
              onCancel={() => {
                setShowVenueModal(false);
                setSelectedVenue(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;