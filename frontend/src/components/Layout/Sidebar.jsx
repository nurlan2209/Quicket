import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import '../../styles/Sidebar.css';

const Sidebar = ({ menuOpen, toggleMenu, logoUrl }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications count for the badge
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await apiService.getUnreadNotificationsCount(user.id);
          if (response.success) {
            setUnreadCount(response.count);
          }
        } catch (error) {
          console.error('Error fetching unread notifications count:', error);
        }
      };

      fetchUnreadCount();
      // Set up interval to refresh unread count every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar-container">
      <button className="mobile-menu-button" onClick={toggleMenu}>
        {menuOpen ? '✕' : '☰'}
      </button>
      
      <div 
        className={`sidebar-overlay ${menuOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
      ></div>
      
      <div className={`sidebar ${menuOpen ? 'active' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/">
            <img src="/logo_q.png" alt="Logo" />
            QUICKET
          </Link>
        </div>
        
        <ul className="sidebar-links">
          <li>
            <Link to="/" onClick={toggleMenu}>
              <span role="img" aria-label="home" className="icon">🏠</span>
              {t('navigation.home')}
              <span className="arrow">→</span>
            </Link>
          </li>
          <li>
            <Link to="/events" onClick={toggleMenu}>
              <span role="img" aria-label="events" className="icon">🎭</span>
              {t('navigation.events')}
              <span className="arrow">→</span>
            </Link>
          </li>
          
          {user && (
            <>
              <li>
                <Link to="/notifications" onClick={toggleMenu}>
                  <span role="img" aria-label="notifications" className="icon">🔔</span>
                  {t('navigation.notifications')}
                  {unreadCount > 0 && (
                    <span className="sidebar-notification-badge">{unreadCount}</span>
                  )}
                  <span className="arrow">→</span>
                </Link>
              </li>
              <li>
                <Link to="/bookings" onClick={toggleMenu}>
                  <span role="img" aria-label="bookings" className="icon">🎟️</span>
                  {t('navigation.bookings')}
                  <span className="arrow">→</span>
                </Link>
              </li>
              
              {/* Admin Panel link - only visible for admin users */}
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin" onClick={toggleMenu}>
                    <span role="img" aria-label="admin" className="icon">⚙️</span>
                    Admin Panel
                    <span className="arrow">→</span>
                  </Link>
                </li>
              )}
            </>
          )}
          
          {!user ? (
            <>
              <li>
                <Link to="/login" onClick={toggleMenu}>
                  <span role="img" aria-label="login" className="icon">🔑</span>
                  {t('navigation.login')}
                  <span className="arrow">→</span>
                </Link>
              </li>
              <li>
                <Link to="/register" onClick={toggleMenu}>
                  <span role="img" aria-label="register" className="icon">📝</span>
                  {t('navigation.register')}
                  <span className="arrow">→</span>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <button onClick={handleLogout} className="sidebar-link-button">
                <span role="img" aria-label="logout" className="icon">🚪</span>
                {t('navigation.logout')}
                <span className="arrow">→</span>
              </button>
            </li>
          )}
        </ul>
        
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-name">{user.username || user.name || 'User'}</div>
            {user.role === 'admin' && (
              <div className="user-role">Administrator</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;