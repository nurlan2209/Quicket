import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/SeatSelection.css'; // Создадим стили для компонента

const SeatSelection = ({ event, selectedSeats, onSeatSelect }) => {
  const { t } = useTranslation();
  const [seatsMap, setSeatsMap] = useState([]);
  const [loading, setLoading] = useState(true);

  // Создаем схему зала при загрузке компонента и при изменении события
  useEffect(() => {
    if (event) {
      generateSeatsMap();
    }
  }, [event]);

  // Генерируем схему расположения мест
  const generateSeatsMap = () => {
    setLoading(true);
    
    // Получаем сохраненные данные о занятых местах из localStorage
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

    // Количество рядов и мест в ряду
    // Для простоты создадим схему места из 10 рядов по 10 мест
    const rows = 10;
    const seatsPerRow = 10;
    
    // Рассчитываем общее количество доступных мест
    const totalSeats = event.total_seats || 100;
    
    // Создаем массив с рядами и местами
    const newSeatsMap = [];

    // Лимитируем количество рядов и мест на основе общего количества мест
    const actualRows = Math.min(rows, Math.ceil(totalSeats / seatsPerRow));
    
    let seatNumber = 1;
    for (let row = 1; row <= actualRows; row++) {
      const rowSeats = [];
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        // Если превысили количество мест, прерываем
        if (seatNumber > totalSeats) break;
        
        const seatId = `${row}-${seat}`;
        
        // Проверяем, занято ли место
        const isOccupied = occupiedSeats.includes(seatId);
        
        // Проверяем, выбрано ли место
        const isSelected = selectedSeats.includes(seatId);
        
        rowSeats.push({
          id: seatId,
          row,
          number: seat,
          isOccupied,
          isSelected
        });
        
        seatNumber++;
      }
      newSeatsMap.push(rowSeats);
    }
    
    setSeatsMap(newSeatsMap);
    setLoading(false);
  };

  // Обработчик клика по месту
  const handleSeatClick = (seatId) => {
    // Находим место
    let foundSeat = null;
    for (const row of seatsMap) {
      const seat = row.find(s => s.id === seatId);
      if (seat) {
        foundSeat = seat;
        break;
      }
    }
    
    // Если место занято, выводим сообщение
    if (foundSeat && foundSeat.isOccupied) {
      alert(t('bookingForm1.seatOccupied', 'Это место уже занято'));
      return;
    }
    
    // Вызываем колбэк с выбранным местом
    onSeatSelect(seatId);
  };

  if (loading) {
    return <div className="seat-selection-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="seat-selection-container">
      <h3 className="seat-selection-title">{t('bookingForm1.selectSeats', 'Выберите места')}</h3>
      
      <div className="seats-legend">
        <div className="legend-item">
          <div className="seat-example available"></div>
          <span>{t('bookingForm1.seatAvailable', 'Доступно')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-example selected"></div>
          <span>{t('bookingForm1.seatSelected', 'Выбрано')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-example occupied"></div>
          <span>{t('bookingForm1.seatOccupied', 'Занято')}</span>
        </div>
      </div>
      
      <div className="stage">
        <div className="stage-label">{t('bookingForm1.stage', 'СЦЕНА')}</div>
      </div>
      
      <div className="seating-area">
        {seatsMap.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            <div className="row-number">{rowIndex + 1}</div>
            <div className="seats">
              {row.map((seat) => (
                <div 
                  key={seat.id} 
                  className={`seat 
                    ${seat.isOccupied ? 'occupied' : ''} 
                    ${seat.isSelected ? 'selected' : ''}`}
                  onClick={() => !seat.isOccupied && handleSeatClick(seat.id)}
                  title={`${t('bookingForm1.row', 'Ряд')} ${seat.row}, ${t('bookingForm1.seat', 'Место')} ${seat.number}`}
                >
                  <span className="seat-number">{seat.number}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="selected-seats-summary">
        <h4>{t('bookingForm1.selectedSeats', 'Выбранные места')}:</h4>
        {selectedSeats.length > 0 ? (
          <ul className="selected-seats-list">
            {selectedSeats.map(seatId => {
              const [row, number] = seatId.split('-');
              return (
                <li key={seatId}>
                  {t('bookingForm1.rowSeat', 'Ряд {{row}}, Место {{seat}}', { row, seat: number })}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="no-seats-selected">{t('bookingForm1.noSeatsSelected', 'Нет выбранных мест')}</p>
        )}
      </div>
    </div>
  );
};

export default SeatSelection;