
import { useState, useEffect } from 'react';
import { useAuth } from '../Firebase/AuthContext';
import { auth } from '../Firebase/firebase-config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail, 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import './AuthPage.css';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // true для входа, false для регистрации
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false); // <--- Новое состояние
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // <--- Для сообщений об успехе
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Если пользователь уже залогинен, перенаправляем его на профиль или домашнюю страницу
  useEffect(() => {
    if (loading) return; // Ждем завершения загрузки
    if (currentUser) {
      navigate('/profile'); // или '/'
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Сбрасываем предыдущие ошибки
    setMessage(''); // Сбрасываем предыдущие сообщения

    try {
      if (isLoginMode) {
        // Вход
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/profile'); // Перенаправляем на страницу профиля после успешного входа
      } else {
        // Регистрация
        await createUserWithEmailAndPassword(auth, email, password);
        // После регистрации, Firebase автоматически залогинит пользователя
        navigate('/profile'); // Перенаправляем на страницу профиля после успешной регистрации
      }
    } catch (err: any) {
      console.error('Ошибка аутентификации:', err.message);
      // Улучшите обработку ошибок для пользователя
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Некорректный формат email.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Неправильный email или пароль.');
          break;
        case 'auth/email-already-in-use':
          setError('Пользователь с таким email уже существует.');
          break;
        case 'auth/weak-password':
          setError('Пароль должен быть не менее 6 символов.');
          break;
        default:
          setError('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
          break;
      }
    }
  };

  // <--- Новая функция для сброса пароля
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Пожалуйста, введите email для сброса пароля.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Ссылка для сброса пароля отправлена на ваш email.');
      setEmail(''); // Очищаем поле email
      setIsForgotPasswordMode(false); // Возвращаемся в режим входа
    } catch (err: any) {
      console.error('Ошибка сброса пароля:', err.message);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Некорректный формат email.');
          break;
        case 'auth/user-not-found':
          setError('Пользователь с таким email не найден.');
          break;
        default:
          setError('Не удалось отправить ссылку для сброса пароля. Попробуйте еще раз.');
          break;
      }
    }
  };

  // Пока данные пользователя загружаются, или если пользователь уже есть (идет перенаправление)
  if (loading || currentUser) {
    return (
      <div className='auth-page'>
        <p>Загрузка или перенаправление...</p>
      </div>
    );
  }

  return (
    <div className='auth-page'>
      <h1>
        {isForgotPasswordMode
          ? 'Сброс пароля'
          : isLoginMode
          ? 'Вход'
          : 'Регистрация'}
      </h1>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}

      {isForgotPasswordMode ? (
        // Форма для сброса пароля
        <form onSubmit={handlePasswordReset}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Отправить ссылку для сброса</button>
          <button type="button" onClick={() => setIsForgotPasswordMode(false)}>
            Назад ко входу
          </button>
        </form>
      ) : (
        // Формы входа/регистрации
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit">{isLoginMode ? 'Войти' : 'Зарегистрироваться'}</button>

          {isLoginMode && ( // Только в режиме входа показываем "Забыли пароль?"
            <p>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(true);
                  setError(''); // Очищаем ошибки при переключении режима
                  setMessage('');
                }}
                style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
              >
                Забыли пароль?
              </button>
            </p>
          )}
        </form>
      )}

      {!isForgotPasswordMode && ( // Не показываем переключатель режимов, если находимся в режиме сброса пароля
        <p>
          {isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(''); // Очищаем ошибки при переключении режима
              setMessage('');
              setEmail(''); // Очищаем поля при переключении
              setPassword('');
            }}
          >
            {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      )}
    </div>
  );
}

export default AuthPage;
