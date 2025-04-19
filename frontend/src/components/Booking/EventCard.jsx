import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/EventCard.css';

const EventCard = ({ event }) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const language = i18n.language || 'kz';
    // Маппинг языков для корректного отображения дат
    const localeMap = {
      kz: 'kk-KZ',
      ru: 'ru-RU',
      en: 'en-US'
    };
    return new Date(dateString).toLocaleDateString(localeMap[language], options);
  };

  const getSeatsStatusClass = () => {
    if (event.available_seats === 0) return 'seats-sold-out';
    if (event.available_seats < 5) return 'seats-limited';
    return 'seats-available';
  };

  const getSeatsStatusText = () => {
    if (event.available_seats === 0) return t('eventCard.soldOut');
    if (event.available_seats < 5) return t('eventCard.limitedSeats', { count: event.available_seats });
    return t('eventCard.availableSeats', { count: event.available_seats });
  };

  return (
    <div className="event-card">
      {event.image && (
        <div className="event-card-image">
          <img src={event.image} alt={event.title} />
        </div>
      )}

      {event.available_seats < 5 && event.available_seats > 0 && (
        <div className="limited-badge">{t('eventCard.limitedBadge')}</div>
      )}
      
      <div
        className="event-card-header"
        style={{
          backgroundImage: event.headerImage
            ? `url(${event.headerImage})`
            : 'none',
        }}
      >
        <h3 className="event-card-title">{event.title}</h3>
        <span className="event-type-badge">{event.type}</span>
      </div>
      
      <div className="event-card-content">
        <div className="event-info">
          <div className="event-info-item">
            <span className="event-info-icon">📅</span>
            <span>{formatDate(event.date)}</span>
          </div>
          
          <div className="event-info-item">
            <span className="event-info-icon">⏰</span>
            <span>{event.time}</span>
          </div>
          
          <div className="event-info-item">
            <span className="event-info-icon">📍</span>
            <span>{event.venue_name}</span>
          </div>
        </div>

        <div className="event-price-seats">
          <div className="event-price">{event.price} тг</div>
          <div className="event-seats">
            <span className={getSeatsStatusClass()}>
              {getSeatsStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="event-card-footer">
        <Link to={`/events/${event.id}`} className="btn btn-primary view-details-btn">
          {t('events.viewDetails')}
        </Link>
      </div>
    </div>
  );
};

export default EventCard;