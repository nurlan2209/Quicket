import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import '../../styles/Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Простая валидация
    if (!username || !password) {
      setError(t('auth.login.error.fill_all'));
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        login(response.user);
        navigate('/');
      } else {
        setError(response.message || t('auth.login.error.login_error'));
      }
    } catch (err) {
      setError(t('auth.login.error.wrong_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label htmlFor="username">{t('auth.login.username')}</label>
          <span className="auth-input-icon">👤</span>
          <input
            type="text"
            id="username"
            className="auth-input-field"
            placeholder={t('auth.login.username_placeholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="auth-input-group">
          <label htmlFor="password">{t('auth.login.password')}</label>
          <span className="auth-input-icon">🔒</span>
          <input
            type="password"
            id="password"
            className="auth-input-field"
            placeholder={t('auth.login.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? t('auth.login.loading') : t('auth.login.button')}
        </button>
      </form>
    </div>
  );
};

export default Login;