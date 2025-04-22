import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import GlobalLanguageSwitcher from './components/Layout/GlobalLanguageSwitcher';

import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';

import './i18n';
import './styles/global.css';
import './styles/themes.css';
import './styles/FavoriteButton.css';
import './styles/StickyFooter.css'; // Добавляем стили для футера

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Ошибка при чтении данных пользователя:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!user || user.role !== 'admin') {
      return <Navigate to="/" />;
    }
    return children;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <div className="app">
          <GlobalLanguageSwitcher />
          <Sidebar menuOpen={menuOpen} toggleMenu={toggleMenu} logoUrl={logoUrl} />

          <div className={`main-content ${menuOpen ? 'shifted' : ''}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<div className="events-page-container"><EventsPage /></div>} />
              <Route path="/events/:id" element={<div className="event-detail-container"><EventDetailPage /></div>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <div className="profile-page-container">
                      <ProfilePage />
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <div className="notifications-page">
                      <NotificationsPage />
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            <Footer />
          </div>
        </div>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;