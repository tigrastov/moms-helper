// src/Firebase/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // ReactNode - это тип
import type { User } from 'firebase/auth'; // User - это тип

import { auth } from './firebase-config'; // Ваш инициализированный объект auth
import { onAuthStateChanged } from 'firebase/auth'; // onAuthStateChanged - это функция (значение)

// Определяем тип для AuthContext
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Создаем контекст со значениями по умолчанию (undefined, так как Provider всегда предоставит значение)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Хук для удобного использования контекста авторизации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Компонент-провайдер, который будет оборачивать ваше приложение
interface AuthProviderProps {
  children: ReactNode; // Используем ReactNode для типа children
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Состояние загрузки, пока Firebase проверяет пользователя

  useEffect(() => {
    // Подписываемся на изменения состояния авторизации Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Загрузка завершена, статус пользователя определен
    });

    // Отписываемся от слушателя при размонтировании компонента
    return () => unsubscribe();
  }, []);

  // Объект с данными, которые будут доступны через контекст
  const value = {
    currentUser,
    loading,
  };

 

return (
    <AuthContext.Provider value={value}>
     
      {loading ? (
        <div>Загрузка пользователя...</div> // Это показывается только пока идет initial check
      ) : (
        children // <--- Если загрузка завершена, всегда рендерим дочерние компоненты
      )}
    </AuthContext.Provider>
  );

};
