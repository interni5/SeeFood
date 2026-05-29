/**
 * Модуль управления состоянием приложения
 * Отвечает за хранение и управление данными
 */

const StateModule = (() => {
    // Начальное состояние
    let state = {
        goals: { kcal: 2000, protein: 150, fat: 65, carbs: 250, weight: 70 },
        meals: {},   // { "YYYY-MM-DD": { Завтрак: [...], Обед: [...], Ужин: [...], Перекус: [...] } }
        weights: [], // [{ date, value }]
        userProfile: {
            goal: 'eat_better',
            gender: 'male',
            height: 175,
            age: 30,
            activity: 'moderate'
        }
    };

    // Ключ для localStorage
    const STORAGE_KEY = 'calai_state';

    /**
     * Возвращает ключ для текущей даты
     * @returns {string} Ключ в формате YYYY-MM-DD
     */
    const todayKey = () => {
        return new Date().toISOString().slice(0, 10);
    };

    /**
     * Форматирует дату из ISO формата
     * @param {string} iso - Дата в формате YYYY-MM-DD
     * @returns {string} Дата в формате DD.MM.YYYY
     */
    const formatDate = (iso) => {
        const [y, m, d] = iso.split('-');
        return `${d}.${m}.${y}`;
    };

    /**
     * Сохраняет состояние в localStorage
     */
    const save = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    };

    /**
     * Загружает состояние из localStorage
     */
    const load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const savedState = JSON.parse(raw);
                // Мерджим сохраненное состояние с начальным
                state = { ...state, ...savedState };
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    };

    /**
     * Сбрасывает все данные
     */
    const reset = () => {
        state.meals = {};
        state.weights = [];
        save();
    };

    /**
     * Возвращает копию состояния
     * @returns {Object} Копия состояния
     */
    const getState = () => {
        return JSON.parse(JSON.stringify(state));
    };

    /**
     * Обновляет цели
     * @param {Object} newGoals - Новые цели
     */
    const updateGoals = (newGoals) => {
        state.goals = { ...state.goals, ...newGoals };
        save();
    };

    /**
     * Добавляет прием пищи
     * @param {string} mealType - Тип приема пищи
     * @param {Object} mealData - Данные о приеме пищи
     */
    const addMeal = (mealType, mealData) => {
        const today = todayKey();
        
        if (!state.meals[today]) {
            state.meals[today] = {};
        }
        
        if (!state.meals[today][mealType]) {
            state.meals[today][mealType] = [];
        }
        
        state.meals[today][mealType].push(mealData);
        save();
    };

    /**
     * Удаляет прием пищи
     * @param {string} mealType - Тип приема пищи
     * @param {number} index - Индекс в массиве
     */
    const removeMeal = (mealType, index) => {
        const today = todayKey();
        
        if (state.meals[today] && state.meals[today][mealType]) {
            state.meals[today][mealType].splice(index, 1);
            save();
        }
    };

    /**
     * Добавляет запись веса
     * @param {number} weight - Вес в кг
     */
    const addWeight = (weight) => {
        state.weights.unshift({
            date: todayKey(),
            value: weight
        });
        save();
    };

    /**
     * Обновляет профиль пользователя
     * @param {Object} profileData - Данные профиля
     */
    const updateProfile = (profileData) => {
        state.userProfile = { ...state.userProfile, ...profileData };
        save();
    };

    /**
     * Рассчитывает дневные итоги
     * @returns {Object} Итоги за день
     */
    const calculateDailyTotals = () => {
        const today = todayKey();
        const dayMeals = state.meals[today] || {};
        
        let totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
        
        Object.values(dayMeals).forEach(mealArray => {
            mealArray.forEach(meal => {
                totals.kcal += meal.kcal || 0;
                totals.protein += meal.protein || 0;
                totals.fat += meal.fat || 0;
                totals.carbs += meal.carbs || 0;
            });
        });
        
        return totals;
    };

    /**
     * Рассчитывает прогресс по целям
     * @returns {Object} Процент выполнения целей
     */
    const calculateProgress = () => {
        const totals = calculateDailyTotals();
        const goals = state.goals;
        
        return {
            kcal: goals.kcal > 0 ? Math.min(100, (totals.kcal / goals.kcal) * 100) : 0,
            protein: goals.protein > 0 ? Math.min(100, (totals.protein / goals.protein) * 100) : 0,
            fat: goals.fat > 0 ? Math.min(100, (totals.fat / goals.fat) * 100) : 0,
            carbs: goals.carbs > 0 ? Math.min(100, (totals.carbs / goals.carbs) * 100) : 0
        };
    };

    /**
     * Возвращает данные за последние N дней
     * @param {number} days - Количество дней
     * @returns {Array} Данные за дни
     */
    const getLastDaysData = (days = 7) => {
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().slice(0, 10);
            
            const dayMeals = state.meals[dateKey] || {};
            let dayKcal = 0;
            
            Object.values(dayMeals).forEach(mealArray => {
                mealArray.forEach(meal => {
                    dayKcal += meal.kcal || 0;
                });
            });
            
            result.push({
                date: dateKey,
                kcal: dayKcal,
                formattedDate: formatDate(dateKey),
                dayOfWeek: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()]
            });
        }
        
        return result;
    };

    // Инициализация
    load();

    return {
        todayKey,
        formatDate,
        getState,
        updateGoals,
        addMeal,
        removeMeal,
        addWeight,
        updateProfile,
        calculateDailyTotals,
        calculateProgress,
        getLastDaysData,
        reset,
        save
    };
})();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateModule;
} else {
    window.StateModule = StateModule;
}