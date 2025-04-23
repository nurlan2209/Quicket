import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/StadiumSeatSelection.css';

const StadiumSeatSelection = ({ event, selectedSeats, onSeatSelect }) => {
  const { t } = useTranslation();
  const [sectors, setSectors] = useState([]);
  const [activeSector, setActiveSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Создаем схему стадиона при загрузке компонента
  useEffect(() => {
    if (event) {
      generateStadiumLayout();
    }
  }, [event]);

  // Генерация схемы стадиона
  const generateStadiumLayout = () => {
    setLoading(true);
    
    try {
      // Получаем сохраненные данные о занятых местах
      const venueKey = `venue_${event.venue_id}`;
      const storedVenueData = localStorage.getItem(venueKey);
      let occupiedSeats = [];
      
      if (storedVenueData) {
        try {
          const venueData = JSON.parse(storedVenueData);
          occupiedSeats = venueData.occupiedSeats || [];
        } catch (e) {
          console.error('Ошибка при чтении данных о занятых местах:', e);
        }
      }

      // Определяем секторы для стадиона Astana Arena
      // A, B, C, D - основные секторы (трибуны)
      // Каждый сектор разделен на подсекторы (1-10)
      // В каждом подсекторе есть ряды (1-15) и места (1-20)
      const sectorLetters = ['A', 'B', 'C', 'D'];
      const generatedSectors = [];
      
      sectorLetters.forEach(sectorLetter => {
        const sectorObj = {
          id: sectorLetter,
          name: `${t('stadium.sector')} ${sectorLetter}`,
          subsectors: []
        };
        
        // Создаем подсекторы
        for (let i = 1; i <= 10; i++) {
          const subsectorId = `${sectorLetter}${i}`;
          const subsector = {
            id: subsectorId,
            name: `${subsectorId}`,
            rows: []
          };
          
          // Создаем ряды в подсекторе
          const rowCount = sectorLetter === 'A' || sectorLetter === 'C' ? 15 : 12;
          for (let row = 1; row <= rowCount; row++) {
            const seatRow = [];
            // Создаем места в ряду
            const seatCount = sectorLetter === 'B' || sectorLetter === 'D' ? 15 : 20;
            for (let seat = 1; seat <= seatCount; seat++) {
              const seatId = `${subsectorId}-${row}-${seat}`;
              
              // Проверяем статус места
              const isOccupied = occupiedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);
              
              seatRow.push({
                id: seatId,
                subsector: subsectorId,
                row,
                number: seat,
                isOccupied,
                isSelected
              });
            }
            
            subsector.rows.push(seatRow);
          }
          
          sectorObj.subsectors.push(subsector);
        }
        
        generatedSectors.push(sectorObj);
      });
      
      setSectors(generatedSectors);
      
      // Если нет активного сектора, устанавливаем первый по умолчанию
      if (!activeSector && generatedSectors.length > 0) {
        setActiveSector(generatedSectors[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при создании схемы стадиона:', err);
      setError(t('stadium.generationError', 'Ошибка при создании схемы стадиона'));
      setLoading(false);
    }
  };
  
  // Обработчик клика по месту
  const handleSeatClick = (seatId) => {
    // Найдем сиденье
    let foundSeat = null;
    
    // Проходим по всем секторам и ищем нужное место
    for (const sector of sectors) {
      for (const subsector of sector.subsectors) {
        for (const row of subsector.rows) {
          const seat = row.find(s => s.id === seatId);
          if (seat) {
            foundSeat = seat;
            break;
          }
        }
        if (foundSeat) break;
      }
      if (foundSeat) break;
    }
    
    // Если место занято, выводим сообщение
    if (foundSeat && foundSeat.isOccupied) {
      alert(t('bookingForm.seatOccupied', 'Это место уже занято'));
      return;
    }
    
    // Вызываем колбэк с выбранным местом
    onSeatSelect(seatId);
  };
  
  // Форматирование ID места для отображения
  const formatSeatId = (seatId) => {
    // seatId формата "A1-3-15" -> "Сектор A1, Ряд 3, Место 15"
    const parts = seatId.split('-');
    if (parts.length === 3) {
      const [subsector, row, seat] = parts;
      return `${t('stadium.sector')} ${subsector}, ${t('stadium.row')} ${row}, ${t('stadium.seat')} ${seat}`;
    }
    return seatId;
  };
  
  // Получаем активный сектор
  const getActiveSectorObj = () => {
    return sectors.find(sector => sector.id === activeSector);
  };
  
  if (loading) {
    return <div className="stadium-loading">{t('common.loading')}</div>;
  }
  
  if (error) {
    return <div className="stadium-error">{error}</div>;
  }

  return (
    <div className="stadium-selection-container">
      <h3 className="stadium-title">{t('stadium.astanaArenaTitle', 'Выбор мест на стадионе "Astana Arena"')}</h3>
      
      <div className="stadium-legend">
        <div className="legend-item">
          <div className="seat-example available"></div>
          <span>{t('bookingForm.seatAvailable', 'Доступно')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-example selected"></div>
          <span>{t('bookingForm.seatSelected', 'Выбрано')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-example occupied"></div>
          <span>{t('bookingForm.seatOccupied', 'Занято')}</span>
        </div>
      </div>
      
      <div className="stadium-overview">
        <div className="stadium-field">
          <div className="field-grass">
            <div className="field-center-circle"></div>
            <div className="field-center-line"></div>
            <div className="field-penalty-area left"></div>
            <div className="field-penalty-area right"></div>
            <div className="field-goal left"></div>
            <div className="field-goal right"></div>
          </div>
        </div>
        
        <div className="stadium-sectors">
          {sectors.map(sector => (
            <div 
              key={sector.id}
              className={`stadium-sector sector-${sector.id} ${activeSector === sector.id ? 'active' : ''}`}
              onClick={() => setActiveSector(sector.id)}
            >
              <span className="sector-label">{sector.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="stadium-sector-selection">
        <p>{t('stadium.selectSector', 'Выберите сектор')}:</p>
        <div className="sector-buttons">
          {sectors.map(sector => (
            <button
              key={sector.id}
              className={`sector-button ${activeSector === sector.id ? 'active' : ''}`}
              onClick={() => setActiveSector(sector.id)}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>
      
      {activeSector && (
        <div className="active-sector-detail">
          <h4>{getActiveSectorObj().name}</h4>
          
          <div className="subsector-tabs">
            {getActiveSectorObj().subsectors.map(subsector => (
              <button 
                key={subsector.id} 
                className="subsector-tab"
                onClick={() => {
                  document.getElementById(`subsector-${subsector.id}`).scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {subsector.name}
              </button>
            ))}
          </div>
          
          <div className="subsectors-container">
            {getActiveSectorObj().subsectors.map(subsector => (
              <div 
                key={subsector.id}
                id={`subsector-${subsector.id}`}
                className="subsector-content"
              >
                <h5>{t('stadium.subsector', 'Подсектор')} {subsector.name}</h5>
                
                <div className="subsector-rows">
                  {subsector.rows.map((row, rowIndex) => (
                    <div key={`row-${subsector.id}-${rowIndex}`} className="stadium-row">
                      <div className="row-number">{rowIndex + 1}</div>
                      <div className="seats-row">
                        {row.map(seat => (
                          <div 
                            key={seat.id}
                            className={`stadium-seat 
                              ${seat.isOccupied ? 'occupied' : ''} 
                              ${seat.isSelected ? 'selected' : ''}`}
                            onClick={() => !seat.isOccupied && handleSeatClick(seat.id)}
                            title={formatSeatId(seat.id)}
                          >
                            <span className="seat-number">{seat.number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="selected-seats-summary">
        <h4>{t('bookingForm.selectedSeats', 'Выбранные места')}:</h4>
        {selectedSeats.length > 0 ? (
          <ul className="selected-seats-list">
            {selectedSeats.map(seatId => (
              <li key={seatId} className="selected-seat-item">
                {formatSeatId(seatId)}
                <button
                  className="remove-seat-btn"
                  onClick={() => onSeatSelect(seatId)}
                  title={t('bookingForm.removeSeat', 'Убрать место')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-seats-selected">{t('bookingForm.noSeatsSelected', 'Нет выбранных мест')}</p>
        )}
      </div>
    </div>
  );
};

export default StadiumSeatSelection;