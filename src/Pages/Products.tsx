
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Products.css';
import { db } from '../Firebase/firebase-config';
import { collection, addDoc, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { useAuth } from '../Firebase/AuthContext';

interface Product {
  id?: string;
  name: string;
  unit: 'kg' | 'pcs' | 'l';
}

function Products() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Product['unit']>('kg');
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Функция для загрузки продуктов текущего пользователя
  const fetchProducts = async () => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    try {
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      const q = query(userProductsCollectionRef);
      const snap = await getDocs(q);

      const items: Product[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data() as Product,
      }));

      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
    } catch (error) {
      console.error('Ошибка при получении продуктов:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [loading, currentUser]);

  // Обработчик добавления нового продукта
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    if (!name.trim()) {
      console.warn('Название продукта не может быть пустым.');
      return;
    }

    try {
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      await addDoc(userProductsCollectionRef, { name: name.trim(), unit });

      setName('');
      setUnit('kg');
      await fetchProducts();
    } catch (error) {
      console.error('Ошибка при добавлении продукта:', error);
    }
  };

  // Обработчик удаления продукта
  const handleDelete = async (id: string) => {
    if (!currentUser) {
      console.warn('Попытка удалить продукт неавторизованным пользователем.');
      return;
    }
    try {
      const productDocRef = doc(db, 'users', currentUser.uid, 'products', id);
      await deleteDoc(productDocRef);
      await fetchProducts();
    } catch (error) {
      console.error('Ошибка при удалении продукта:', error);
    }
  };

  // Вспомогательная функция для форматирования единиц измерения для отображения
  const formatUnit = (u: Product['unit']): string => {
    switch (u) {
      case 'kg': return 'кг';
      case 'pcs': return 'шт';
      case 'l': return 'л';
      default: return String(u);
    }
  };

  // Фильтрация продуктов на основе поиска
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page">Загрузка пользователя...</div>;
  }

  return (
    <div className="page">
      <h1>Продукты</h1>

      {/* Поиск товара - ДЛЯ ВСЕХ */}
      <div className="search-form">
        <p>Поиск товара</p>
        <input
          className="search-product-input"
          type="text"
          placeholder="Введите название товара"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!currentUser}
        />
      </div>

      {/* Добавление товара - ДЛЯ ВСЕХ */}
      <div className="add-product">
        <p>Добавить товар</p>
        <form className="add-product-form" onSubmit={handleAdd}>
          <input
            className="add-product-input"
            type="text"
            placeholder="Название товара"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!currentUser}
          />

          <select 
            className="select-type-product" 
            value={unit} 
            onChange={(e) => setUnit(e.target.value as Product['unit'])}
            disabled={!currentUser}
          >
            <option value="kg">Весовой (кг)</option>
            <option value="pcs">Штучный (шт)</option>
            <option value="l">Литраж (л)</option>
          </select>

          <button 
            className="add-product-btn" 
            type="submit"
            title={!currentUser ? "Авторизоваться для добавления товаров" : ""}
          >
            {currentUser ? "+ Добавить товар" : "Авторизоваться для добавления товаров"}
          </button>
        </form>
      </div>

      {/* Сообщение для неавторизованных */}
      {!currentUser && (
        <div className="auth-message">
          <p>Для управления продуктами необходимо войти в систему.</p>
        </div>
      )}

      {/* Список товаров - ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ */}
      {currentUser ? (
        <div className="products-list-section">
          <p>Список товаров</p>
          {filteredProducts.length === 0 ? (
            <p className="no-products">Товары не найдены</p>
          ) : (
            <ul className="product-list">
              {filteredProducts.map((p) => (
                <li key={p.id}>
                  <span className="product-name">{p.name}</span>
                  <span className="product-unit"> — {formatUnit(p.unit)}</span>
                  <button 
                    className="del-prod-btn" 
                    onClick={() => handleDelete(p.id!)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="demo-section">
          <h2>Пример работы с продуктами</h2>
          <p>После авторизации вы сможете:</p>
          <ul className="demo-features">
            <li>Добавлять новые продукты с различными единицами измерения</li>
            <li>Поиск по названию продуктов</li>
            <li>Управлять списком продуктов</li>
            <li>Использовать продукты при создании рецептов</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Products;