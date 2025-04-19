import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import EventCard from '../components/Booking/EventCard';
import '../styles/HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      try {
        const events = await apiService.getEvents();
        setRecentEvents(events.slice(0, 3));
        setLoading(false);
      } catch (err) {
        setError(t('common.error'));
        setLoading(false);
      }
    };

    fetchRecentEvents();
  }, [t]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content container">
          <div className="hero-text">
            <h1>{t('homepage.hero.title')}</h1>
            <p>
              {t('homepage.hero.subtitle')}
            </p>
            <div className="hero-buttons">
              <Link to="/events" className="btn-primary">
                {t('homepage.hero.findEvents')}
              </Link>
              {!localStorage.getItem('user') && (
                <Link to="/register" className="btn-outline">
                  {t('homepage.hero.register')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="recent-events-section container">
        <div className="section-header">
          <h2>{t('homepage.recentEvents.title')}</h2>
          <Link to="/events" className="btn-outline-secondary">
            {t('homepage.recentEvents.viewAll')}
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <div className="events-grid">
              {recentEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            
            {recentEvents.length > 0 && (
              <div className="view-all-container">
                <Link to="/events" className="btn-primary">
                  {t('homepage.recentEvents.allEvents')}
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{t('homepage.cta.title')}</h2>
            <p>{t('homepage.cta.subtitle')}</p>
            <Link to="/register" className="btn-primary">
              {t('homepage.cta.register')}
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="features-title">{t('homepage.features.title')}</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>{t('homepage.features.simpleBooking.title')}</h3>
              <p>{t('homepage.features.simpleBooking.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t('homepage.features.onlinePayment.title')}</h3>
              <p>{t('homepage.features.onlinePayment.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>{t('homepage.features.multilingual.title')}</h3>
              <p>{t('homepage.features.multilingual.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>{t('homepage.features.mobileAccess.title')}</h3>
              <p>{t('homepage.features.mobileAccess.description')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;