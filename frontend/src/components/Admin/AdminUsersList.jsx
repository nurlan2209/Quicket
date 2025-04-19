import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';

const AdminUsersList = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('user');
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiService.getAllUsers();
        setUsers(response);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        setError(t('admin.users.fetchError', 'Ошибка при загрузке пользователей'));
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [t]);
  
  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Обработчик изменения роли пользователя
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    
    try {
      const response = await apiService.updateUserRole(selectedUser.id, newRole);
      
      if (response.success) {
        // Обновляем список пользователей
        setUsers(users.map(user => 
          user.id === selectedUser.id ? { ...user, role: newRole } : user
        ));
        
        setShowRoleModal(false);
        setSelectedUser(null);
        setError(null);
      } else {
        setError(response.message || t('admin.users.roleUpdateError', 'Ошибка при обновлении роли'));
      }
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error);
      setError(t('admin.users.roleUpdateError', 'Ошибка при обновлении роли'));
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик удаления пользователя
  const handleDeleteUser = async (userId) => {
    if (window.confirm(t('admin.users.confirmDelete', 'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.'))) {
      setLoading(true);
      
      try {
        const response = await apiService.deleteUser(userId);
        
        if (response.success) {
          // Обновляем список пользователей
          setUsers(users.filter(user => user.id !== userId));
        } else {
          setError(response.message || t('admin.users.deleteError', 'Ошибка при удалении пользователя'));
        }
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        setError(t('admin.users.deleteError', 'Ошибка при удалении пользователя'));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="admin-users-container">
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
          <label htmlFor="search">{t('admin.users.search', 'Поиск')}</label>
          <input
            type="text"
            id="search"
            placeholder={t('admin.users.searchPlaceholder', 'Поиск по имени или email...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Загрузка...')}</p>
        </div>
      ) : (
        <div className="admin-table-responsive">
          {filteredUsers.length === 0 ? (
            <p className="admin-no-data">{t('admin.users.noUsers', 'Пользователи не найдены')}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.users.id', 'ID')}</th>
                  <th>{t('admin.users.username', 'Имя пользователя')}</th>
                  <th>{t('admin.users.email', 'Email')}</th>
                  <th>{t('admin.users.role', 'Роль')}</th>
                  <th>{t('admin.users.createdAt', 'Дата регистрации')}</th>
                  <th className="actions-column">{t('admin.users.actions', 'Действия')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="username-cell">{user.username}</td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`user-role ${user.role}`}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td className="actions-cell">
                      <button 
                        className="admin-action-button edit"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setShowRoleModal(true);
                        }}
                        title={t('admin.users.changeRole', 'Изменить роль')}
                      >
                        👑
                      </button>
                      <button 
                        className="admin-action-button delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title={t('admin.users.delete', 'Удалить')}
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
      
      {/* Модальное окно для изменения роли */}
      {showRoleModal && selectedUser && (
        <div className="admin-modal">
          <div className="admin-modal-content admin-modal-small">
            <button 
              className="admin-modal-close"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }}
            >
              ×
            </button>
            <h3>{t('admin.users.changeRoleTitle', 'Изменение роли пользователя')}</h3>
            <p>{t('admin.users.changeRoleDescription', 'Пользователь')}: <strong>{selectedUser.username}</strong></p>
            
            <div className="admin-form-group">
              <label htmlFor="role">{t('admin.users.newRole', 'Новая роль')}</label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">{t('admin.users.roleUser', 'Пользователь')}</option>
                <option value="admin">{t('admin.users.roleAdmin', 'Администратор')}</option>
              </select>
            </div>
            
            <div className="admin-modal-actions">
              <button 
                className="admin-button primary"
                onClick={handleUpdateRole}
                disabled={loading}
              >
                {loading ? t('common.loading', 'Загрузка...') : t('admin.users.saveRole', 'Сохранить')}
              </button>
              <button 
                className="admin-button secondary"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                disabled={loading}
              >
                {t('common.cancel', 'Отмена')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersList;