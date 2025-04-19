import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import GlobalLanguageSwitcher from '../GlobalLanguageSwitcher';
import NotificationBadge from '../NotificationBadge';
import '../../styles/Navbar.css';

const Navbar = ({ onOpenSidebar }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle-btn" onClick={onOpenSidebar}>
          <span className="material-icons">menu</span>
        </button>
        <Link to="/" className="logo">QUICKET</Link>
      </div>
      
      <div className="navbar-middle">
        <nav className="nav-menu">
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            {t('navigation.home')}
          </Link>
          <Link 
            to="/events" 
            className={`nav-item ${location.pathname.startsWith('/events') ? 'active' : ''}`}
          >
            {t('navigation.events')}
          </Link>
          {user && (
            <Link 
              to="/bookings" 
              className={`nav-item ${location.pathname.startsWith('/bookings') ? 'active' : ''}`}
            >
              {t('navigation.myBookings')}
            </Link>
          )}
        </nav>
      </div>
      
      <div className="navbar-right">
        <GlobalLanguageSwitcher />
        
        {user ? (
          <>
            {/* Компонент уведомлений */}
            <NotificationBadge />
            
            <div className="user-dropdown">
              <div className="avatar-container" onClick={toggleDropdown}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                    <span className="material-icons">person</span>
                    {t('navigation.profile')}
                  </Link>
                  <Link to="/notifications" className="dropdown-item" onClick={closeDropdown}>
                    <span className="material-icons">notifications</span>
                    {t('navigation.notifications')}
                  </Link>
                  <Link to="/bookings" className="dropdown-item" onClick={closeDropdown}>
                    <span className="material-icons">confirmation_number</span>
                    {t('navigation.myBookings')}
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={() => { 
                    closeDropdown();
                    // logout(); // Эта функция должна быть передана из AuthContext
                  }}>
                    <span className="material-icons">logout</span>
                    {t('navigation.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="login-btn">{t('navigation.login')}</Link>
            <Link to="/register" className="register-btn">{t('navigation.register')}</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;