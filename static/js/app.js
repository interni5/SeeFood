/**
 * CalAI Tracker - Главный файл приложения
 * Объединяет все модули и обеспечивает их работу
 */

// ============================================================================
// ЗАГРУЗКА МОДУЛЕЙ
// ============================================================================

// Проверяем, загружены ли модули
if (typeof StateModule === 'undefined') {
    console.error('Модуль StateModule не загружен');
}

if (typeof ApiModule === 'undefined') {
    console.error('Модуль ApiModule не загружен');
}

if (typeof UIModule === 'undefined') {
    console.error('Модуль UIModule не загружен');
}

if (typeof AppModule === 'undefined') {
    console.error('Модуль AppModule не загружен');
}

// ============================================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
// ============================================================================

// Эти функции вызываются из HTML атрибутов onclick

/**
 * Показывает вкладку
 * @param {string} name - Имя вкладки
 * @param {HTMLElement} btn - Кнопка вкладки
 */
function showTab(name, btn) {
    if (UIModule && UIModule.showTab) {
        UIModule.showTab(name, btn);
        if (AppModule) {
            switch (name) {
                case 'dashboard':
                    AppModule.updateDashboard();
                    break;
                case 'diary':
                    AppModule.updateDiaryTab();
                    break;
                case 'weight':
                    AppModule.updateWeightTab();
                    break;
                case 'goals':
                    AppModule.updateGoalsTab();
                    break;
            }
        }
    }
}

/**
 * Анализирует пищу
 */
function analyzeFood() {
    if (AppModule && AppModule.analyzeFood) {
        AppModule.analyzeFood();
    }
}

/**
 * Удаляет прием пищи
 * @param {string} group - Группа приема пищи
 * @param {number} idx - Индекс
 */
function removeMeal(group, idx) {
    if (AppModule && AppModule.removeMeal) {
        AppModule.removeMeal(group, idx);
    }
}

/**
 * Добавляет вес
 */
function addWeight() {
    if (AppModule && AppModule.addWeight) {
        AppModule.addWeight();
    }
}

/**
 * Сохраняет цели
 */
function saveGoals() {
    if (AppModule && AppModule.saveGoals) {
        AppModule.saveGoals();
    }
}

/**
 * Получает совет от ИИ
 */
function getAiTip() {
    if (AppModule && AppModule.getAiTip) {
        AppModule.getAiTip();
    }
}

/**
 * Показывает профиль
 */
function showProfile() {
    if (UIModule && UIModule.showProfileModal) {
        UIModule.showProfileModal();
    }
}

/**
 * Показывает модальное окно добавления
 */
function showAddModal() {
    if (UIModule && UIModule.showAddModal) {
        UIModule.showAddModal();
    }
}

/**
 * Закрывает модальное окно добавления
 */
function closeAddModal() {
    if (UIModule && UIModule.closeAddModal) {
        UIModule.closeAddModal();
    }
}

/**
 * Очищает все данные
 */
function clearAll() {
    if (AppModule && AppModule.clearAllData) {
        AppModule.clearAllData();
    }
}

/**
 * Сбрасывает данные и начинает заново
 */
function clearAndRestart() {
    if (AppModule && AppModule.clearAndRestart) {
        AppModule.clearAndRestart();
    }
}

/**
 * Применяет диету
 * @param {string} dietType - Тип диеты
 */
function applyDiet(dietType) {
    const diets = {
        balanced: { kcal: 2000, protein: 150, fat: 65, carbs: 250 },
        fasting: { kcal: 1800, protein: 140, fat: 60, carbs: 200 },
        high_protein: { kcal: 2200, protein: 180, fat: 70, carbs: 200 }
    };
    
    const diet = diets[dietType] || diets.balanced;
    
    // Обновляем поля формы
    document.getElementById('goal-kcal').value = diet.kcal;
    document.getElementById('goal-protein').value = diet.protein;
    document.getElementById('goal-fat').value = diet.fat;
    document.getElementById('goal-carbs').value = diet.carbs;
    
    // Показываем уведомление
    if (UIModule && UIModule.showToast) {
        UIModule.showToast(`Диета "${dietType}" применена`, 'success');
    }
}

// ============================================================================
// ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ ФОРМ
// ============================================================================

// Обработчик Enter для поля ввода пищи
document.addEventListener('DOMContentLoaded', function() {
    const foodInput = document.getElementById('ai-food-input');
    if (foodInput) {
        foodInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                analyzeFood();
            }
        });
    }
    
    // Обработчик Enter для поля ввода веса
    const weightInput = document.getElementById('weight-input');
    if (weightInput) {
        weightInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addWeight();
            }
        });
    }
});

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

console.log('CalAI Tracker загружен');

// Проверяем, что все модули загружены
if (StateModule && ApiModule && UIModule && AppModule) {
    console.log('Все модули успешно загружены');
    
    // Инициализируем приложение
    document.addEventListener('DOMContentLoaded', function() {
        if (AppModule.init) {
            AppModule.init();
        }
    });
} else {
    console.error('Не все модули загружены');
    
    // Показываем ошибку пользователю
    document.addEventListener('DOMContentLoaded', function() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--red);">
                    <h2>Ошибка загрузки приложения</h2>
                    <p>Не удалось загрузить все необходимые модули.</p>
                    <p>Пожалуйста, обновите страницу.</p>
                </div>
            `;
        }
    });
}