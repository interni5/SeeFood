/**
 * Модуль для работы с API
 * Отвечает за все HTTP запросы к серверу
 */

const ApiModule = (() => {
    // Базовый URL API
    const API_BASE = '/api';
    
    /**
     * Обертка для fetch с обработкой ошибок
     * @param {string} url - URL для запроса
     * @param {Object} options - Опции fetch
     * @returns {Promise} Промис с результатом
     */
    const fetchWithErrorHandling = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Ошибка запроса к ${url}:`, error);
            throw error;
        }
    };
    
    /**
     * Анализирует блюдо через ИИ
     * @param {string} foodText - Описание блюда
     * @param {string} mealType - Тип приема пищи
     * @returns {Promise} Промис с результатом анализа
     */
    const analyzeFood = async (foodText, mealType) => {
        return fetchWithErrorHandling(`${API_BASE}/analyze`, {
            method: 'POST',
            body: JSON.stringify({
                food: foodText,
                meal: mealType
            })
        });
    };
    
    /**
     * Получает дневник питания
     * @returns {Promise} Промис с данными дневника
     */
    const getDiary = async () => {
        return fetchWithErrorHandling(`${API_BASE}/diary`);
    };
    
    /**
     * Удаляет запись из дневника
     * @param {string} mealType - Тип приема пищи
     * @param {number} index - Индекс записи
     * @returns {Promise} Промис с результатом
     */
    const deleteMeal = async (mealType, index) => {
        return fetchWithErrorHandling(`${API_BASE}/diary/${mealType}`, {
            method: 'DELETE',
            body: JSON.stringify({ index })
        });
    };
    
    /**
     * Получает историю весов
     * @returns {Promise} Промис с данными весов
     */
    const getWeights = async () => {
        return fetchWithErrorHandling(`${API_BASE}/weight`);
    };
    
    /**
     * Добавляет запись веса
     * @param {number} weight - Вес в кг
     * @returns {Promise} Промис с результатом
     */
    const addWeight = async (weight) => {
        return fetchWithErrorHandling(`${API_BASE}/weight`, {
            method: 'POST',
            body: JSON.stringify({ kg: weight })
        });
    };
    
    /**
     * Получает цели пользователя
     * @returns {Promise} Промис с целями
     */
    const getGoals = async () => {
        return fetchWithErrorHandling(`${API_BASE}/goals`);
    };
    
    /**
     * Сохраняет цели пользователя
     * @param {Object} goals - Объект с целями
     * @returns {Promise} Промис с результатом
     */
    const saveGoals = async (goals) => {
        return fetchWithErrorHandling(`${API_BASE}/goals`, {
            method: 'POST',
            body: JSON.stringify(goals)
        });
    };
    
    /**
     * Получает совет от ИИ
     * @param {Object} totals - Текущие потребления
     * @returns {Promise} Промис с советом
     */
    const getAiTip = async (totals) => {
        return fetchWithErrorHandling(`${API_BASE}/tip`, {
            method: 'POST',
            body: JSON.stringify(totals)
        });
    };
    
    /**
     * Получает профиль пользователя
     * @returns {Promise} Промис с профилем
     */
    const getProfile = async () => {
        return fetchWithErrorHandling(`${API_BASE}/profile`);
    };
    
    /**
     * Сохраняет профиль пользователя
     * @param {Object} profile - Данные профиля
     * @returns {Promise} Промис с результатом
     */
    const saveProfile = async (profile) => {
        return fetchWithErrorHandling(`${API_BASE}/profile`, {
            method: 'POST',
            body: JSON.stringify(profile)
        });
    };
    
    /**
     * Получает статистику
     * @returns {Promise} Промис со статистикой
     */
    const getStats = async () => {
        return fetchWithErrorHandling(`${API_BASE}/stats`);
    };
    
    /**
     * Проверяет доступность API
     * @returns {Promise} Промис с результатом проверки
     */
    const healthCheck = async () => {
        try {
            const response = await fetch(`${API_BASE}/health`);
            return response.ok;
        } catch {
            return false;
        }
    };
    
    return {
        analyzeFood,
        getDiary,
        deleteMeal,
        getWeights,
        addWeight,
        getGoals,
        saveGoals,
        getAiTip,
        getProfile,
        saveProfile,
        getStats,
        healthCheck
    };
})();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiModule;
} else {
    window.ApiModule = ApiModule;
}