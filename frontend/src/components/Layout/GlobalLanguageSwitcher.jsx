// src/components/GlobalLanguageSwitcher.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/GlobalLanguageSwitcher.css';

const GlobalLanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Получаем текущий язык
  const currentLanguage = i18n.language || 'kz';

  return (
    <div className="global-language-switcher">
      <button 
        className="language-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle language menu"
      >
        {currentLanguage.toUpperCase()} <span className="toggle-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          <button 
            className={`language-option ${currentLanguage === 'kz' ? 'active' : ''}`}
            onClick={() => changeLanguage('kz')}
          >
            KZ
          </button>
          <button 
            className={`language-option ${currentLanguage === 'ru' ? 'active' : ''}`}
            onClick={() => changeLanguage('ru')}
          >
            RU
          </button>
          <button 
            className={`language-option ${currentLanguage === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            EN
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalLanguageSwitcher;