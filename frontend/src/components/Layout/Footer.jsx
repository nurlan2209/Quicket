import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/Footer.css';

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>Quicket</h3>
            <p>
              {t('footer.description')}
            </p>
          </div>

          <div className="footer-section">
            <h4>{t('footer.navigation')}</h4>
            <ul className="footer-links">
              <li><Link to="/">{t('navigation.home')}</Link></li>
              <li><Link to="/events">{t('navigation.events')}</Link></li>
              {!localStorage.getItem('token') && (
                <>
                  <li><Link to="/login">{t('navigation.login')}</Link></li>
                  <li><Link to="/register">{t('navigation.register')}</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.contact')}</h4>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>Астана қ., Мангилик Ел, C.1.3</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">☎️</span>
              <span>+7 (778) 968 51 07</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span>info@quicket.kz</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('footer.copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;