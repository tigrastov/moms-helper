
// import { useState, useEffect, useMemo } from 'react';
// import './Recipes.css'; // Предполагается, что у вас есть этот файл стилей
// import { db } from '../Firebase/firebase-config';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   updateDoc,
//   deleteDoc,
//   query, // Добавляем query для явных запросов
// } from 'firebase/firestore';
// import { useAuth } from '../Firebase/AuthContext';
// import { useNotification } from '../Context/NotificationContext'; // Импортируем наш хук уведомлений

// // --- ИНТЕРФЕЙСЫ ДАННЫХ ---
// // Продукт (должен быть согласован с src/Pages/Products.tsx)
// interface Product {
//   id: string;
//   name: string;
//   unit: 'kg' | 'pcs' | 'l';
// }

// // Ингредиент в рецепте
// interface Ingredient {
//   productId: string; // ID продукта
//   qty: number;       // Количество
// }

// // Категории рецептов
// type RecipeCategory = 'salad' | 'hot' | 'snack' | 'drink' | 'dessert' | 'other';

// // Рецепт
// interface Recipe {
//   id: string;
//   name: string;
//   category: RecipeCategory;
//   ingredients: Ingredient[];
//   // Можно добавить другие поля, например, количество порций
//   portions?: number;
// }

// function Recipes() {
//   const { currentUser, loading: authLoading } = useAuth();
//   const { showNotification } = useNotification(); // Получаем функцию для уведомлений

//   const [recipes, setRecipes] = useState<Recipe[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [dataLoading, setDataLoading] = useState(true); // Состояние загрузки данных

//   // --- СОСТОЯНИЯ ДЛЯ ФОРМ И ПОИСКА ---
//   const [recipeName, setRecipeName] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('salad'); // Имя, чтобы не конфликтовать с products.category

//   const [selectedProductToAdd, setSelectedProductToAdd] = useState(''); // ID продукта, выбранного для добавления в ингредиенты
//   const [ingredientQty, setIngredientQty] = useState('');

//   const [productSearchInIngredients, setProductSearchInIngredients] = useState(''); // Поиск продуктов для ингредиентов
//   const [recipeSearch, setRecipeSearch] = useState(''); // Поиск по рецептам
//   const [recipeFilter, setRecipeFilter] = useState<RecipeCategory | 'all'>('all'); // Фильтр по категориям рецептов
//   const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

//   // --- ХЕЛПЕРЫ ---

//   // Форматирование единиц измерения (как в Products.tsx)
//   const formatUnit = (u: Product['unit']): string => {
//     switch (u) {
//       case 'kg': return 'кг';
//       case 'pcs': return 'шт';
//       case 'l': return 'л';
//       default: return String(u);
//     }
//   };

//   // Лейблы категорий рецептов
//   const getRecipeCategoryLabel = (c: RecipeCategory | 'all'): string => {
//     switch (c) {
//       case 'all': return 'Все';
//       case 'salad': return 'Салат';
//       case 'hot': return 'Горячее';
//       case 'snack': return 'Закуска';
//       case 'drink': return 'Напиток';
//       case 'dessert': return 'Десерт';
//       case 'other': return 'Другое';
//       default: return String(c);
//     }
//   };
  
//    const toggleRecipeExpansion = (recipeId: string) => {
//     setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
//   };
//   // Поиск продукта по ID в загруженном массиве продуктов
//   const findProductById = (id: string | undefined): Product | undefined =>
//     products.find((p) => p.id === id);

//   // --- ЗАГРУЗКА ДАННЫХ (PRODUCTS И RECIPES) ---
//   const fetchAllData = async () => {
//     if (!currentUser) {
//       setProducts([]);
//       setRecipes([]);
//       setDataLoading(false);
//       return;
//     }

//     setDataLoading(true);
//     try {
//       // Загрузка продуктов пользователя
//       const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
//       const productsSnap = await getDocs(query(userProductsCollectionRef));
// const fetchedProducts: Product[] = productsSnap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
//       setProducts(fetchedProducts.sort((a, b) => a.name.localeCompare(b.name))); // Сразу сортируем продукты

