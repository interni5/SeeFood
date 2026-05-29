/**
 * Главный модуль приложения
 * Координирует работу всех модулей
 */

const AppModule = (() => {
    /**
     * Инициализирует приложение
     */
    const init = () => {
        console.log('Инициализация CalAI Tracker...');
        
        // Загружаем состояние
        StateModule.load();
        
        // Восстанавливаем последнюю вкладку
        UIModule.restoreLastTab();
        
        // Инициализируем обработчики событий
        initEventHandlers();
        
        // Загружаем начальные данные
        loadInitialData();
        
        // Проверяем подключение к API
        checkApiConnection();
        
        console.log('Приложение инициализировано');
    };
    
    /**
     * Инициализирует обработчики событий
     */
    const initEventHandlers = () => {
        // Обработчики для вкладок
        document.querySelectorAll('.nav-item[data-tab]').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = button.getAttribute('data-tab');
                if (tabName !== 'add') {
                    UIModule.showTab(tabName, button);
                    updateTabContent(tabName);
                }
            });
        });
        
        // Обработчик для кнопки анализа пищи
        const analyzeButton = document.getElementById('ai-btn');
        if (analyzeButton) {
            analyzeButton.addEventListener('click', analyzeFood);
        }
        
        // Обработчик для поля ввода пищи (Enter)
        const foodInput = document.getElementById('ai-food-input');
        if (foodInput) {
            foodInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    analyzeFood();
                }
            });
        }
        
        // Обработчик для кнопки добавления веса
        const weightButton = document.querySelector('.weight-row button');
        if (weightButton) {
            weightButton.addEventListener('click', addWeight);
        }
        
        // Обработчик для поля ввода веса (Enter)
        const weightInput = document.getElementById('weight-input');
        if (weightInput) {
            weightInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addWeight();
                }
            });
        }
        
        // Обработчик для кнопки сохранения целей
        const saveGoalsButton = document.querySelector('.save-btn');
        if (saveGoalsButton) {
            saveGoalsButton.addEventListener('click', saveGoals);
        }
        
        // Обработчик для кнопки получения совета
        const getTipButton = document.querySelector('.outline-btn');
        if (getTipButton) {
            getTipButton.addEventListener('click', getAiTip);
        }
        
        // Обработчик для кнопки профиля
        const profileButton = document.querySelector('.profile-btn');
        if (profileButton) {
            profileButton.addEventListener('click', UIModule.showProfileModal);
        }
        
        // Обработчик для центральной кнопки навигации
        const navCenterButton = document.querySelector('.nav-center');
        if (navCenterButton) {
            navCenterButton.addEventListener('click', UIModule.showAddModal);
        }
    };
    
    /**
     * Загружает начальные данные
     */
    const loadInitialData = async () => {
        try {
            // Загружаем цели с сервера
            const goalsData = await ApiModule.getGoals();
            if (goalsData && goalsData.goals) {
                StateModule.updateGoals(goalsData.goals);
            }
            
            // Загружаем профиль
            const profileData = await ApiModule.getProfile();
            if (profileData && profileData.user_profile) {
                StateModule.updateProfile(profileData.user_profile);
            }
            
            // Обновляем UI
            updateDashboard();
            updateDiaryTab();
            updateWeightTab();
            updateGoalsTab();
            
        } catch (error) {
            console.warn('Не удалось загрузить данные с сервера:', error);
            // Используем локальные данные
            updateDashboard();
            updateDiaryTab();
            updateWeightTab();
            updateGoalsTab();
        }
    };
    
    /**
     * Проверяет подключение к API
     */
    const checkApiConnection = async () => {
        const isConnected = await ApiModule.healthCheck();
        if (!isConnected) {
            UIModule.showToast('Нет подключения к серверу', 'warning');
        }
    };
    
    /**
     * Обновляет контент вкладки
     * @param {string} tabName - Имя вкладки
     */
    const updateTabContent = (tabName) => {
        switch (tabName) {
            case 'dashboard':
                updateDashboard();
                break;
            case 'diary':
                updateDiaryTab();
                break;
            case 'weight':
                updateWeightTab();
                break;
            case 'goals':
                updateGoalsTab();
                break;
        }
    };
    
    /**
     * Обновляет дашборд
     */
    const updateDashboard = () => {
        const state = StateModule.getState();
        const totals = StateModule.calculateDailyTotals();
        const weekData = StateModule.getLastDaysData(7);
        
        // Обновляем кольцо калорий
        UIModule.updateCaloriesRing(totals.kcal, state.goals.kcal);
        
        // Обновляем статистику макронутриентов
        UIModule.updateMacroStats(totals, state.goals);
        
        // Обновляем график недели
        UIModule.updateWeekChart(weekData, state.goals.kcal);
    };
    
    /**
     * Обновляет вкладку дневника
     */
    const updateDiaryTab = () => {
        const state = StateModule.getState();
        UIModule.updateDiary(state.meals);
    };
    
    /**
     * Обновляет вкладку веса
     */
    const updateWeightTab = () => {
        const state = StateModule.getState();
        UIModule.updateWeightChart(state.weights);
        UIModule.updateWeightList(state.weights);
    };
    
    /**
     * Обновляет вкладку целей
     */
    const updateGoalsTab = () => {
        const state = StateModule.getState();
        UIModule.updateGoalsForm(state.goals);
    };
    
    /**
     * Анализирует пищу через ИИ
     */
    const analyzeFood = async () => {
        const foodInput = document.getElementById('ai-food-input');
        const mealSelect = document.getElementById('meal-select');
        const resultDiv = document.getElementById('ai-result');
        const analyzeButton = document.getElementById('ai-btn');
        
        if (!foodInput || !mealSelect || !resultDiv || !analyzeButton) return;
        
        const foodText = foodInput.value.trim();
        const mealType = mealSelect.value;
        
        if (!foodText) {
            UIModule.showToast('Введите название блюда', 'warning');
            return;
        }
        
        // Показываем индикатор загрузки
        const restoreButton = UIModule.showButtonLoading(analyzeButton, 'Анализ...');
        resultDiv.textContent = '';
        
        try {
            // Отправляем запрос на анализ
            const result = await ApiModule.analyzeFood(foodText, mealType);
            
            if (result.success) {
                // Добавляем в локальное состояние
                StateModule.addMeal(mealType, result.item);
                
                // Показываем результат
                resultDiv.innerHTML = `
                    <strong>${result.item.name}</strong> — ${result.item.kcal} ккал 
                    · Б: ${result.item.protein}г · Ж: ${result.item.fat}г · У: ${result.item.carbs}г<br>
                    <span style="color:var(--green);font-size:12px">💡 ${result.item.note || ''}</span>
                `;
                
                // Очищаем поле ввода
                foodInput.value = '';
                
                // Обновляем UI
                updateDashboard();
                updateDiaryTab();
                
                // Показываем уведомление
                if (result.warning) {
                    UIModule.showToast('Блюдо добавлено вручную', 'warning');
                } else {
                    UIModule.showToast('Блюдо добавлено!');
                }
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Ошибка анализа:', error);
            resultDiv.innerHTML = 'Ошибка анализа. Проверьте подключение к серверу.';
            UIModule.showToast(`Ошибка: ${error.message}`, 'error');
        } finally {
            // Восстанавливаем кнопку
            restoreButton();
        }
    };
    
    /**
     * Удаляет прием пищи
     * @param {string} mealType - Тип приема пищи
     * @param {number} index - Индекс в массиве
     */
    const removeMeal = async (mealType, index) => {
        try {
            // Удаляем из локального состояния
            StateModule.removeMeal(mealType, index);
            
            // Пытаемся удалить с сервера
            await ApiModule.deleteMeal(mealType, index);
            
            // Обновляем UI
            updateDashboard();
            updateDiaryTab();
            
            UIModule.showToast('Запись удалена');
        } catch (error) {
            console.error('Ошибка удаления:', error);
            // Все равно обновляем UI, так как локальное состояние уже обновлено
            updateDashboard();
            updateDiaryTab();
            UIModule.showToast('Запись удалена (локально)', 'warning');
        }
    };
    
    /**
     * Добавляет вес
     */
    const addWeight = async () => {
        const weightInput = document.getElementById('weight-input');
        if (!weightInput) return;
        
        const weightValue = parseFloat(weightInput.value);
        
        if (!weightValue || weightValue < 20 || weightValue > 400) {
            UIModule.showToast('Введите корректный вес (20-400 кг)', 'warning');
            return;
        }
        
        try {
            // Добавляем на сервер
            const result = await ApiModule.addWeight(weightValue);
            
            if (result.success) {
                // Добавляем в локальное состояние
                StateModule.addWeight(weightValue);
                
                // Очищаем поле ввода
                weightInput.value = '';
                
                // Обновляем UI
                updateWeightTab();
                updateDashboard();
                
                UIModule.showToast('Вес сохранён!');
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Ошибка добавления веса:', error);
            // Добавляем локально, если сервер недоступен
            StateModule.addWeight(weightValue);
            weightInput.value = '';
            updateWeightTab();
            updateDashboard();
            UIModule.showToast('Вес сохранён (локально)', 'warning');
        }
    };
    
    /**
     * Сохраняет цели
     */
    const saveGoals = async () => {
        const goals = {
            kcal: parseInt(document.getElementById('goal-kcal').value) || 2000,
            protein: parseInt(document.getElementById('goal-protein').value) || 150,
            fat: parseInt(document.getElementById('goal-fat').value) || 65,
            carbs: parseInt(document.getElementById('goal-carbs').value) || 250,
            weight: parseFloat(document.getElementById('goal-weight').value) || 70
        };
        
        try {
            // Сохраняем на сервере
            const result = await ApiModule.saveGoals(goals);
            
            if (result.success) {
                // Обновляем локальное состояние
                StateModule.updateGoals(goals);
                
                // Обновляем UI
                updateDashboard();
                
                UIModule.showToast('Цели сохранены!');
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения целей:', error);
            // Сохраняем локально
            StateModule.updateGoals(goals);
            updateDashboard();
            UIModule.showToast('Цели сохранены (локально)', 'warning');
        }
    };
    
    /**
     * Получает совет от ИИ
     */
    const getAiTip = async () => {
        const tipBox = document.getElementById('ai-tip');
        const getTipButton = document.querySelector('.outline-btn');
        
        if (!tipBox || !getTipButton) return;
        
        // Показываем индикатор загрузки
        const originalText = getTipButton.textContent;
        getTipButton.textContent = 'Получаю совет...';
        getTipButton.disabled = true;
        
        try {
            // Получаем текущие потребления
            const totals = StateModule.calculateDailyTotals();
            
            // Запрашиваем совет
            const result = await ApiModule.getAiTip(totals);
            
            if (result.success) {
                tipBox.innerHTML = `<strong>💡 ИИ-совет</strong><br>${result.tip}`;
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Ошибка получения совета:', error);
            tipBox.innerHTML = `<strong>💡 ИИ-совет</strong><br>Не удалось получить совет. Проверьте подключение к серверу.`;
        } finally {
            // Восстанавливаем кнопку
            getTipButton.textContent = originalText;
            getTipButton.disabled = false;
        }
    };
    
    /**
     * Показывает вкладку дневника с выбранным типом приема пищи
     * @param {string} mealType - Тип приема пищи
     */
    const showDiaryTab = (mealType) => {
        const diaryButton = document.querySelector('[data-tab="diary"]');
        if (diaryButton) {
            UIModule.showTab('diary', diaryButton);
            
            // Устанавливаем выбранный тип приема пищи
            const mealSelect = document.getElementById('meal-select');
            if (mealSelect) {
                mealSelect.value = mealType;
            }
            
            // Фокусируемся на поле ввода
            setTimeout(() => {
                const foodInput = document.getElementById('ai-food-input');
                if (foodInput) {
                    foodInput.focus();
                }
            }, 100);
        }
    };
    
    /**
     * Показывает вкладку веса
     */
    const showWeightTab = () => {
        const weightButton = document.querySelector('[data-tab="weight"]');
        if (weightButton) {
            UIModule.showTab('weight', weightButton);
            
            // Фокусируемся на поле ввода веса
            setTimeout(() => {
                const weightInput = document.getElementById('weight-input');
                if (weightInput) {
                    weightInput.focus();
                }
            }, 100);
        }
    };
    
    /**
     * Очищает все данные
     */
    const clearAllData = () => {
        if (!confirm('Удалить все данные? Это нельзя отменить.')) return;
        
        try {
            // Очищаем локальное состояние
            StateModule.reset();
            
            // Обновляем UI
            updateDashboard();
            updateDiaryTab();
            updateWeightTab();
            
            UIModule.showToast('Данные очищены');
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            UIModule.showToast('Ошибка очистки данных', 'error');
        }
    };
    
    /**
     * Очищает все данные и переходит на начальный экран онбординга
     */
    const clearAndRestart = () => {
        if (!confirm('Сбросить все данные и начать заново? Все текущие записи будут удалены.')) return;
        
        try {
            // 1. Очищаем локальное состояние
            StateModule.reset();
            
            // 2. Удаляем флаг завершения онбординга
            localStorage.removeItem('hasCompletedOnboarding');
            
            // 3. Показываем онбординг
            if (window.OnboardingModule && OnboardingModule.showOnboarding) {
                OnboardingModule.showOnboarding();
            }
            
            // 4. Сбрасываем текущий шаг онбординга
            if (window.OnboardingModule && OnboardingModule.currentStep !== undefined) {
                // Скрываем текущий шаг
                const currentStepElement = document.querySelector('.ob-step.active');
                if (currentStepElement) {
                    currentStepElement.classList.remove('active');
                }
                
                // Показываем первый шаг
                const firstStepElement = document.querySelector('.ob-step[data-step="0"]');
                if (firstStepElement) {
                    firstStepElement.classList.add('active');
                }
                
                // Сбрасываем шаг
                window.OnboardingModule.currentStep = 0;
                
                // Обновляем прогресс-бар
                const progressFill = document.getElementById('ob-progress-fill');
                if (progressFill) {
                    progressFill.style.width = '0%';
                }
            }
            
            // 5. Скрываем основное приложение
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.style.display = 'none';
            }
            
            // 6. Показываем уведомление
            UIModule.showToast('Данные сброшены. Начинаем заново!');
            
        } catch (error) {
            console.error('Ошибка сброса данных:', error);
            UIModule.showToast('Ошибка сброса данных', 'error');
        }
    };
    
    /**
     * Перезапускает онбординг
     */
    const restartOnboarding = () => {
        if (!confirm('Начать заново? Текущие данные будут сохранены, но вы пройдете онбординг снова.')) return;
        
        try {
            // Удаляем флаг завершения онбординга
            localStorage.removeItem('hasCompletedOnboarding');
            
            // Показываем онбординг
            if (window.OnboardingModule && OnboardingModule.showOnboarding) {
                OnboardingModule.showOnboarding();
            }
            
            // Сбрасываем текущий шаг онбординга
            if (window.OnboardingModule && OnboardingModule.currentStep !== undefined) {
                // Скрываем текущий шаг
                const currentStepElement = document.querySelector('.ob-step.active');
                if (currentStepElement) {
                    currentStepElement.classList.remove('active');
                }
                
                // Показываем первый шаг
                const firstStepElement = document.querySelector('.ob-step[data-step="0"]');
                if (firstStepElement) {
                    firstStepElement.classList.add('active');
                }
                
                // Сбрасываем шаг
                window.OnboardingModule.currentStep = 0;
                
                // Обновляем прогресс-бар
                const progressFill = document.getElementById('ob-progress-fill');
                if (progressFill) {
                    progressFill.style.width = '0%';
                }
            }
            
            UIModule.showToast('Начинаем заново!');
        } catch (error) {
            console.error('Ошибка перезапуска онбординга:', error);
            UIModule.showToast('Ошибка перезапуска', 'error');
        }
    };
    
    return {
        init,
        analyzeFood,
        removeMeal,
        addWeight,
        saveGoals,
        getAiTip,
        showDiaryTab,
        showWeightTab,
        clearAllData,
        clearAndRestart,
        restartOnboarding,
        updateDashboard,
        updateDiaryTab,
        updateWeightTab,
        updateGoalsTab
    };
})();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    AppModule.init();
});

// Экспорт для глобального использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppModule;
} else {
    window.AppModule = AppModule;
}