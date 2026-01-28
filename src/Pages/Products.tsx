// src/Pages/Products.tsx
import { useState, useEffect } from 'react';
import './Products.css'; // Предполагается, что у вас есть этот файл стилей
import { db } from '../Firebase/firebase-config'; // Импорт экземпляра Firestore
import { collection, addDoc, getDocs, deleteDoc, doc, query } from 'firebase/firestore'; // Добавляем query для явных запросов
import { useAuth } from '../Firebase/AuthContext'; // Импорт вашего AuthContext

// Обновленный интерфейс Product
interface Product {
  id?: string; // ID документа Firestore, опционально при создании
  name: string;
  unit: 'kg' | 'pcs' | 'l'; // Единица измерения теперь строго типизирована
}

function Products() {
  const { currentUser, loading } = useAuth();
  const [name, setName] = useState(''); // Для нового продукта
  const [unit, setUnit] = useState<Product['unit']>('kg'); // Для нового продукта, по умолчанию 'kg'
  const [products, setProducts] = useState<Product[]>([]); // Все продукты пользователя
  const [search, setSearch] = useState(''); // Для поля поиска

  // Функция для загрузки продуктов текущего пользователя
  const fetchProducts = async () => {
    if (!currentUser) {
      setProducts([]); // Очищаем список, если нет пользователя
      return;
    }

    try {
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      const q = query(userProductsCollectionRef); // Создаем запрос к коллекции
      const snap = await getDocs(q); // Получаем данные

      const items: Product[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data() as Product, // Приводим к типу Product
      }));

      // Сортировка по названию
      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
    } catch (error) {
      console.error('Ошибка при получении продуктов:', error);
      // Здесь можно добавить неблокирующее уведомление об ошибке, если хотите
    }
  };

  // Загрузка продуктов при изменении пользователя или при первом рендере
  useEffect(() => {
    if (!loading) { // Ждем окончания загрузки пользователя
      fetchProducts();
    }
  }, [loading, currentUser]); // Зависимости: загрузка и текущий пользователь

  // Обработчик добавления нового продукта
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); // Предотвращаем перезагрузку страницы
    if (!currentUser) {
      console.warn('Попытка добавить продукт неавторизованным пользователем.');
      return;
    }
    if (!name.trim()) {
      console.warn('Название продукта не может быть пустым.');
      return;
    }

    try {
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      await addDoc(userProductsCollectionRef, { name: name.trim(), unit });

      setName(''); // Сбрасываем поле ввода названия
      setUnit('kg'); // Сбрасываем выбор единицы измерения
      await fetchProducts(); // Обновляем список продуктов
    } catch (error) {
      console.error('Ошибка при добавлении продукта:', error);
      // Здесь можно добавить неблокирующее уведомление об ошибке
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
      // setProducts((prev) => prev.filter((p) => p.id !== id)); // Можно так, но fetchProducts надежнее
      await fetchProducts(); // Обновляем список продуктов
    } catch (error) {
      console.error('Ошибка при удалении продукта:', error);
      // Здесь можно добавить неблокирующее уведомление об ошибке
    }
  };

  // Вспомогательная функция для форматирования единиц измерения для отображения
  const formatUnit = (u: Product['unit']): string => {
    switch (u) {
      case 'kg': return 'кг';
      case 'pcs': return 'шт';
      case 'l': return 'л';
      default: return String(u); // На случай, если вдруг попадет что-то неожиданное
    }
  };

  // Фильтрация продуктов на основе поиска
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page">Загрузка пользователя...</div>;
  }

  if (!currentUser) {
    // В зависимости от логики вашего AuthContext, здесь может быть перенаправление
    // или сообщение о необходимости входа
    return <div className="page">Для управления продуктами необходимо войти в систему.</div>;
  }

  return (
    <div className="page">
      <h1>Продукты</h1>

      <div className="search-form">
        <p>Поиск товара</p>
        <input
          className="search-product-input"
          type="text"
          placeholder="Введите название товара"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="add-product">
        <p>Добавить товар</p>
        <form className="add-product-form" onSubmit={handleAdd}>
          <input
            className="add-product-input"
            type="text"
            placeholder="Название товара"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select className="select-type-product" value={unit} onChange={(e) => setUnit(e.target.value as Product['unit'])}>
            <option value="kg">Весовой (кг)</option>
            <option value="pcs">Штучный (шт)</option>
            <option value="l">Литраж (л)</option>
          </select>

          <button className="add-product-btn" type="submit">
            + Добавить товар
          </button>
        </form>
      </div>

      <div className="products-list-section"> {/* Изменил класс, чтобы избежать конфликтов */}
        <p>Список товаров</p>
        <ul className="product-list">
          {filteredProducts.map((p) => (
            <li key={p.id}>
              {p.name} — {formatUnit(p.unit)}
              <button className="del-prod-btn" onClick={() => handleDelete(p.id!)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Products;
