import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/PaymentQRModal.css';

const PaymentQRModal = ({ isOpen, onClose, onPaymentSuccess, qrImagePath, price, seats }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(20);
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // waiting, success, failed
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef(null);
  const successProcessedRef = useRef(false); // Реф для отслеживания, был ли уже обработан успех
  
  // Устанавливаем mounted в true после первого рендера
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Сбросить флаг успешного завершения при каждом открытии модального окна
  useEffect(() => {
    if (isOpen) {
      successProcessedRef.current = false;
    }
  }, [isOpen]);
  
  // Рассчитываем значение для кругового таймера
  const calculateCircleOffset = () => {
    const circumference = 2 * Math.PI * 45;
    return (1 - timeLeft / 20) * circumference;
  };
  
  // Timer logic
  useEffect(() => {
    let timer;
    
    if (isOpen && paymentStatus === 'waiting') {
      // Сброс таймера при открытии
      setTimeLeft(20);
      
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            
            // Проверяем, не был ли уже обработан успех
            if (!successProcessedRef.current) {
              successProcessedRef.current = true;
              setPaymentStatus('success');
              
              if (onPaymentSuccess) {
                setTimeout(() => {
                  onPaymentSuccess();
                }, 2000);
              }
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, paymentStatus, onPaymentSuccess]);
  
  // Сбрасываем статус платежа при закрытии
  useEffect(() => {
    if (!isOpen) {
      // Задержка перед сбросом статуса, чтобы избежать мигания
      const resetTimer = setTimeout(() => {
        setPaymentStatus('waiting');
        successProcessedRef.current = false; // Сбрасываем флаг при закрытии
      }, 300);
      
      return () => clearTimeout(resetTimer);
    }
  }, [isOpen]);
  
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && paymentStatus !== 'success') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, paymentStatus]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      // Задержка для предотвращения смещения контента
      const scrollTimer = setTimeout(() => {
        document.body.style.overflow = 'auto';
      }, 300);
      
      return () => clearTimeout(scrollTimer);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Добавляем возможность закрыть модальное окно по клику за его пределами
  const handleOverlayClick = (e) => {
    if (paymentStatus !== 'success' && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Если компонент не смонтирован или модальное окно закрыто, ничего не рендерим
  if (!mounted || !isOpen) return null;

  // Содержимое модального окна
  const modalContent = (
    <div className="payment-qr-overlay" onClick={handleOverlayClick} ref={modalRef}>
      <div className="payment-qr-content" onClick={e => e.stopPropagation()}>
        {paymentStatus !== 'success' && (
          <button className="payment-qr-close" onClick={onClose}>×</button>
        )}
        
        {paymentStatus === 'waiting' ? (
          <>
            <div className="payment-qr-header">
              <h2>{t('paymentQR.title')}</h2>
              <p>{t('paymentQR.subtitle')}</p>
            </div>
            
            <div className="payment-qr-body">
              <div className="payment-qr-timer">
                <div className="timer-circle">
                  <div className="timer-number">{timeLeft}</div>
                  <svg className="timer-svg" viewBox="0 0 100 100">
                    <circle 
                      r="45" 
                      cx="50" 
                      cy="50"
                      style={{
                        strokeDashoffset: `${calculateCircleOffset()}px`
                      }}
                    />
                  </svg>
                </div>
                <p className="timer-text">{t('paymentQR.timerText')}</p>
              </div>
              
              <div className="payment-qr-image-container">
                {qrImagePath ? (
                  <img 
                    src={qrImagePath} 
                    alt={t('paymentQR.qrCodeAlt')} 
                    className="payment-qr-image"
                  />
                ) : (
                  <div className="payment-qr-placeholder">
                    {t('paymentQR.loading')}
                  </div>
                )}
              </div>
              
              <div className="payment-amount">
                <p>{t('paymentQR.seats')}: {seats}</p>
                <p className="amount">{t('paymentQR.amount')}: <strong>{price * seats} тг</strong></p>
              </div>
              
              <div className="payment-instructions">
                <p>{t('paymentQR.instructions')}</p>
              </div>
            </div>
          </>
        ) : paymentStatus === 'success' ? (
          <div className="payment-success">
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <div className="success-icon-check"></div>
              </div>
            </div>
            <h2>{t('paymentQR.successTitle')}</h2>
            <p>{t('paymentQR.successMessage')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );

  // Используем React Portal для рендеринга модального окна прямо в body
  return createPortal(modalContent, document.body);
};

export default PaymentQRModal;