
import React, { useState } from 'react';

interface DeleteAccountModalProps {
  isVisible: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  message: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isVisible, onConfirm, onCancel, message }) => {
  const [password, setPassword] = useState('');

  if (!isVisible) {
    return null;
  }

  const handleSubmit = () => {
    onConfirm(password);
    setPassword(''); // Очищаем пароль после отправки
  };

  const handleCancelClick = () => {
    onCancel();
    setPassword(''); // Очищаем пароль при отмене
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <p>{message}</p>
        <input
          type="password"
          placeholder="Введите ваш пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSubmit}>Подтвердить удаление</button>
        <button onClick={handleCancelClick}>Отмена</button>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
