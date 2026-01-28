// src/Pages/Profile.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../Firebase/AuthContext';
import { auth } from '../Firebase/firebase-config';
import { signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../Context/NotificationContext'; 
import DeleteAccountModal from '../Components/DeleteAccountModal';


import { db } from '../Firebase/firebase-config';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore'; // Добавляем writeBatch

import './Profile.css';

function Profile() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
      showNotification('Вы успешно вышли из аккаунта.'); // TODO: Заменить на кастомное уведомление
    } catch (error) {
      console.error('Ошибка выхода:', error);
      showNotification('Не удалось выйти. Пожалуйста, попробуйте еще раз.'); // TODO: Заменить на кастомное уведомление
    }
  };

  const triggerDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  // --- НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ УДАЛЕНИЯ ПОДКОЛЛЕКЦИЙ ---
  const deleteUserSubcollection = async (userId: string, subcollectionName: string) => {
    const q = collection(db, 'users', userId, subcollectionName);
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db); // Создаем пакетную операцию

    // Добавляем каждое удаление документа в пакет
    querySnapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit(); // Выполняем пакетные удаления
    console.log(`Коллекция '${subcollectionName}' для пользователя ${userId} очищена.`);
  };


  const confirmDeleteAccount = async (password: string) => {
    setShowDeleteModal(false); // Закрываем модальное окно

    if (!currentUser) {
      showNotification('Пользователь не авторизован.'); // TODO: Заменить на кастомное уведомление
      navigate('/auth');
      return;
    }

    if (!password) {
      showNotification('Удаление аккаунта отменено. Требуется ввод пароля.'); // TODO: Заменить на кастомное уведомление
      return;
    }

    try {
      if (!currentUser.email) {
          showNotification('Невозможно удалить аккаунт без email. Пожалуйста, обратитесь в поддержку.'); // TODO: Заменить на кастомное уведомление
          return;
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);

      // Шаг 1: Повторная аутентификация пользователя
      await reauthenticateWithCredential(currentUser, credential);
      console.log('Повторная аутентификация успешна.');

      // --- ШАГ 2: УДАЛЕНИЕ ДАННЫХ ИЗ FIRESTORE ---
      // Удаляем каждую известную подколлекцию пользователя
      console.log(`Начинаем удаление данных Firestore для пользователя ${currentUser.uid}...`);
      await deleteUserSubcollection(currentUser.uid, 'products');
      await deleteUserSubcollection(currentUser.uid, 'recipes');
      await deleteUserSubcollection(currentUser.uid, 'orders');

      // Удаляем сам документ пользователя из коллекции 'users'
      const userDocRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userDocRef);
      console.log(`Документ пользователя ${currentUser.uid} из коллекции 'users' удален.`);
      console.log('Все данные пользователя успешно удалены из Firestore.');

      // --- ШАГ 3: УДАЛЕНИЕ УЧЕТНОЙ ЗАПИСИ FIREBASE AUTH ---
      await currentUser.delete();
      showNotification('Ваша учетная запись и все связанные данные успешно удалены.'); // TODO: Заменить на кастомное уведомление
      navigate('/auth');
    } catch (error: any) {
      console.error('Ошибка удаления аккаунта:', error);
      if (error.code === 'auth/requires-recent-login') {
        showNotification(
          'Для удаления аккаунта требуется недавний вход. Пожалуйста, выйдите и войдите снова, затем повторите попытку.'
        ); // TODO: Заменить на кастомное уведомление
      } else if (error.code === 'auth/wrong-password') {
        showNotification('Неверный пароль. Пожалуйста, попробуйте еще раз.'); // TODO: Заменить на кастомное уведомление
      } else if (error.code === 'auth/invalid-credential') {
        showNotification('Недействительные учетные данные. Пожалуйста, попробуйте еще раз.'); // TODO: Заменить на кастомное уведомление
      } else {
        showNotification(`Не удалось удалить аккаунт: ${error.message}.`); // TODO: Заменить на кастомное уведомление
      }
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false); // Закрываем модальное окно при отмене
    showNotification('Удаление аккаунта отменено.'); // TODO: Заменить на кастомное уведомление
  };

  if (loading || !currentUser) {
    return (
      <div className='profile-page'>
        <p>Загрузка профиля или перенаправление...</p>
      </div>
    );
  }

  return (
    <div className='profile-page'>
      <h1>Мой Профиль</h1>
      <p>Вы вошли как: <strong>{currentUser.email}</strong></p>
      <p>UID: {currentUser.uid}</p>
      <button onClick={handleSignOut}>Выйти</button>
      <button onClick={triggerDeleteAccount}>Выйти и Удалить учетную запись и данные</button>

      <DeleteAccountModal
        isVisible={showDeleteModal}
        onConfirm={confirmDeleteAccount}
        onCancel={cancelDeleteAccount}
        message="Вы уверены, что хотите безвозвратно удалить свою учетную запись? Это действие нельзя отменить. Пожалуйста, введите ваш пароль для подтверждения:"
      />
    </div>
  );
}

export default Profile;
