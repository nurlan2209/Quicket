import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import '../styles/Auth.css';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Валидация email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!username || !email || !password || !confirmPassword) {
      setError(t('auth.register.error.fill_all'));
      return;
    }
    
    if (!isValidEmail(email)) {
      setError(t('auth.register.error.email_invalid'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.register.error.passwords_not_match'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('auth.register.error.password_length'));
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await apiService.register(username, email, password);
      
      if (response.success) {
        setSuccess(true);
        // Перенаправление на страницу входа через 2 секунды
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || t('auth.register.error.register_error'));
      }
    } catch (err) {
      setError(t('auth.register.error.username_email_exists'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📝</div>
          <h2 className="auth-title">{t('auth.register.title')}</h2>
          <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
        </div>
        
        <div className="auth-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && (
            <div className="alert alert-success">
              {t('auth.register.success')}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label htmlFor="username">{t('auth.register.username')}</label>
              <span className="auth-input-icon">👤</span>
              <input
                type="text"
                id="username"
                className="auth-input-field"
                placeholder={t('auth.register.username_placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || success}
              />
            </div>
            
            <div className="auth-input-group">
              <label htmlFor="email">{t('auth.register.email')}</label>
              <span className="auth-input-icon">✉️</span>
              <input
                type="email"
                id="email"
                className="auth-input-field"
                placeholder={t('auth.register.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>
            
            <div className="auth-input-group">
              <label htmlFor="password">{t('auth.register.password')}</label>
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                id="password"
                className="auth-input-field"
                placeholder={t('auth.register.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
              />
            </div>
            
            <div className="auth-input-group">
              <label htmlFor="confirmPassword">{t('auth.register.confirm_password')}</label>
              <span className="auth-input-icon">🔐</span>
              <input
                type="password"
                id="confirmPassword"
                className="auth-input-field"
                placeholder={t('auth.register.confirm_password_placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || success}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading || success}
            >
              {loading ? t('auth.register.loading') : t('auth.register.button')}
            </button>
          </form>
          
          <div className="auth-redirect">
            {t('auth.register.has_account')} <Link to="/login">{t('auth.register.login_link')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;