//       // Загрузка рецептов пользователя
//       const userRecipesCollectionRef = collection(db, 'users', currentUser.uid, 'recipes');
//       const recipesSnap = await getDocs(query(userRecipesCollectionRef));
// const fetchedRecipes: Recipe[] = recipesSnap.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id }));
//       setRecipes(fetchedRecipes.sort((a, b) => a.name.localeCompare(b.name))); // Сразу сортируем рецепты

      
//     } catch (error) {
//       console.error('Ошибка при загрузке данных:', error);
//       showNotification('Не удалось загрузить данные. Пожалуйста, попробуйте еще раз.', 'error');
//     } finally {
//       setDataLoading(false);
//     }
//   };

//   // Вызов загрузки данных при изменении пользователя или при первом рендере
//   useEffect(() => {
//     if (!authLoading) {
//       fetchAllData();
//     }
//   }, [authLoading, currentUser]); // Зависимости: загрузка авторизации и текущий пользователь

//   // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

//   const handleCreateRecipe = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!currentUser) {
//       showNotification('Вы должны быть авторизованы для создания рецептов.', 'error');
//       return;
//     }
//     if (!recipeName.trim()) {
//       showNotification('Название рецепта не может быть пустым.', 'info');
//       return;
//     }

//     try {
//       const userRecipesCollectionRef = collection(db, 'users', currentUser.uid, 'recipes');
//       await addDoc(userRecipesCollectionRef, {
//         name: recipeName.trim(),
//         category: selectedCategory,
//         ingredients: [],
//       });
//       setRecipeName('');
//       showNotification('Рецепт успешно создан.', 'success');
//       await fetchAllData(); // Обновляем список
//     } catch (error) {
//       console.error('Ошибка при создании рецепта:', error);
//       showNotification('Не удалось создать рецепт. Пожалуйста, попробуйте еще раз.', 'error');
//     }
//   };

//   const handleAddIngredient = async (recipeId: string) => {
//     if (!currentUser) {
//       showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
//       return;
//     }
//     if (!selectedProductToAdd || !ingredientQty || parseFloat(ingredientQty) <= 0) {
//       showNotification('Пожалуйста, выберите продукт и укажите корректное количество.', 'info');
//       return;
//     }

//     const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
//     const currentRecipe = recipes.find((r) => r.id === recipeId);

//     if (!currentRecipe) {
//       showNotification('Рецепт не найден.', 'error');
//       return;
//     }

//     // Проверяем, есть ли уже такой ингредиент, и если есть, то обновляем его количество
//     const existingIngredientIndex = currentRecipe.ingredients.findIndex(
//       (ing) => ing.productId === selectedProductToAdd
//     );

//     let newIngredients: Ingredient[];
//     if (existingIngredientIndex !== -1) {
//       newIngredients = currentRecipe.ingredients.map((ing, index) =>
//         index === existingIngredientIndex
//           ? { ...ing, qty: ing.qty + parseFloat(ingredientQty) } // Прибавляем к существующему количеству
//           : ing
//       );
//       showNotification('Количество существующего ингредиента обновлено.', 'info');
//     } else {
//       newIngredients = [
//         ...currentRecipe.ingredients,
//         { productId: selectedProductToAdd, qty: parseFloat(ingredientQty) },
//       ];
//       showNotification('Ингредиент добавлен в рецепт.', 'success');
//     }

//     try {
//       await updateDoc(recipeDocRef, { ingredients: newIngredients });
//       setSelectedProductToAdd('');
//       setIngredientQty('');
//       setProductSearchInIngredients(''); // Очищаем поиск
//       await fetchAllData(); // Обновляем список
//     } catch (error) {
//       console.error('Ошибка при добавлении ингредиента:', error);
//       showNotification('Не удалось добавить ингредиент. Пожалуйста, попробуйте еще раз.', 'error');
//     }
//   };

//   const handleUpdateIngredientQty = async (recipeId: string, index: number, value: string) => {
//     if (!currentUser) {
//       showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
//       return;
//     }
//     const newQty = parseFloat(value);
//     if (isNaN(newQty) || newQty <= 0) {
//       showNotification('Количество должно быть положительным числом.', 'info');
//       return;
//     }

//     const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
//     const currentRecipe = recipes.find((r) => r.id === recipeId);

//     if (!currentRecipe) {
//       showNotification('Рецепт не найден.', 'error');
//       return;
//     }

//     const updatedIngredients = currentRecipe.ingredients.map((ing, i) =>
//       i === index ? { ...ing, qty: newQty } : ing
//     );

//     try {
//       await updateDoc(recipeDocRef, { ingredients: updatedIngredients });
//       showNotification('Количество ингредиента обновлено.', 'success');
//       // Оптимизация: вместо fetchAllData, можно обновить только текущий рецепт в стейте
//       setRecipes((prev) =>
//         prev.map((r) => (r.id === recipeId ? { ...r, ingredients: updatedIngredients } : r))
//       );
//     } catch (error) {
//       console.error('Ошибка при обновлении количества ингредиента:', error);
//       showNotification('Не удалось обновить количество ингредиента. Пожалуйста, попробуйте еще раз.', 'error');
//     }
//   };

//   const handleDeleteIngredient = async (recipeId: string, index: number) => {
//     if (!currentUser) {
//       showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
//       return;
//     }

//     const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
//     const currentRecipe = recipes.find((r) => r.id === recipeId);

//     if (!currentRecipe) {
//       showNotification('Рецепт не найден.', 'error');
//       return;
//     }

//     const updatedIngredients = currentRecipe.ingredients.filter((_, i) => i !== index);

//     try {
//       await updateDoc(recipeDocRef, { ingredients: updatedIngredients });
//       showNotification('Ингредиент удален из рецепта.', 'success');
//       // Оптимизация: вместо fetchAllData, можно обновить только текущий рецепт в стейте
//       setRecipes((prev) =>
//         prev.map((r) => (r.id === recipeId ? { ...r, ingredients: updatedIngredients } : r))
//       );
//     } catch (error) {
//       console.error('Ошибка при удалении ингредиента:', error);
//       showNotification('Не удалось удалить ингредиент. Пожалуйста, попробуйте еще раз.', 'error');
//     }
//   };

//   const handleDeleteRecipe = async (recipeId: string) => {
//     if (!currentUser) {
//       showNotification('Вы должны быть авторизованы для удаления рецептов.', 'error');
//       return;
//     }
//     try {
//       const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
//       await deleteDoc(recipeDocRef);
//       showNotification('Рецепт успешно удален.', 'success');
//       await fetchAllData(); // Обновляем список
//     } catch (error) {
//       console.error('Ошибка при удалении рецепта:', error);
//       showNotification('Не удалось удалить рецепт. Пожалуйста, попробуйте еще раз.', 'error');
//     }
//   };

//   // --- ФИЛЬТРАЦИЯ И ПОИСК ДЛЯ ОТОБРАЖЕНИЯ ---

//   // Фильтрация продуктов для селекта ингредиентов (useMemo для производительности)
//   const filteredProductsForIngredients = useMemo(() => {
//     if (!productSearchInIngredients.trim()) {
//       return products;
//     }
//     return products.filter((p) =>
//       p.name.toLowerCase().includes(productSearchInIngredients.toLowerCase())
//     );
//   }, [products, productSearchInIngredients]);


//   // Фильтрация и поиск рецептов (useMemo для производительности)
//   const filteredRecipes = useMemo(() => {
//     let result = recipes;

//     if (recipeFilter !== 'all') {
//       result = result.filter((r) => r.category === recipeFilter);
//     }

//     if (recipeSearch.trim()) {
//       result = result.filter((r) =>
//         r.name.toLowerCase().includes(recipeSearch.toLowerCase())
//       );
//     }

//     return result;
//   }, [recipes, recipeFilter, recipeSearch]);

//   // --- UI РЕНДЕР ---

//   if (authLoading || dataLoading) {
//     return (
//       <div className="page">
//         <p>Загрузка данных...</p>
//       </div>
//     );
//   }

//   if (!currentUser) {
//     return (
//       <div className="page">
//         <p>Пожалуйста, войдите, чтобы управлять вашими рецептами.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="page">
//       <h1>Рецепты</h1>

//       {/* Поиск рецептов */}
//       <div className="recipe-search-container">
//         <input
//           className="search-input-recipe"
//           type="text"
//           placeholder="Поиск рецепта"
//           value={recipeSearch}
//           onChange={(e) => setRecipeSearch(e.target.value)}
//         />
//       </div>

//       {/* Фильтр по категориям рецептов */}
//       <div className="category-filter">
//         {['all', 'salad', 'hot', 'snack', 'drink', 'dessert', 'other'].map((key) => (
//           <button
//             key={key}
//             className={`category-filter-button ${recipeFilter === key ? 'filter-active' : ''}`}
//             onClick={() => setRecipeFilter(key as RecipeCategory | 'all')}
//           >
//             {getRecipeCategoryLabel(key as RecipeCategory | 'all')}
//           </button>
//         ))}
//       </div>

//       {/* Форма создания нового рецепта */}
//       <form className="new-recipe-form" onSubmit={handleCreateRecipe}>
//         <h3>Новое блюдо</h3>
//         <div className="new-recipe-inputs">
//           <input
//             className="new-recipe-input"
//             type="text"
//             placeholder="Название блюда"
//             value={recipeName}
//             onChange={(e) => setRecipeName(e.target.value)}
//           />
//           <select
//             className="recipe-category"
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value as RecipeCategory)}
//           >
//             <option value="salad">{getRecipeCategoryLabel('salad')}</option>
//             <option value="hot">{getRecipeCategoryLabel('hot')}</option>
//             <option value="snack">{getRecipeCategoryLabel('snack')}</option>
//             <option value="drink">{getRecipeCategoryLabel('drink')}</option>
//             <option value="dessert">{getRecipeCategoryLabel('dessert')}</option>
//             <option value="other">{getRecipeCategoryLabel('other')}</option>
//           </select>
//           <button className="create-recipe-btn" type="submit">
//             + Создать
//           </button>
//         </div>
//       </form>

//       {/* Список блюд в виде аккордеона */}
//       <div className="recipes-list">
//         <h2>Список блюд ({filteredRecipes.length})</h2>
        
//         {filteredRecipes.length === 0 ? (
//           <p className="no-recipes">Пока нет рецептов в этой категории или по вашему запросу.</p>
//         ) : (
//           <div className="recipes-accordion">
//             {filteredRecipes.map((r) => {
//               const isExpanded = expandedRecipeId === r.id;
//               const ingredientCount = r.ingredients.length;
              
//               return (
//                 <div className="recipe-accordion-item" key={r.id}>
//                   {/* ЗАГОЛОВОК АККОРДЕОНА (всегда виден) */}
//                   <div 
//                     className="recipe-accordion-header"
//                     onClick={() => toggleRecipeExpansion(r.id)}
//                   >
//                     <div className="recipe-header-left">
//                       <span className={`accordion-arrow ${isExpanded ? 'expanded' : ''}`}>
//                         ▶
//                       </span>
//                       <div className="recipe-header-info">
//                         <strong className="recipe-name">{r.name}</strong>
//                         <span className="recipe-category-badge">
//                           {getRecipeCategoryLabel(r.category)}
//                         </span>
//                       </div>
//                       <span className="ingredients-count">
//                         {ingredientCount} {ingredientCount === 1 ? 'ингредиент' : 
//                           ingredientCount > 1 && ingredientCount < 5 ? 'ингредиента' : 'ингредиентов'}
//                       </span>
//                     </div>
                    
//                     <button 
//                       className="delete-recipe-btn"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteRecipe(r.id);
//                       }}
//                     >
//                       Удалить
//                     </button>
//                   </div>

//                   {/* СОДЕРЖИМОЕ АККОРДЕОНА (только если открыт) */}
//                   {isExpanded && (
//                     <div className="recipe-accordion-content">
//                       <button className="collapse-recipe-btn" onClick={() => toggleRecipeExpansion(r.id)} >Свернуть</button>
//                       {/* Секция добавления ингредиента в рецепт */}
//                       <div className="ingredient-add-section">
//                         <h4>Добавить ингредиент</h4>
//                         <div className="ingredient-add-form">
//                           <input
//                             type="text"
//                             className="product-search-in-recipe"
//                             placeholder="Поиск продукта"
//                             value={productSearchInIngredients}
//                             onChange={(e) => setProductSearchInIngredients(e.target.value)}
//                           />

//                           <select
//                             className="select-product-in-recipe"
//                             value={selectedProductToAdd}
//                             onChange={(e) => setSelectedProductToAdd(e.target.value)}
//                           >
//                             <option value="">Выбрать продукт</option>
//                             {filteredProductsForIngredients.map((p) => (
//                               <option key={p.id} value={p.id}>
//                                 {p.name} ({formatUnit(p.unit)})
//                               </option>
//                             ))}
//                           </select>

//                           <div className="quantity-input-wrapper">
//                             <input
//                               className="qntt-product-selector"
//                               type="number"
//                               step="0.01"
//                               min="0.01"
//                               placeholder="Кол-во"
//                               value={ingredientQty}
//                               onChange={(e) => setIngredientQty(e.target.value)}
//                             />
//                             <span className="unit-label">
//                               {selectedProductToAdd
//                                 ? formatUnit(findProductById(selectedProductToAdd)?.unit || 'pcs')
//                                 : ''}
//                             </span>
//                           </div>

//                           <button
//                             className="add-ingredient-btn"
//                             onClick={() => handleAddIngredient(r.id)}
//                           >
//                             + Добавить
//                           </button>
//                         </div>
//                       </div>

//                       {/* Список ингредиентов текущего рецепта */}
//                       <div className="ingredients-section">
//                         <h4>Ингредиенты</h4>
//                         <ul className="ingredients-list">
//                           {r.ingredients.length === 0 ? (
//                             <li className="no-ingredients">Нет ингредиентов.</li>
//                           ) : (
//                             r.ingredients.map((ing, i) => {
//                               const prod = findProductById(ing.productId);
//                               return (
//                                 <li className="ingredient-item" key={`${ing.productId}-${i}`}>
//                                   <div className="ingredient-info">
//                                     <span className="ingredient-name">
//                                       {prod ? prod.name : 'Неизвестный продукт'}
//                                     </span>
//                                   </div>
//                                   <div className="ingredient-controls">
//                                     <input
//                                       className="input-qntt-ingrdts"
//                                       type="number"
//                                       step="0.01"
//                                       min="0.01"
//                                       value={ing.qty}
//                                       onChange={(e) =>
//                                         handleUpdateIngredientQty(r.id, i, e.target.value)
//                                       }
//                                     />
//                                     <span className="unit-label">
//                                       {prod ? formatUnit(prod.unit) : ''}
//                                     </span>
//                                     <button
//                                       className="delete-ingredient-btn"
//                                       onClick={() => handleDeleteIngredient(r.id, i)}
//                                     >
//                                       ×
//                                     </button>
//                                   </div>
//                                 </li>
//                               );
//                             })
//                           )}
//                         </ul>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Recipes;


import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Recipes.css';
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

// --- ИНТЕРФЕЙСЫ ДАННЫХ ---
interface Product {
  id: string;
  name: string;
  unit: 'kg' | 'pcs' | 'l';
}

interface Ingredient {
  productId: string;
  qty: number;
}

type RecipeCategory = 'salad' | 'hot' | 'snack' | 'drink' | 'dessert' | 'other';

interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  portions?: number;
}

