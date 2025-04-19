import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';

const Register = ({ onSuccess }) => {
  const { t } = useTranslation();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Проверка email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация данных
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
        
        // Вызов колбэка успешной регистрации
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
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
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">
          {t('auth.register.success')}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('auth.register.username')}</label>
          <input
            type="text"
            id="username"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading || success}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">{t('auth.register.email')}</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">{t('auth.register.password')}</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('auth.register.confirm_password')}</label>
          <input
            type="password"
            id="confirmPassword"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || success}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary btn-block" 
          style={{ width: '100%' }}
          disabled={loading || success}
        >
          {loading ? t('auth.register.loading') : t('auth.register.button')}
        </button>
      </form>
    </div>
  );
};

export default Register;