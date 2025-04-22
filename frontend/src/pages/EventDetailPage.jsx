import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import BookingForm from '../components/Booking/BookingForm';
import '../styles/EventDetail.css';
import apiService from '../services/api';

const eventImages = {
  'Футбол': ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68', 'https://images.unsplash.com/photo-1508098682722-e99c643e7f3b'],
  'Баскетбол': ['https://images.unsplash.com/photo-1577471488278-16eec37ffcc2', 'https://images.unsplash.com/photo-1519861531473-9200262188bf'],
  'Волейбол': ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8', 'https://images.unsplash.com/photo-1592656094267-764a45160876'],
  'Теннис': ['https://images.unsplash.com/photo-1546519638-68e109498ffc', 'https://images.unsplash.com/photo-1511067007398-7e4b90631c3a'],
  'Плавание': ['https://images.unsplash.com/photo-1517649763962-0c623066013b', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487'],
  'Бокс': ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5', 'https://images.unsplash.com/photo-1517438476312-10d79c077509'],
  'Бег': ['https://images.unsplash.com/photo-1517438476312-10d79c077509', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5'],
  'Йога': ['https://images.unsplash.com/photo-1599058917212-d750089bc07e', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'],
  'default': ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55']
};

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const [musicButtonVisible, setMusicButtonVisible] = useState(false);
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiService.getEvent(id);
        setEvent(data);
        setLoading(false);
      } catch (err) {
        setError(t('eventDetail.error'));
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, t]);
  
  useEffect(() => {
    // Очищаем предыдущее аудио при смене события
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setMusicPlaying(false);
    }
    
    // Проверяем, есть ли фоновая музыка у текущего события
    if (event && event.type === 'CONCERT' && event.background_music_url) {
      // Показываем кнопку только если указан URL музыки
      setMusicButtonVisible(true);
    } else {
      // Скрываем кнопку, если музыки нет
      setMusicButtonVisible(false);
    }
    
    // Очистка при размонтировании
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [event]); // Зависимость от event 
  
  // Функция для инициализации и включения музыки
const initializeAndPlayMusic = () => {
    try {
      // Проверяем наличие URL в данных события
      if (!event || !event.background_music_url) {
        console.error('URL фоновой музыки не указан');
        return;
      }
      
      // Логируем для отладки
      console.log('Инициализация аудио с URL:', event.background_music_url);
      
      // Если аудио уже создано, используем его
      if (!audioRef.current) {
        // Создаем аудио объект с URL из данных события
        audioRef.current = new Audio(event.background_music_url);
        audioRef.current.volume = (event.music_volume || 30) / 100; // Используем указанную громкость или 30%
        audioRef.current.loop = true;
        
        // Добавляем обработчики событий
        audioRef.current.addEventListener('canplaythrough', () => {
          console.log('Аудио готово к воспроизведению');
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Ошибка аудио:', e);
          console.error('Код ошибки:', audioRef.current.error ? audioRef.current.error.code : 'неизвестно');
          setMusicButtonVisible(false);
        });
      }
      
      // Показываем кнопку управления
      setMusicButtonVisible(true);
      
      // Пробуем включить аудио
      audioRef.current.play()
        .then(() => {
          console.log('Воспроизведение началось!');
          setMusicPlaying(true);
        })
        .catch(error => {
          console.error('Ошибка воспроизведения:', error);
          setMusicPlaying(false);
        });
    } catch (error) {
      console.error('Ошибка инициализации аудио:', error);
    }
};
  
// Функция для переключения воспроизведения музыки
const toggleMusic = () => {
  if (!audioRef.current) {
    // Если аудио еще не инициализировано, делаем это сейчас
    initializeAndPlayMusic();
    return;
  }
  
  if (musicPlaying) {
    // Останавливаем воспроизведение
    audioRef.current.pause();
    setMusicPlaying(false);
  } else {
    // Возобновляем воспроизведение
    audioRef.current.play()
      .then(() => {
        setMusicPlaying(true);
      })
      .catch(error => {
        console.error("Ошибка воспроизведения:", error);
      });
  }
};
  
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
  
  const getEventImages = (type) => {
    return eventImages[type] || eventImages['default'];
  };
  
  const handleBookingSuccess = async () => {
    // Обновить данные мероприятия после успешного бронирования
    try {
      const updatedEvent = await apiService.getEvent(id);
      setEvent(updatedEvent);
    } catch (error) {
      console.error('Ошибка при обновлении данных мероприятия:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="event-detail-container">
        <div className="event-detail-skeleton">
          <div className="event-header-skeleton"></div>
          <div className="event-content-skeleton">
            <div className="skeleton-grid">
              <div>
                <div className="skeleton-title"></div>
                <div className="skeleton-text long"></div>
                <div className="skeleton-text medium"></div>
                <div className="skeleton-text short"></div>
                
                <div className="skeleton-title" style={{ marginTop: '2rem' }}></div>
                <div className="skeleton-text long"></div>
                <div className="skeleton-text long"></div>
                <div className="skeleton-text medium"></div>
              </div>
              <div>
                <div className="skeleton-box"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="event-detail-container">
        <div className="alert alert-danger">{error}</div>
        <div className="text-center mt-4">
          <Link to="/events" className="btn btn-primary">
            {t('eventDetail.return')}
          </Link>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="alert alert-warning">{t('eventDetail.not_found')}</div>
        <div className="text-center mt-4">
          <Link to="/events" className="btn btn-primary">
            {t('eventDetail.return')}
          </Link>
        </div>
      </div>
    );
  }
  
  // Получаем изображения для мероприятия
  const headerImage = event.image_url || getEventImages(event.type)[0];
  let galleryImages = [];
  
  // Если у мероприятия есть медиа-файлы
  if (event.media && event.media.length > 0) {
    // Фильтруем только изображения
    const mediaImages = event.media
      .filter(media => media.type === 'image')
      .map(media => media.url);
    
    if (mediaImages.length > 0) {
      galleryImages = mediaImages;
    } else if (event.image_url) {
      galleryImages = [event.image_url];
    } else {
      // Используем мок данные только если нет реальных изображений
      galleryImages = getEventImages(event.type);
    }
  } else if (event.image_url) {
    // Если есть хотя бы изображение обложки
    galleryImages = [event.image_url];
  } else {
    // Используем мок данные только если нет реальных изображений
    galleryImages = getEventImages(event.type);
  }
  
  // Определяем статус доступных мест
  const getSeatsStatusClass = () => {
    if (event.available_seats === 0) return 'seats-sold-out';
    if (event.available_seats < 5) return 'seats-limited';
    return 'seats-available';
  };
  
  const getSeatsStatusText = () => {
    if (event.available_seats === 0) return t('eventDetail.seats.sold_out');
    if (event.available_seats < 5) return `${t('eventDetail.seats.limited')}: ${event.available_seats}`;
    return `${t('eventDetail.seats.available')}: ${event.available_seats}`;
  };
  
  // Проверяем наличие координат для карты
  const hasMapCoordinates = event.venue_latitude && event.venue_longitude;
  
  return (
    <div className="event-detail-container">
      <div className="event-detail-card">
        <div 
          className="event-header"
          style={{ backgroundImage: `url(${headerImage})` }}
        >
          <div className="event-header-content">
            <span className="event-type">{event.type}</span>
            <h1 className="event-title">{event.title}</h1>
            
            <div className="event-location">
              <span className="event-location-icon">📍</span>
              <span>{event.venue_name}</span>
            </div>
            
            <div className="event-datetime">
              <span className="event-datetime-icon">📅</span>
              <span>{formatDate(event.date)} | {event.time}</span>
            </div>
            
            {/* Добавляем кнопку управления музыкой для концертов */}
            {/* Кнопка управления музыкой только для концертов с указанным URL аудио */}
            {(event.type === 'concert' || event.type === 'CONCERT') && event.background_music_url && (
              <div className="event-music-controls">
                <button 
                  className={`music-play-btn ${musicPlaying ? 'playing' : ''}`}
                  onClick={toggleMusic}
                >
                  {musicPlaying ? 'Приостановить музыку' : 'Включить фоновую музыку'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="event-content">
          <div className="event-detail-grid">
            <div className="event-main">
              <div className="event-meta">
                <div className="event-meta-item">
                  <span className="meta-label">{t('eventDetail.info.time')}</span>
                  <span className="meta-value">
                    <span className="meta-value-icon">⏰</span>
                    {event.time}
                  </span>
                </div>
                
                <div className="event-meta-item">
                  <span className="meta-label">{t('eventDetail.info.duration')}</span>
                  <span className="meta-value">
                    <span className="meta-value-icon">⌛</span>
                    {event.duration} {t('eventDetail.info.duration_unit')}
                  </span>
                </div>
                
                <div className="event-meta-item">
                  <span className="meta-label">{t('eventDetail.info.price')}</span>
                  <span className="meta-value">
                    <span className="meta-value-icon">💰</span>
                    {event.price} тг
                  </span>
                </div>
                
                <div className="event-meta-item">
                  <span className="meta-label">{t('eventDetail.info.seats')}</span>
                  <span className="meta-value">
                    <span className="meta-value-icon">🪑</span>
                    <span className="event-seats">
                      {event.available_seats} / {event.total_seats}
                      <span className={`seats-status ${getSeatsStatusClass()}`}>
                        {getSeatsStatusText()}
                      </span>
                    </span>
                  </span>
                </div>
                
                {/* Показываем информацию о музыке для концертов */}
                {event.type === 'CONCERT' && event.background_music_url && (
                  <div className="event-meta-item">
                    <span className="meta-label">Фоновая музыка</span>
                    <span className="meta-value">
                      <span className="meta-value-icon">🎵</span>
                      <button 
                        onClick={toggleMusic} 
                        className="music-toggle-btn"
                      >
                        {musicPlaying ? 'Приостановить' : 'Включить'}
                      </button>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="event-info-section">
                <h2 className="event-info-title">{t('eventDetail.info.about')}</h2>
                <div className="event-description">
                  <p>{event.description || t('eventDetail.info.no_description')}</p>
                </div>
              </div>
              
              <div className="event-gallery">
                <h2 className="gallery-title">{t('eventDetail.info.images')}</h2>
                <div className="gallery-grid">
                  {galleryImages.map((image, index) => (
                    <div className="gallery-item" key={index}>
                      <img src={image} alt={`${event.title} - ${t('eventDetail.info.image_alt')} ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Map Section */}
              <div className="event-map">
                <h2 className="map-title">{t('eventDetail.info.venue')}</h2>
                
                <div className="venue-info">
                  <div className="venue-icon">📍</div>
                  <div className="venue-details">
                    <h4>{event.venue_name}</h4>
                    <p className="venue-address">{event.venue_address}</p>
                  </div>
                </div>
                
                <div className="map-container">
                  {hasMapCoordinates ? (
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${event.venue_latitude},${event.venue_longitude}&zoom=15`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map - ${event.venue_name}`}
                    ></iframe>
                  ) : (
                    <div className="map-placeholder">
                      <p>{t('eventDetail.info.map')} {event.venue_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <BookingForm event={event} onBookingSuccess={handleBookingSuccess} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;