function Recipes() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // --- СОСТОЯНИЯ ДЛЯ ФОРМ И ПОИСКА ---
  const [recipeName, setRecipeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('salad');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');
  const [productSearchInIngredients, setProductSearchInIngredients] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeFilter, setRecipeFilter] = useState<RecipeCategory | 'all'>('all');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // --- ХЕЛПЕРЫ ---
  const formatUnit = (u: Product['unit']): string => {
    switch (u) {
      case 'kg': return 'кг';
      case 'pcs': return 'шт';
      case 'l': return 'л';
      default: return String(u);
    }
  };

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
  
  const toggleRecipeExpansion = (recipeId: string) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const findProductById = (id: string | undefined): Product | undefined =>
    products.find((p) => p.id === id);

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchAllData = async () => {
    if (!currentUser) {
      setProducts([]);
      setRecipes([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      const userProductsCollectionRef = collection(db, 'users', currentUser.uid, 'products');
      const productsSnap = await getDocs(query(userProductsCollectionRef));
      const fetchedProducts: Product[] = productsSnap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
      setProducts(fetchedProducts.sort((a, b) => a.name.localeCompare(b.name)));

      const userRecipesCollectionRef = collection(db, 'users', currentUser.uid, 'recipes');
      const recipesSnap = await getDocs(query(userRecipesCollectionRef));
      const fetchedRecipes: Recipe[] = recipesSnap.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id }));
      setRecipes(fetchedRecipes.sort((a, b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      showNotification('Не удалось загрузить данные. Пожалуйста, попробуйте еще раз.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAllData();
    }
  }, [authLoading, currentUser]);

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---
  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Войдите в систему для создания рецептов', 'info');
      navigate('/auth');
      return;
    }
    if (!recipeName.trim()) {
      showNotification('Название рецепта не может быть пустым.', 'info');
      return;
    }

    try {
      const userRecipesCollectionRef = collection(db, 'users', currentUser.uid, 'recipes');
      await addDoc(userRecipesCollectionRef, {
        name: recipeName.trim(),
        category: selectedCategory,
        ingredients: [],
      });
      setRecipeName('');
      showNotification('Рецепт успешно создан.', 'success');
      await fetchAllData();
    } catch (error) {
      console.error('Ошибка при создании рецепта:', error);
      showNotification('Не удалось создать рецепт. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  const handleAddIngredient = async (recipeId: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
      return;
    }
    if (!selectedProductToAdd || !ingredientQty || parseFloat(ingredientQty) <= 0) {
      showNotification('Пожалуйста, выберите продукт и укажите корректное количество.', 'info');
      return;
    }

    const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
    const currentRecipe = recipes.find((r) => r.id === recipeId);

    if (!currentRecipe) {
      showNotification('Рецепт не найден.', 'error');
      return;
    }

    const existingIngredientIndex = currentRecipe.ingredients.findIndex(
      (ing) => ing.productId === selectedProductToAdd
    );

    let newIngredients: Ingredient[];
    if (existingIngredientIndex !== -1) {
      newIngredients = currentRecipe.ingredients.map((ing, index) =>
        index === existingIngredientIndex
          ? { ...ing, qty: ing.qty + parseFloat(ingredientQty) }
          : ing
      );
      showNotification('Количество существующего ингредиента обновлено.', 'info');
    } else {
      newIngredients = [
        ...currentRecipe.ingredients,
        { productId: selectedProductToAdd, qty: parseFloat(ingredientQty) },
      ];
      showNotification('Ингредиент добавлен в рецепт.', 'success');
    }

    try {
      await updateDoc(recipeDocRef, { ingredients: newIngredients });
      setSelectedProductToAdd('');
      setIngredientQty('');
      setProductSearchInIngredients('');
      await fetchAllData();
    } catch (error) {
      console.error('Ошибка при добавлении ингредиента:', error);
      showNotification('Не удалось добавить ингредиент. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  const handleUpdateIngredientQty = async (recipeId: string, index: number, value: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
      return;
    }
    const newQty = parseFloat(value);
    if (isNaN(newQty) || newQty <= 0) {
      showNotification('Количество должно быть положительным числом.', 'info');
      return;
    }

    const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
    const currentRecipe = recipes.find((r) => r.id === recipeId);

    if (!currentRecipe) {
      showNotification('Рецепт не найден.', 'error');
      return;
    }

    const updatedIngredients = currentRecipe.ingredients.map((ing, i) =>
      i === index ? { ...ing, qty: newQty } : ing
    );

    try {
      await updateDoc(recipeDocRef, { ingredients: updatedIngredients });
      showNotification('Количество ингредиента обновлено.', 'success');
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, ingredients: updatedIngredients } : r))
      );
    } catch (error) {
      console.error('Ошибка при обновлении количества ингредиента:', error);
      showNotification('Не удалось обновить количество ингредиента. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  const handleDeleteIngredient = async (recipeId: string, index: number) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для изменения рецептов.', 'error');
      return;
    }

    const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
    const currentRecipe = recipes.find((r) => r.id === recipeId);

    if (!currentRecipe) {
      showNotification('Рецепт не найден.', 'error');
      return;
    }

    const updatedIngredients = currentRecipe.ingredients.filter((_, i) => i !== index);

    try {
      await updateDoc(recipeDocRef, { ingredients: updatedIngredients });
      showNotification('Ингредиент удален из рецепта.', 'success');
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, ingredients: updatedIngredients } : r))
      );
    } catch (error) {
      console.error('Ошибка при удалении ингредиента:', error);
      showNotification('Не удалось удалить ингредиент. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!currentUser) {
      showNotification('Вы должны быть авторизованы для удаления рецептов.', 'error');
      return;
    }
    try {
      const recipeDocRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId);
      await deleteDoc(recipeDocRef);
      showNotification('Рецепт успешно удален.', 'success');
      await fetchAllData();
    } catch (error) {
      console.error('Ошибка при удалении рецепта:', error);
      showNotification('Не удалось удалить рецепт. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  // --- ФИЛЬТРАЦИЯ И ПОИСК ---
  const filteredProductsForIngredients = useMemo(() => {
    if (!productSearchInIngredients.trim()) {
      return products;
    }
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearchInIngredients.toLowerCase())
    );
  }, [products, productSearchInIngredients]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;

    if (recipeFilter !== 'all') {
      result = result.filter((r) => r.category === recipeFilter);
    }

    if (recipeSearch.trim()) {
      result = result.filter((r) =>
        r.name.toLowerCase().includes(recipeSearch.toLowerCase())
      );
    }

    return result;
  }, [recipes, recipeFilter, recipeSearch]);

  // --- UI РЕНДЕР ---
  if (authLoading || (currentUser && dataLoading)) {
    return (
      <div className="page">
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Рецепты</h1>

      {/* Поиск рецептов - ДЛЯ ВСЕХ */}
      <div className="recipe-search-container">
        <input
          className="search-input-recipe"
          type="text"
          placeholder="Поиск рецепта"
          value={recipeSearch}
          onChange={(e) => setRecipeSearch(e.target.value)}
          disabled={!currentUser}
        />
      </div>

      {/* Фильтр по категориям рецептов - ДЛЯ ВСЕХ */}
      <div className="category-filter">
        {['all', 'salad', 'hot', 'snack', 'drink', 'dessert', 'other'].map((key) => (
          <button
            key={key}
            className={`category-filter-button ${recipeFilter === key ? 'filter-active' : ''}`}
            onClick={() => setRecipeFilter(key as RecipeCategory | 'all')}
            disabled={!currentUser}
          >
            {getRecipeCategoryLabel(key as RecipeCategory | 'all')}
          </button>
        ))}
      </div>

      {/* Форма создания нового рецепта - ДЛЯ ВСЕХ */}
      <form className="new-recipe-form" onSubmit={handleCreateRecipe}>
        <h3>Новое блюдо</h3>
        <div className="new-recipe-inputs">
          <input
            className="new-recipe-input"
            type="text"
            placeholder="Название блюда"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            disabled={!currentUser}
          />
          <select
            className="recipe-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as RecipeCategory)}
            disabled={!currentUser}
          >
            <option value="salad">{getRecipeCategoryLabel('salad')}</option>
            <option value="hot">{getRecipeCategoryLabel('hot')}</option>
            <option value="snack">{getRecipeCategoryLabel('snack')}</option>
            <option value="drink">{getRecipeCategoryLabel('drink')}</option>
            <option value="dessert">{getRecipeCategoryLabel('dessert')}</option>
            <option value="other">{getRecipeCategoryLabel('other')}</option>
          </select>
          <button 
            className="create-recipe-btn" 
            type="submit"
            title={!currentUser ? "Авторизоваться для создания рецептов" : ""}
          >
            {currentUser ? "+ Создать" : "Авторизоваться для создания рецептов"}
          </button>
        </div>
      </form>

      {/* Сообщение для неавторизованных */}
      {!currentUser && (
        <div className="auth-message">
          <p>Для управления рецептами необходимо войти в систему.</p>
        </div>
      )}

      {/* Список блюд - ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ */}
      {currentUser ? (
        <div className="recipes-list">
          <h2>Список блюд ({filteredRecipes.length})</h2>
          
          {filteredRecipes.length === 0 ? (
            <p className="no-recipes">Пока нет рецептов в этой категории или по вашему запросу.</p>
          ) : (
            <div className="recipes-accordion">
              {filteredRecipes.map((r) => {
                const isExpanded = expandedRecipeId === r.id;
                const ingredientCount = r.ingredients.length;
                
                return (
                  <div className="recipe-accordion-item" key={r.id}>
                    {/* ЗАГОЛОВОК АККОРДЕОНА (всегда виден) */}
                    <div 
                      className="recipe-accordion-header"
                      onClick={() => toggleRecipeExpansion(r.id)}
                    >
                      <div className="recipe-header-left">
                        <span className={`accordion-arrow ${isExpanded ? 'expanded' : ''}`}>
                          ▶
                        </span>
                        <div className="recipe-header-info">
                          <strong className="recipe-name">{r.name}</strong>
                          <span className="recipe-category-badge">
                            {getRecipeCategoryLabel(r.category)}
                          </span>
                        </div>
                        <span className="ingredients-count">
                          {ingredientCount} {ingredientCount === 1 ? 'ингредиент' : 
                            ingredientCount > 1 && ingredientCount < 5 ? 'ингредиента' : 'ингредиентов'}
                        </span>
                      </div>
                      
                      <button 
                        className="delete-recipe-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipe(r.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>

                    {/* СОДЕРЖИМОЕ АККОРДЕОНА (только если открыт) */}
                    {isExpanded && (
                      <div className="recipe-accordion-content">
                        <button className="collapse-recipe-btn" onClick={() => toggleRecipeExpansion(r.id)} >Свернуть</button>
                        {/* Секция добавления ингредиента в рецепт */}
                        <div className="ingredient-add-section">
                          <h4>Добавить ингредиент</h4>
                          <div className="ingredient-add-form">
                            <input
                              type="text"
                              className="product-search-in-recipe"
                              placeholder="Поиск продукта"
                              value={productSearchInIngredients}
                              onChange={(e) => setProductSearchInIngredients(e.target.value)}
                            />

                            <select
                              className="select-product-in-recipe"
                              value={selectedProductToAdd}
                              onChange={(e) => setSelectedProductToAdd(e.target.value)}
                            >
                              <option value="">Выбрать продукт</option>
                              {filteredProductsForIngredients.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatUnit(p.unit)})
                                </option>
                              ))}
                            </select>

                            <div className="quantity-input-wrapper">
                              <input
                                className="qntt-product-selector"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="Кол-во"
                                value={ingredientQty}
                                onChange={(e) => setIngredientQty(e.target.value)}
                              />
                              <span className="unit-label">
                                {selectedProductToAdd
                                  ? formatUnit(findProductById(selectedProductToAdd)?.unit || 'pcs')
                                  : ''}
                              </span>
                            </div>

                            <button
                              className="add-ingredient-btn"
                              onClick={() => handleAddIngredient(r.id)}
                            >
                              + Добавить
                            </button>
                          </div>
                        </div>

                        {/* Список ингредиентов текущего рецепта */}
                        <div className="ingredients-section">
                          <h4>Ингредиенты</h4>
                          <ul className="ingredients-list">
                            {r.ingredients.length === 0 ? (
                              <li className="no-ingredients">Нет ингредиентов.</li>
                            ) : (
                              r.ingredients.map((ing, i) => {
                                const prod = findProductById(ing.productId);
                                return (
                                  <li className="ingredient-item" key={`${ing.productId}-${i}`}>
                                    <div className="ingredient-info">
                                      <span className="ingredient-name">
                                        {prod ? prod.name : 'Неизвестный продукт'}
                                      </span>
                                    </div>
                                    <div className="ingredient-controls">
                                      <input
                                        className="input-qntt-ingrdts"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={ing.qty}
                                        onChange={(e) =>
                                          handleUpdateIngredientQty(r.id, i, e.target.value)
                                        }
                                      />
                                      <span className="unit-label">
                                        {prod ? formatUnit(prod.unit) : ''}
                                      </span>
                                      <button
                                        className="delete-ingredient-btn"
                                        onClick={() => handleDeleteIngredient(r.id, i)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="demo-section">
          <h2>Пример работы с рецептами</h2>
          <p>После авторизации вы сможете:</p>
          <ul className="demo-features">
            <li>Создавать рецепты с разными категориями</li>
            <li>Добавлять ингредиенты из списка продуктов</li>
            <li>Управлять количеством ингредиентов</li>
            <li>Использовать рецепты при создании заказов</li>
            <li>Автоматический расчет продуктов для заказов</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Recipes;