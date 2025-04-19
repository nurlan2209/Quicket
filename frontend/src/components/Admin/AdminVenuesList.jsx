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
    if (window.confirm(t('admin.venues.confirmDelete'))) {
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
          {t('admin.venues.addNew')}
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
          <label htmlFor="search">{t('admin.venues.search')}</label>
          <input
            type="text"
            id="search"
            placeholder={t('admin.venues.searchPlaceholder')}
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
            <p className="admin-no-data">{t('admin.venues.noVenues')}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.venues.id')}</th>
                  <th>{t('admin.venues.name')}</th>
                  <th>{t('admin.venues.address')}</th>
                  <th>{t('admin.venues.capacity')}</th>
                  <th>{t('admin.venues.eventsCount')}</th>
                  <th className="actions-column">{t('admin.venues.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map(venue => (
                  <tr key={venue.id}>
                    <td>{venue.id}</td>
                    <td className="venue-name-cell">{venue.name}</td>
                    <td className="venue-address-cell">{venue.address}</td>
                    <td>{venue.capacity}</td>
                    <td>{venue.events ? venue.events.length : 0}</td>
                    <td className="actions-cell">
                      <button 
                        className="admin-action-button edit"
                        onClick={() => {
                          setSelectedVenue(venue);
                          setShowForm(true);
                        }}
                        title={t('admin.venues.edit')}
                      >
                        ✏️
                      </button>
                      <button 
                        className="admin-action-button delete"
                        onClick={() => handleDeleteVenue(venue.id)}
                        title={t('admin.venues.delete')}
                      >
                        🗑️
                      </button>
                      <button 
                        className="admin-action-button view"
                        onClick={() => window.open(`/venues/${venue.id}`, '_blank')}
                        title={t('admin.venues.view')}
                      >
                        👁️
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