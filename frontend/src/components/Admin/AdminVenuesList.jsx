import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import AdminVenueForm from './AdminVenueForm.jsx';

const AdminVenuesList = () => {
  const { t } = useTranslation();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showMapPreview, setShowMapPreview] = useState(null);
  
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await apiService.getVenues();
        setVenues(response);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке спортивных объектов:', error);
        setError(t('admin.venues.fetchError'));
        setLoading(false);
      }
    };
    
    fetchVenues();
  }, [t]);
  
  // Обработчик создания/обновления места проведения
  const handleSaveVenue = async (venueData) => {
    setLoading(true);
    
    try {
      let response;
      
      if (selectedVenue) {
        // Обновление существующего места проведения
        response = await apiService.updateVenue(selectedVenue.id, venueData);
      } else {
        // Создание нового места проведения
        response = await apiService.createVenue(venueData);
      }
      
      if (response.success) {
        // Обновляем список мест проведения
        const venuesResponse = await apiService.getVenues();
        setVenues(venuesResponse);
        
        setShowForm(false);
        setSelectedVenue(null);
        setError(null);
      } else {
        setError(response.message || t('admin.venues.saveError'));
      }
    } catch (error) {
      console.error('Ошибка при сохранении места проведения:', error);
      setError(t('admin.venues.saveError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик удаления места проведения
  const handleDeleteVenue = async (venueId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот объект?')) {
      setLoading(true);
      
      try {
        const response = await apiService.deleteVenue(venueId);
        
        if (response.success) {
          // Обновляем список мест проведения после удаления
          setVenues(venues.filter(venue => venue.id !== venueId));
        } else {
          setError(response.message || t('admin.venues.deleteError'));
        }
      } catch (error) {
        console.error('Ошибка при удалении места проведения:', error);
        setError(t('admin.venues.deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Показать предпросмотр карты
  const toggleMapPreview = (venue) => {
    if (showMapPreview === venue.id) {
      setShowMapPreview(null);
    } else {
      setShowMapPreview(venue.id);
    }
  };
  
  // Фильтрация мест проведения по поисковому запросу
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="admin-venues-container">
      <div className="admin-venues-header">
        <h2>{t('admin.venues.title')}</h2>
        <button 
          className="admin-add-button"
          onClick={() => {
            setSelectedVenue(null);
            setShowForm(true);
          }}
        >
          {t('admin.venues.createVenue')}
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
        <div className="admin-filter-group full-width">
          <label htmlFor="search">{t('admin.events.search')}</label>
          <input
            type="text"
            id="search"
            placeholder={t("admin.venues.searchPlaceholder")}
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
          {filteredVenues.length === 0 ? (
            <p className="admin-no-data">Объекты не найдены</p>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('admin.events.nameField')}</th>
                    <th>{t('admin.events.addressField')}</th>
                    <th>{t('admin.venues.capacity')}</th>
                    <th>{t('admin.venues.eventsCount')}</th>
                    <th>{t('admin.venues.map')}</th>
                    <th className="actions-column">{t('admin.events.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map(venue => (
                    <React.Fragment key={venue.id}>
                      <tr>
                        <td>{venue.id}</td>
                        <td className="venue-name-cell">{venue.name}</td>
                        <td className="venue-address-cell">{venue.address}</td>
                        <td>{venue.capacity}</td>
                        <td>{venue.events ? venue.events.length : 0}</td>
                        <td>
                          {venue.map_widget_code ? (
                            <button 
                              className="btn-secondary btn-sm"
                              onClick={() => toggleMapPreview(venue)}
                            >
                              {showMapPreview === venue.id ? 'Скрыть карту' : 'Показать карту'}
                            </button>
                          ) : (
                            <span className="text-muted">{t('admin.venues.noMap')}</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="admin-action-button edit"
                            onClick={() => {
                              setSelectedVenue(venue);
                              setShowForm(true);
                            }}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            className="admin-action-button delete"
                            onClick={() => handleDeleteVenue(venue.id)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                          <button 
                            className="admin-action-button view"
                            onClick={() => window.open(`/venues/${venue.id}`, '_blank')}
                            title="Просмотр"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                      {showMapPreview === venue.id && venue.map_widget_code && (
                        <tr className="map-preview-row">
                          <td colSpan="7">
                            <div className="map-preview-container">
                              <div dangerouslySetInnerHTML={{ __html: venue.map_widget_code }} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </>
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
                setSelectedVenue(null);
              }}
            >
              ×
            </button>
            <AdminVenueForm 
              venue={selectedVenue} 
              onSave={handleSaveVenue}
              onCancel={() => {
                setShowForm(false);
                setSelectedVenue(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenuesList;