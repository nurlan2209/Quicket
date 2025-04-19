import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminEventForm = ({ event, venues, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    type: 'SPORT',
    venue_id: '',
    date: '',
    time: '18:00',
    duration: 60,
    total_seats: 100,
    price: 1000,
    description: '',
    event_subtype: '',
    image_url: '',
    background_music_url: '',
    organizer: '',
    featured: false,
    status: 'UPCOMING',
    media: []
  });
  const [errors, setErrors] = useState({});
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [tempMedia, setTempMedia] = useState({ type: 'image', url: '', description: '' });

  // Типы событий
  const eventTypes = [
    { value: 'SPORT', label: 'Спорт' },
    { value: 'CONCERT', label: 'Концерт' },
    { value: 'THEATER', label: 'Театр' },
    { value: 'EXHIBITION', label: 'Выставка' },
    { value: 'WORKSHOP', label: 'Мастер-класс' },
    { value: 'OTHER', label: 'Другое' }
  ];

  // Статусы событий
  const eventStatuses = [
    { value: 'UPCOMING', label: 'Предстоящее' },
    { value: 'ONGOING', label: 'Проходит' },
    { value: 'FINISHED', label: 'Завершено' },
    { value: 'CANCELLED', label: 'Отменено' }
  ];

  // Инициализация формы при редактировании существующего события
  useEffect(() => {
    if (event) {
      const formattedDate = event.date ? event.date.split('T')[0] : '';
      
      setFormData({
        title: event.title || '',
        type: event.type || 'SPORT',
        venue_id: event.venue_id || '',
        date: formattedDate,
        time: event.time || '18:00',
        duration: event.duration || 60,
        total_seats: event.total_seats || 100,
        price: event.price || 1000,
        description: event.description || '',
        event_subtype: event.event_subtype || '',
        image_url: event.image_url || '',
        background_music_url: event.background_music_url || '',
        organizer: event.organizer || '',
        featured: event.featured || false,
        status: event.status || 'UPCOMING',
        media: event.media || []
      });
    } else {
      // Для создания нового события, устанавливаем текущую дату в формате YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      setFormData(prevData => ({
        ...prevData,
        date: `${year}-${month}-${day}`
      }));
    }
  }, [event]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Для чекбоксов берем свойство checked
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
    
    // Сбрасываем ошибку для поля, которое изменилось
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Обработчик изменения полей формы временного медиафайла
  const handleMediaChange = (e) => {
    const { name, value } = e.target;
    
    setTempMedia(prevMedia => ({
      ...prevMedia,
      [name]: value
    }));
  };

  // Добавление медиафайла
  const handleAddMedia = () => {
    if (tempMedia.url) {
      setFormData(prevData => ({
        ...prevData,
        media: [...prevData.media, { ...tempMedia }]
      }));
      
      // Сброс формы добавления медиа
      setTempMedia({ type: 'image', url: '', description: '' });
      setShowMediaForm(false);
    }
  };

  // Удаление медиафайла
  const handleDeleteMedia = (index) => {
    setFormData(prevData => ({
      ...prevData,
      media: prevData.media.filter((_, i) => i !== index)
    }));
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('admin.events.validation.titleRequired', 'Название обязательно');
    }
    
    if (!formData.venue_id) {
      newErrors.venue_id = t('admin.events.validation.venueRequired', 'Выберите место проведения');
    }
    
    if (!formData.date) {
      newErrors.date = t('admin.events.validation.dateRequired', 'Дата обязательна');
    }
    
    if (!formData.time) {
      newErrors.time = t('admin.events.validation.timeRequired', 'Время обязательно');
    }
    
    if (formData.total_seats <= 0) {
      newErrors.total_seats = t('admin.events.validation.seatsPositive', 'Количество мест должно быть положительным');
    }
    
    if (formData.price < 0) {
      newErrors.price = t('admin.events.validation.priceNonNegative', 'Цена не может быть отрицательной');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Преобразуем строковые ID в числовые перед отправкой
      const processingData = {
        ...formData,
        venue_id: parseInt(formData.venue_id, 10),
        total_seats: parseInt(formData.total_seats, 10),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10)
      };
      
      onSave(processingData);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>
        {event ? t('admin.events.editEvent', 'Редактирование мероприятия') : t('admin.events.createEvent', 'Создание нового мероприятия')}
      </h2>
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">{t('admin.events.title', 'Название')} *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="type">{t('admin.events.type', 'Тип')} *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="venue_id">{t('admin.events.venue', 'Место проведения')} *</label>
            <select
              id="venue_id"
              name="venue_id"
              value={formData.venue_id}
              onChange={handleChange}
              className={errors.venue_id ? 'error' : ''}
            >
              <option value="">{t('admin.events.selectVenue', 'Выберите место')}</option>
              {venues && venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            {errors.venue_id && <div className="error-message">{errors.venue_id}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="event_subtype">{t('admin.events.subtype', 'Подтип')} </label>
            <input
              type="text"
              id="event_subtype"
              name="event_subtype"
              value={formData.event_subtype}
              onChange={handleChange}
              placeholder={t('admin.events.subtypePlaceholder', 'Например: футбол, баскетбол и т.д.')}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">{t('admin.events.date', 'Дата')} *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <div className="error-message">{errors.date}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="time">{t('admin.events.time', 'Время')} *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={errors.time ? 'error' : ''}
            />
            {errors.time && <div className="error-message">{errors.time}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">{t('admin.events.duration', 'Продолжительность (мин.)')}</label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="10"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="total_seats">{t('admin.events.totalSeats', 'Всего мест')} *</label>
            <input
              type="number"
              id="total_seats"
              name="total_seats"
              min="1"
              value={formData.total_seats}
              onChange={handleChange}
              className={errors.total_seats ? 'error' : ''}
            />
            {errors.total_seats && <div className="error-message">{errors.total_seats}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="price">{t('admin.events.price', 'Цена (тг)')} *</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="100"
              value={formData.price}
              onChange={handleChange}
              className={errors.price ? 'error' : ''}
            />
            {errors.price && <div className="error-message">{errors.price}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="status">{t('admin.events.status', 'Статус')}</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {eventStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="organizer">{t('admin.events.organizer', 'Организатор')}</label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              {t('admin.events.featured', 'Избранное мероприятие')}
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="image_url">{t('admin.events.imageUrl', 'URL изображения')}</label>
          <input
            type="text"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="background_music_url">{t('admin.events.backgroundMusicUrl', 'URL фоновой музыки')}</label>
          <input
            type="text"
            id="background_music_url"
            name="background_music_url"
            value={formData.background_music_url}
            onChange={handleChange}
            placeholder="https://example.com/music.mp3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">{t('admin.events.description', 'Описание')}</label>
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        
        {/* Раздел медиафайлов */}
        <div className="form-section">
          <h3 className="section-title">{t('admin.events.media', 'Медиафайлы')}</h3>
          
          {formData.media.length > 0 ? (
            <div className="media-list">
              {formData.media.map((media, index) => (
                <div key={index} className="media-item">
                  <div className="media-info">
                    <strong>{media.type === 'image' ? 'Изображение' : 
                            media.type === 'video' ? 'Видео' : 'Аудио'}</strong>: {media.url}
                    {media.description && <span> ({media.description})</span>}
                  </div>
                  <button 
                    type="button" 
                    className="btn-danger btn-sm"
                    onClick={() => handleDeleteMedia(index)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-media">{t('admin.events.noMedia', 'Нет добавленных медиафайлов')}</p>
          )}
          
          {showMediaForm ? (
            <div className="media-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mediaType">{t('admin.events.mediaType', 'Тип медиа')}</label>
                  <select
                    id="mediaType"
                    name="type"
                    value={tempMedia.type}
                    onChange={handleMediaChange}
                  >
                    <option value="image">Изображение</option>
                    <option value="video">Видео</option>
                    <option value="audio">Аудио</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="mediaUrl">{t('admin.events.mediaUrl', 'URL медиафайла')} *</label>
                  <input
                    type="text"
                    id="mediaUrl"
                    name="url"
                    value={tempMedia.url}
                    onChange={handleMediaChange}
                    placeholder="https://example.com/media.jpg"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="mediaDescription">{t('admin.events.mediaDescription', 'Описание')}</label>
                <input
                  type="text"
                  id="mediaDescription"
                  name="description"
                  value={tempMedia.description}
                  onChange={handleMediaChange}
                  placeholder="Краткое описание медиафайла"
                />
              </div>
              
              <div className="media-form-actions">
                <button 
                  type="button" 
                  className="btn-success btn-sm"
                  onClick={handleAddMedia}
                >
                  {t('admin.events.addMedia', 'Добавить')}
                </button>
                <button 
                  type="button" 
                  className="btn-outline btn-sm"
                  onClick={() => setShowMediaForm(false)}
                >
                  {t('common.cancel', 'Отмена')}
                </button>
              </div>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-secondary btn-sm"
              onClick={() => setShowMediaForm(true)}
            >
              {t('admin.events.addNewMedia', 'Добавить медиафайл')}
            </button>
          )}
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button">
            {event ? t('admin.events.saveChanges', 'Сохранить изменения') : t('admin.events.create', 'Создать')}
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            {t('common.cancel', 'Отмена')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEventForm;