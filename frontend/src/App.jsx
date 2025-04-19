import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AuthContext } from './contexts/AuthContext';

import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import GlobalLanguageSwitcher from './components/Layout/GlobalLanguageSwitcher';

import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingsPage from './pages/BookingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';

import './i18n';
import './styles/global.css';

const createLogoPlaceholder = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0D1B2A';
  ctx.fillRect(0, 0, 200, 200);

  ctx.fillStyle = '#2FB99A';
  ctx.beginPath();
  ctx.arc(100, 100, 70, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', 100, 100);

  ctx.fillStyle = '#CFA570';
  ctx.beginPath();
  ctx.arc(140, 60, 25, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toDataURL();
};

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

  if (logoUrl && typeof window !== 'undefined') {
    window.appLogo = logoUrl;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="app">
        <GlobalLanguageSwitcher />
        <Sidebar menuOpen={menuOpen} toggleMenu={toggleMenu} logoUrl={logoUrl} />

        <div className={`main-content ${menuOpen ? 'shifted' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
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
  );
}

export default App;