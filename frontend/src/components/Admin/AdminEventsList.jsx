import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import AdminEventForm from './AdminEventForm.jsx';


const AdminEventsList = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка данных о мероприятиях и площадках одновременно
        const [eventsResponse, venuesResponse] = await Promise.all([
          apiService.getEvents(),
          apiService.getVenues()
        ]);

        setEvents(eventsResponse);
        setVenues(venuesResponse);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError(t('admin.events.fetchError'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);
  
  // Обработчик создания/обновления мероприятия
  const handleSaveEvent = async (eventData) => {
    setLoading(true);
    
    try {
      let response;
      
      if (selectedEvent) {
        // Обновление существующего мероприятия
        response = await apiService.updateEvent(selectedEvent.id, eventData);
      } else {
        // Создание нового мероприятия
        response = await apiService.createEvent(eventData);
      }
      
      if (response.success) {
        // Обновляем список мероприятий
        const eventsResponse = await apiService.getEvents();
        setEvents(eventsResponse);
        
        setShowForm(false);
        setSelectedEvent(null);
        setError(null);
      } else {
        setError(response.message || t('admin.events.saveError'));
      }
    } catch (error) {
      console.error('Ошибка при сохранении мероприятия:', error);
      setError(t('admin.events.saveError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик удаления мероприятия
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm(t('admin.events.confirmDelete'))) {
      setLoading(true);
      
      try {
        const response = await apiService.deleteEvent(eventId);
        
        if (response.success) {
          // Обновляем список мероприятий после удаления
          setEvents(events.filter(event => event.id !== eventId));
        } else {
          setError(response.message || t('admin.events.deleteError'));
        }
      } catch (error) {
        console.error('Ошибка при удалении мероприятия:', error);
        setError(t('admin.events.deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Фильтрация мероприятий
  const filteredEvents = events.filter(event => {
    let matchesType = filterType === 'all' || event.type === filterType;
    let matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.venue_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });
  
  // Получение списка всех типов мероприятий
  const eventTypes = [...new Set(events.map(event => event.type))];
  
  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Получение имени места проведения по ID
  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.name : '';
  };
  
  return (
    <div className="admin-events-container">
      <div className="admin-events-header">
        <h2>{t('admin.events.title')}</h2>
        <button 
          className="admin-add-button"
          onClick={() => {
            setSelectedEvent(null);
            setShowForm(true);
          }}
        >
          Создать мероприятие
        </button>
      </div>
      
      {error && (
        <div className="admin-alert error">
          {error}
          <button 
            className="admin-alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label htmlFor="type-filter">Тип мероприятия</label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Все типы</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="admin-filter-group">
          <label htmlFor="search">Поиск</label>
          <input
            type="text"
            id="search"
            placeholder="Поиск по названию или месту проведения..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
  <div className="spinner"></div>
  <p>{t('common.loading')}</p>
</div>
      ) : (
        <div className="admin-table-responsive">
          {filteredEvents.length === 0 ? (
            <p className="admin-no-data">Мероприятия не найдены</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Место проведения</th>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Места</th>
                  <th>Цена</th>
                  <th>Статус</th>
                  <th className="actions-column">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td className="title-cell">{event.title}</td>
                    <td>{event.type}</td>
                    <td>{event.venue_name}</td>
                    <td>{formatDate(event.date)}</td>
                    <td>{event.time}</td>
                    <td>
                      {event.available_seats} / {event.total_seats}
                    </td>
                    <td>{event.price} тг</td>
                    <td>
                      <span className={`event-status ${event.status}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="admin-action-button edit"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowForm(true);
                        }}
                        title={t('admin.events.edit')}
                      >
                        ✏️
                      </button>
                      <button 
                        className="admin-action-button delete"
                        onClick={() => handleDeleteEvent(event.id)}
                        title={t('admin.events.delete')}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {showForm && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <button 
              className="admin-modal-close"
              onClick={() => {
                setShowForm(false);
                setSelectedEvent(null);
              }}
            >
              ×
            </button>
            <AdminEventForm 
              event={selectedEvent} 
              venues={venues}
              onSave={handleSaveEvent}
              onCancel={() => {
                setShowForm(false);
                setSelectedEvent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsList;