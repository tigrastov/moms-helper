// src/Pages/Orders.tsx
import React, { useState, useEffect, useMemo } from 'react';
import './Orders.css'; // Предполагается, что у вас есть этот файл стилей
import { db } from '../Firebase/firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { useAuth } from '../Firebase/AuthContext';
import { useNotification } from '../Context/NotificationContext';

// --- ОПРЕДЕЛЕНИЯ ТИПОВ ВНУТРИ ЭТОГО ФАЙЛА ---

export type ProductUnit = 'kg' | 'pcs' | 'l';

export interface Product {
  id: string;
  name: string;
  unit: ProductUnit;
}

export interface Ingredient {
  productId: string; // ID продукта
  qty: number;       // Количество
}

export type RecipeCategory = 'salad' | 'hot' | 'snack' | 'drink' | 'dessert' | 'other';

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  portions?: number; // Опционально, можно использовать для масштабирования
}

export interface OrderItem {
  recipeId: string;
  qty: number; // Количество порций для этого рецепта в заказе
}

export interface Order {
  id: string;
  name: string;
  date: string; // Дата заказа в формате 'YYYY-MM-DD'
  items: OrderItem[];
}

// Интерфейс для состояния addForm, которое хранит данные для добавления блюд в конкретный заказ
export interface AddFormState {
  [orderId: string]: {
    selectedCategory?: RecipeCategory | 'all'; // Для фильтрации рецептов в селекте
    selectedRecipeId?: string;
    qty?: string; // Количество из инпута, как строка
  };
}

// Интерфейс для результатов расчета продуктов
export interface CalculatedProduct {
  name: string;
  unit: ProductUnit;
  amount: number;
}

function Orders() {
  const { currentUser, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [orders, setOrders] = useState<Order[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // --- СОСТОЯНИЯ ДЛЯ ФОРМ И ПОИСКА ЗАКАЗОВ ---
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderDate, setNewOrderDate] = useState(''); // Формат 'YYYY-MM-DD'
  const [searchDate, setSearchDate] = useState(''); // Для поиска по дате

  // Состояние для добавления блюд в конкретный заказ
  const [addForm, setAddForm] = useState<AddFormState>({});

  // --- ХЕЛПЕРЫ ---

  const getRecipeCategoryLabel = (c: RecipeCategory | 'all'): string => {
    switch (c) {
      case 'all': return 'Все';
      case 'salad': return 'Салат';
      case 'hot': return 'Горячее';
      case 'snack': return 'Закуска';
      case 'drink': return 'Напиток';
      case 'dessert': return 'Десерт';
      case 'other': return 'Другое';
      default: return String(c);
    }
  };

  const formatUnit = (u: ProductUnit): string => {
    switch (u) {
      case 'kg': return 'кг';
      case 'pcs': return 'шт';
      case 'l': return 'л';
      default: return String(u);
    }
  };

  // Форматирование даты для отображения
  const formatDateForDisplay = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      // Проверка на корректную дату
      if (isNaN(d.getTime())) {
        return dateStr; // Возвращаем как есть, если невалидная
      }
      return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return dateStr;
    }
  };

  // Поиск рецепта по ID в загруженном массиве рецептов
  const findRecipeById = (id: string | undefined): Recipe | undefined =>
    recipes.find((r) => r.id === id);

  // Поиск продукта по ID в загруженном массиве продуктов
  const findProductById = (id: string | undefined): Product | undefined =>
    products.find((p) => p.id === id);

  // --- ЗАГРУЗКА ВСЕХ ДАННЫХ (PRODUCTS, RECIPES, ORDERS) ---
  const fetchAllOrdersData = async () => {
    if (!currentUser) {
      setOrders([]);
      setRecipes([]);
      setProducts([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      // Загрузка продуктов пользователя
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      const productsSnap = await getDocs(query(userProductsCollectionRef));
      const fetchedProducts: Product[] = productsSnap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
      setProducts(fetchedProducts);

      // Загрузка рецептов пользователя
      const userRecipesCollectionRef = collection(db, 'users', currentUser.uid, 'recipes');
      const recipesSnap = await getDocs(query(userRecipesCollectionRef));
      const fetchedRecipes: Recipe[] = recipesSnap.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id }));
      setRecipes(fetchedRecipes);

      // Загрузка заказов пользователя
      const userOrdersCollectionRef = collection(db, 'users', currentUser.uid, 'orders');
      const ordersSnap = await getDocs(query(userOrdersCollectionRef));
      const fetchedOrders: Order[] = ordersSnap.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
      // Сортировка по дате - новые сначала (по убыванию)
      fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(fetchedOrders);

      showNotification('Данные заказов успешно загружены.', 'success');
    } catch (error) {
      console.error('Ошибка при загрузке данных заказов:', error);
      showNotification('Не удалось загрузить данные заказов. Пожалуйста, попробуйте еще раз.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  // Вызов загрузки данных при изменении пользователя или при первом рендере
  useEffect(() => {
    if (!authLoading) {
      fetchAllOrdersData();
    }
  }, [authLoading, currentUser]);

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

  // Создание нового заказа
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для создания заказов.', 'error');
      return;
    }
    if (!newOrderName.trim() || !newOrderDate) {
      showNotification('Пожалуйста, заполните название и дату заказа.', 'info');
      return;
    }

    try {
      const userOrdersCollectionRef = collection(db, 'users', currentUser.uid, 'orders');
      await addDoc(userOrdersCollectionRef, {
        name: newOrderName.trim(),
        date: newOrderDate,
        items: [],
      });
      setNewOrderName('');
      setNewOrderDate('');
      showNotification('Заказ успешно создан.', 'success');
      await fetchAllOrdersData(); // Обновляем список
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      showNotification('Не удалось создать заказ. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // Обновление состояния addForm для конкретного заказа
  const updateAddForm = (orderId: string, field: keyof AddFormState[string], value: string) => {
    setAddForm((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  // Добавление блюда в заказ
  const handleAddItemToOrder = async (orderId: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения заказов.', 'error');
      return;
    }
    const form = addForm[orderId];
    if (!form || !form.selectedRecipeId || !form.qty || parseFloat(form.qty) <= 0) {
      showNotification('Пожалуйста, выберите блюдо и укажите корректное количество порций.', 'info');
      return;
    }

    const orderDocRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
    const currentOrder = orders.find((o) => o.id === orderId);

    if (!currentOrder) {
      showNotification('Заказ не найден.', 'error');
      return;
    }

    // Проверяем, есть ли уже такой рецепт, и если есть, то обновляем его количество порций
    const existingItemIndex = currentOrder.items.findIndex(
      (item) => item.recipeId === form.selectedRecipeId
    );

    let newItems: OrderItem[];
    if (existingItemIndex !== -1) {
      newItems = currentOrder.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, qty: item.qty + parseFloat(form.qty || '0') }
          : item
      );
      showNotification('Количество порций для существующего блюда обновлено.', 'info');
    } else {
      newItems = [
        ...currentOrder.items,
        { recipeId: form.selectedRecipeId, qty: parseFloat(form.qty || '0') },
      ];
      showNotification('Блюдо добавлено в заказ.', 'success');
    }

    try {
      await updateDoc(orderDocRef, { items: newItems });
      setAddForm((prev) => ({ ...prev, [orderId]: {} })); // Очищаем форму добавления для этого заказа
      await fetchAllOrdersData(); // Обновляем список
    } catch (error) {
      console.error('Ошибка при добавлении блюда в заказ:', error);
      showNotification('Не удалось добавить блюдо в заказ. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // Обновление количества порций блюда в заказе
  const handleUpdateItemQty = async (orderId: string, index: number, value: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения заказов.', 'error');
      return;
    }
    const newQty = parseFloat(value);
    if (isNaN(newQty) || newQty <= 0) {
      showNotification('Количество порций должно быть положительным числом.', 'info');
      return;
    }

    const orderDocRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
    const currentOrder = orders.find((o) => o.id === orderId);

    if (!currentOrder) {
      showNotification('Заказ не найден.', 'error');
      return;
    }

    const updatedItems = currentOrder.items.map((item, i) =>
      i === index ? { ...item, qty: newQty } : item
    );

    try {
      await updateDoc(orderDocRef, { items: updatedItems });
      showNotification('Количество порций обновлено.', 'success');
      // Оптимизация: обновить только текущий заказ в стейте
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, items: updatedItems } : o))
      );
    } catch (error) {
      console.error('Ошибка при обновлении количества порций:', error);
      showNotification('Не удалось обновить количество порций. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // Удаление блюда из заказа
  const handleRemoveItemFromOrder = async (orderId: string, index: number) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения заказов.', 'error');
      return;
    }

    const orderDocRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
    const currentOrder = orders.find((o) => o.id === orderId);

    if (!currentOrder) {
      showNotification('Заказ не найден.', 'error');
      return;
    }

    const updatedItems = currentOrder.items.filter((_, i) => i !== index);

    try {
      await updateDoc(orderDocRef, { items: updatedItems });
      showNotification('Блюдо удалено из заказа.', 'success');
      // Оптимизация: обновить только текущий заказ в стейте
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, items: updatedItems } : o))
      );
    } catch (error) {
      console.error('Ошибка при удалении блюда из заказа:', error);
      showNotification('Не удалось удалить блюдо из заказа. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // Удаление заказа
  const handleDeleteOrder = async (orderId: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для удаления заказов.', 'error');
      return;
    }
    try {
      const orderDocRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
      await deleteDoc(orderDocRef);
      showNotification('Заказ успешно удален.', 'success');
      await fetchAllOrdersData(); // Обновляем список
    } catch (error) {
      console.error('Ошибка при удалении заказа:', error);
      showNotification('Не удалось удалить заказ. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // --- ЛОГИКА РАСЧЕТА ПРОДУКТОВ ДЛЯ ЗАКАЗА ---
  const calculateProductsForOrder = (order: Order): CalculatedProduct[] => {
    const result: { [productId: string]: CalculatedProduct } = {};

    order.items.forEach((orderItem) => {
      const recipe = findRecipeById(orderItem.recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach((ingredient) => {
        const product = findProductById(ingredient.productId);
        if (!product) return;

        // Количество этого продукта, необходимое для одной порции рецепта * количество порций в заказе
        const neededAmount = ingredient.qty * orderItem.qty;

        if (result[product.id]) {
          result[product.id].amount += neededAmount;
        } else {
          result[product.id] = {
            name: product.name,
            unit: product.unit,
            amount: neededAmount,
          };
        }
      });
    });

    return Object.values(result);
  };

  // --- ФИЛЬТРАЦИЯ ДЛЯ ОТОБРАЖЕНИЯ ---

  const filteredOrders = useMemo(() => {
    let currentOrders = orders;

    if (searchDate) {
      currentOrders = currentOrders.filter((o) => o.date === searchDate);
    }
    return currentOrders;
  }, [orders, searchDate]);

  // --- UI РЕНДЕР ---

  // Отображение заглушки при загрузке
  if (authLoading || dataLoading) {
    return (
      <div className="page">
        <p>Загрузка данных...</p>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!currentUser) {
    return (
      <div className="page">
        <p>Пожалуйста, войдите, чтобы управлять вашими заказами.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Заказы</h1>

      {/* Поиск по дате */}
      <div className="search-date-form">
        <p>Поиск заказа по дате</p>
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="search-date-input"
        />
      </div>

      {/* Создание нового заказа */}
      <form className="order-form" onSubmit={handleCreateOrder}>
        <label className="title-new-order">Создание нового заказа</label>
        <input
          type="date"
          value={newOrderDate}
          className="date-new-order"
          onChange={(e) => setNewOrderDate(e.target.value)}
        />
        <input
          className="name-new-order"
          type="text"
          placeholder="Название заказа"
          value={newOrderName}
          onChange={(e) => setNewOrderName(e.target.value)}
        />
        <button className="btn-new-order" type="submit">
          + Создать заказ
        </button>
      </form>

      <h2>Список заказов</h2>
      {/* Заказы */}
      <ul className="order-list">
        {filteredOrders.length === 0 ? (
          <p>Пока нет заказов по вашему запросу.</p>
        ) : (
          filteredOrders.map((o) => (
            <li key={o.id} className="order-item">
              <div className="order-header">
                <strong className="order-name">{o.name}</strong>
                <span className="order-date">({formatDateForDisplay(o.date)})</span>
                <button className="delete-order-btn" onClick={() => handleDeleteOrder(o.id)}>
                  Удалить заказ
                </button>
              </div>

              <div className="order-recipes-container">
                <p>Блюда в заказе:</p>
                <ul className="order-recipes">
                  {o.items.length === 0 ? (
                    <li>Нет блюд в этом заказе.</li>
                  ) : (
                    o.items.map((item, i) => {
                      const recipe = findRecipeById(item.recipeId);
                      return (
                        <li className="order-recipe-item" key={item.recipeId}> {/* Используем recipeId как key */}
                          {recipe ? recipe.name : 'Неизвестное блюдо'} —
                          <input
                            className="qty-person-input"
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleUpdateItemQty(o.id, i, e.target.value)}
                          />
                          порц.
                          <button onClick={() => handleRemoveItemFromOrder(o.id, i)}>×</button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div>
                <p>Необходимые продукты для заказа:</p>
                <ul className="order-summary">
                  {calculateProductsForOrder(o).length === 0 ? (
                    <li>Нет данных для расчета.</li>
                  ) : (
                    calculateProductsForOrder(o).map((p) => (
                      <li key={p.name}>{p.name} = {p.amount} {formatUnit(p.unit)}</li>
                    ))
                  )}
                </ul>
              </div>

              <p>Добавление блюда к заказу:</p>
              <div className="order-add">
                {/* Селект для категории рецептов */}
                <select
                  className="select-category" // Я изменил название класса, чтобы избежать конфликта с существующим css
                  value={addForm[o.id]?.selectedCategory || 'all'}
                  onChange={(e) => updateAddForm(o.id, 'selectedCategory', e.target.value)}
                >
                  <option value="all">Все категории</option>
                  <option value="salad">{getRecipeCategoryLabel('salad')}</option>
                  <option value="hot">{getRecipeCategoryLabel('hot')}</option>
                  <option value="snack">{getRecipeCategoryLabel('snack')}</option>
                  <option value="drink">{getRecipeCategoryLabel('drink')}</option>
                  <option value="dessert">{getRecipeCategoryLabel('dessert')}</option>
                  <option value="other">{getRecipeCategoryLabel('other')}</option>
                </select>

                {/* Селект для выбора рецепта */}
                <select
                  className="select-recipe"
                  value={addForm[o.id]?.selectedRecipeId || ''}
                  onChange={(e) => updateAddForm(o.id, 'selectedRecipeId', e.target.value)}
                >
                  <option value="">Выбрать блюдо</option>
                  {recipes
                    .filter((r) =>
                      addForm[o.id]?.selectedCategory && addForm[o.id]?.selectedCategory !== 'all'
                        ? r.category === addForm[o.id].selectedCategory
                        : true
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({getRecipeCategoryLabel(r.category)})
                      </option>
                    ))}
                </select>

                {/* Инпут для количества порций */}
                <input
                  className="add-recipe-qty"
                  type="number"
                  min="1"
                  placeholder="Кол-во порций"
                  value={addForm[o.id]?.qty || ''}
                  onChange={(e) => updateAddForm(o.id, 'qty', e.target.value)}
                />
                <button className="add-recipe-btn" onClick={() => handleAddItemToOrder(o.id)}>
                  + Добавить блюдо
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default Orders;
