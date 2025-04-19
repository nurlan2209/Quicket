import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Login from '../components/Auth/Login';
import '../styles/Auth.css';

const LoginPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🏆</div>
          <h2 className="auth-title">{t('auth.login.title')}</h2>
          <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
        </div>
        
        <div className="auth-content">
          <Login />
          
          <div className="auth-redirect">
            {t('auth.login.no_account')} <Link to="/register">{t('auth.login.register_link')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;