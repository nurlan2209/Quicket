import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminVenueForm = ({ venue, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    capacity: 100,
    latitude: '',
    longitude: '',
    map_widget_code: ''
  });
  const [errors, setErrors] = useState({});
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);

  // Initialize form when venue data is available (for editing)
  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        description: venue.description || '',
        capacity: venue.capacity || 100,
        latitude: venue.latitude || '',
        longitude: venue.longitude || '',
        map_widget_code: venue.map_widget_code || ''
      });
      
      if (venue.map_widget_code) {
        setShowWidgetPreview(true);
      }
    }
  }, [venue]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert numeric fields to numbers
    const newValue = type === 'number' ? (value ? parseFloat(value) : '') : value;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
    
    // Clear errors for the field being edited
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Generate 2GIS widget code
  const generateWidgetCode = () => {
    if (!formData.latitude || !formData.longitude) {
      setErrors({
        ...errors,
        latitude: !formData.latitude ? 'Широта обязательна для генерации виджета' : null,
        longitude: !formData.longitude ? 'Долгота обязательна для генерации виджета' : null
      });
      return;
    }

    // Format the venue name for use in URLs
    const encodedName = encodeURIComponent(formData.name);
    
    // Generate a widget code using the 2GIS API
    const widgetCode = `<a class="dg-widget-link" href="http://2gis.kz/nur_sultan/center/${formData.longitude},${formData.latitude}/zoom/16?utm_medium=widget-source&utm_campaign=firmsonmap&utm_source=bigMap">Посмотреть на карте</a><div class="dg-widget-link"><a href="http://2gis.kz/nur_sultan/center/${formData.longitude},${formData.latitude}/zoom/16/routeTab/rsType/bus/to/${formData.longitude},${formData.latitude}╎${encodedName}?utm_medium=widget-source&utm_campaign=firmsonmap&utm_source=route">Найти проезд до ${formData.name}</a></div><script charset="utf-8" src="https://widgets.2gis.com/js/DGWidgetLoader.js"></script><script charset="utf-8">new DGWidgetLoader({"width":500,"height":400,"borderColor":"#a3a3a3","pos":{"lat":${formData.latitude},"lon":${formData.longitude},"zoom":16},"opt":{"city":"nur_sultan"}});</script><noscript style="color:#c00;font-size:16px;font-weight:bold;">Виджет карты использует JavaScript. Включите его в настройках вашего браузера.</noscript>`;

    setFormData(prevData => ({
      ...prevData,
      map_widget_code: widgetCode
    }));
    
    setShowWidgetPreview(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('admin.venues.validation.nameRequired', 'Название обязательно');
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('admin.venues.validation.addressRequired', 'Адрес обязателен');
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = t('admin.venues.validation.capacityPositive', 'Вместимость должна быть положительным числом');
    }
    
    // Optional validation for coordinates
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = t('admin.venues.validation.latitudeInvalid', 'Широта должна быть в диапазоне от -90 до 90');
    }
    
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = t('admin.venues.validation.longitudeInvalid', 'Долгота должна быть в диапазоне от -180 до 180');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert capacity to number for API
      const dataToSave = {
        ...formData,
        capacity: parseInt(formData.capacity, 10)
      };
      
      // Вывести данные в консоль
      console.log('Sending data to backend:', dataToSave);
      
      // If coordinates are empty strings, set them to null
      if (dataToSave.latitude === '') dataToSave.latitude = null;
      if (dataToSave.longitude === '') dataToSave.longitude = null;
      
      onSave(dataToSave);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>
        {venue ? t('admin.venues.editVenue', 'Редактирование спортивного объекта') : t('admin.venues.createVenue', 'Создание нового спортивного объекта')}
      </h2>
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">{t('admin.venues.name', 'Название')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="capacity">{t('admin.venues.capacity', 'Вместимость')} *</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              className={errors.capacity ? 'error' : ''}
            />
            {errors.capacity && <div className="error-message">{errors.capacity}</div>}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="address">{t('admin.venues.address', 'Адрес')} *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={errors.address ? 'error' : ''}
            placeholder="Астана, ул. Кунаева, 10"
          />
          {errors.address && <div className="error-message">{errors.address}</div>}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude">{t('admin.venues.latitude', 'Широта')}</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className={errors.latitude ? 'error' : ''}
              placeholder="51.1694"
            />
            {errors.latitude && <div className="error-message">{errors.latitude}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="longitude">{t('admin.venues.longitude', 'Долгота')}</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className={errors.longitude ? 'error' : ''}
              placeholder="71.4491"
            />
            {errors.longitude && <div className="error-message">{errors.longitude}</div>}
          </div>
          
          <div className="form-group widget-generator">
            <label>Карта 2GIS</label>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={generateWidgetCode}
              disabled={!formData.latitude || !formData.longitude}
            >
              Сгенерировать виджет карты
            </button>
          </div>
        </div>
        
        {/* 2GIS Map Widget Section */}
        <div className="form-group">
          <label htmlFor="map_widget_code">{t('admin.venues.mapWidget', 'Код виджета карты 2GIS')}</label>
          <textarea
            id="map_widget_code"
            name="map_widget_code"
            rows="5"
            value={formData.map_widget_code}
            onChange={handleChange}
            placeholder="<a class='dg-widget-link' href='http://2gis.kz/...'>"
          ></textarea>
          <div className="widget-help-text">
            Для генерации кода виджета введите широту и долготу, затем нажмите "Сгенерировать виджет карты"
          </div>
        </div>
        
        {/* Widget Preview */}
        {showWidgetPreview && formData.map_widget_code && (
          <div className="form-group">
            <label>Предпросмотр виджета</label>
            <div className="widget-preview">
              <div dangerouslySetInnerHTML={{ __html: formData.map_widget_code }} />
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="description">{t('admin.venues.description', 'Описание')}</label>
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('admin.venues.descriptionPlaceholder', 'Подробное описание спортивного объекта...')}
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button">
            {venue ? t('admin.venues.saveChanges', 'Сохранить изменения') : t('admin.venues.create', 'Создать')}
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            {t('common.cancel', 'Отмена')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminVenueForm;