import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import apiService from '../services/api';
import EventCard from '../components/Booking/EventCard';
import '../styles/EventCard.css';
import '../styles/FavoriteButton.css'; // Создадим такой файл отдельно

const EventsPage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]); // Список ID избранных мероприятий

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiService.getEvents();
        setEvents(data);
        setLoading(false);
      } catch (err) {
        setError(t('common.error'));
        setLoading(false);
      }
    };

    // Загружаем избранные из localStorage
    const loadFavorites = () => {
      const savedFavorites = JSON.parse(localStorage.getItem('favoriteEvents') || '[]');
      setFavorites(savedFavorites);
    };

    fetchEvents();
    loadFavorites();
  }, [t]);

  // Фильтрация событий
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) || 
                         event.venue_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Получаем уникальные типы событий
  const eventTypes = [...new Set(events.map(event => event.type))];

  // Добавление/удаление из избранных
  const toggleFavorite = (eventId) => {
    let updatedFavorites;
    
    if (favorites.includes(eventId)) {
      // Если уже в избранном, то удаляем
      updatedFavorites = favorites.filter(id => id !== eventId);
    } else {
      // Если не в избранном, то добавляем
      updatedFavorites = [...favorites, eventId];
    }
    
    // Сохраняем обновленный список в localStorage
    localStorage.setItem('favoriteEvents', JSON.stringify(updatedFavorites));
    
    // Обновляем состояние
    setFavorites(updatedFavorites);
  };

  // Проверка, находится ли мероприятие в избранном
  const isFavorite = (eventId) => {
    return favorites.includes(eventId);
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{t('events.title')}</h1>
      
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="card p-3 mb-4">
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="search">{t('events.search.label')}</label>
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  placeholder={t('events.search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="filter">{t('events.filter.label')}</label>
                <select
                  id="filter"
                  className="form-control"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">{t('events.filter.allTypes')}</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <p className="text-center">{t('common.loading')}</p>
          ) : filteredEvents.length === 0 ? (
            <div className="alert alert-warning">
              {t('events.noEvents')}
            </div>
          ) : (
            <div className="grid grid-3">
              {filteredEvents.map(event => (
                <div key={event.id} className="event-card-container">
                  <EventCard event={event} />
                  {user && (
                    <button 
                      className={`favorite-button ${isFavorite(event.id) ? 'is-favorite' : ''}`}
                      onClick={() => toggleFavorite(event.id)}
                      title={isFavorite(event.id) ? "Удалить из избранного" : "Добавить в избранное"}
                    >
                      {isFavorite(event.id) ? '★' : '☆'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;