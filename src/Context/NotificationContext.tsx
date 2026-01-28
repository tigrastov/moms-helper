// src/Context/NotificationContext.tsx
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import './NotificationContext.css'; // <--- НЕ ЗАБУДЬТЕ СОЗДАТЬ ЭТОТ ФАЙЛ СТИЛЕЙ НА ШАГЕ 2

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Создаем контекст. undefined - это значение по умолчанию, которое никогда не должно использоваться,
// потому что мы всегда будем оборачивать наши компоненты в NotificationProvider.
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Кастомный хук для удобного использования уведомлений в любом компоненте
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Компонент-провайдер, который будет предоставлять функцию showNotification
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const NOTIFICATION_DURATION = 3000; // 3 секунды, после которых уведомление исчезает

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { id, message, type };

    setNotifications((prev) => [...prev, newNotification]);

    // Таймер для автоматического удаления уведомления
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, NOTIFICATION_DURATION);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children} {/* Рендерим дочерние компоненты (ваше приложение) */}
      <div className="notification-container"> {/* Контейнер для отображения уведомлений */}
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification-item notification-${notif.type}`}>
            <span>{notif.message}</span>
            {/* Кнопка закрытия, если пользователь хочет закрыть раньше */}
            <button onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}>×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
