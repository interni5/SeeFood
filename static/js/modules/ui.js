/**
 * Модуль для работы с UI
 * Отвечает за отображение данных и взаимодействие с пользователем
 */

const UIModule = (() => {
    /**
     * Показывает уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип уведомления (success, error, warning)
     * @param {number} duration - Длительность в миллисекундах
     */
    const showToast = (message, type = 'success', duration = 2800) => {
        // Удаляем старые уведомления
        const oldToasts = document.querySelectorAll('.toast');
        oldToasts.forEach(toast => toast.remove());
        
        // Создаем новое уведомление
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Стили в зависимости от типа
        const styles = {
            success: {
                background: 'var(--bg2)',
                border: '1px solid var(--green)',
                color: 'var(--green)'
            },
            error: {
                background: 'var(--bg2)',
                border: '1px solid var(--red)',
                color: 'var(--red)'
            },
            warning: {
                background: 'var(--bg2)',
                border: '1px solid var(--amber)',
                color: 'var(--amber)'
            }
        };
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: 'calc(var(--nav-h) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            zIndex: '200',
            whiteSpace: 'nowrap',
            animation: 'toastIn .3s ease, toastOut .3s ease 2.4s forwards',
            boxShadow: '0 4px 24px rgba(0,0,0,.4)',
            ...styles[type]
        });
        
        document.body.appendChild(toast);
        
        // Удаляем через указанное время
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    };
    
    /**
     * Показывает индикатор загрузки на кнопке
     * @param {HTMLElement} button - Кнопка
     * @param {string} loadingText - Текст во время загрузки
     */
    const showButtonLoading = (button, loadingText = 'Загрузка...') => {
        const originalHTML = button.innerHTML;
        const originalText = button.textContent;
        
        button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
        button.disabled = true;
        
        return () => {
            button.innerHTML = originalHTML;
            button.textContent = originalText;
            button.disabled = false;
        };
    };
    
    /**
     * Переключает вкладки
     * @param {string} tabName - Имя вкладки
     * @param {HTMLElement} button - Кнопка вкладки
     */
    const showTab = (tabName, button) => {
        // Скрываем все вкладки
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Показываем выбранную вкладку
        const tabElement = document.getElementById(`tab-${tabName}`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Активируем кнопку
        if (button) {
            button.classList.add('active');
        }
        
        // Сохраняем выбранную вкладку
        localStorage.setItem('lastActiveTab', tabName);
    };
    
    /**
     * Восстанавливает последнюю активную вкладку
     */
    const restoreLastTab = () => {
        const lastTab = localStorage.getItem('lastActiveTab') || 'dashboard';
        const button = document.querySelector(`[data-tab="${lastTab}"]`);
        
        if (button) {
            showTab(lastTab, button);
        }
    };
    
    /**
     * Обновляет кольцо калорий
     * @param {number} current - Текущее количество калорий
     * @param {number} goal - Целевое количество калорий
     */
    const updateCaloriesRing = (current, goal) => {
        const ringFill = document.getElementById('ring-fill');
        const ringKcal = document.getElementById('ring-kcal');
        const ringGoal = document.getElementById('ring-goal');
        const ringLeft = document.getElementById('ring-left');
        
        if (!ringFill || !ringKcal || !ringGoal || !ringLeft) return;
        
        // Расчет прогресса
        const circumference = 553; // 2 * π * r (r = 88)
        const percentage = Math.min(current / goal, 1);
        const offset = circumference - percentage * circumference;
        
        // Обновление кольца
        ringFill.style.strokeDashoffset = offset;
        ringKcal.textContent = Math.round(current);
        ringGoal.textContent = goal;
        
        // Обновление текста
        if (current <= goal) {
            ringLeft.textContent = `осталось ${Math.round(goal - current)}`;
        } else {
            ringLeft.textContent = `+${Math.round(current - goal)} сверх нормы`;
        }
    };
    
    /**
     * Обновляет статистику макронутриентов
     * @param {Object} totals - Текущие потребления
     * @param {Object} goals - Цели
     */
    const updateMacroStats = (totals, goals) => {
        // Белки
        const proteinElement = document.getElementById('dash-protein');
        const proteinBar = document.getElementById('pb');
        const proteinLabel = document.getElementById('pb-lbl');
        
        if (proteinElement) proteinElement.textContent = `${Math.round(totals.protein)}г`;
        if (proteinBar && proteinLabel) {
            const proteinPercent = Math.min((totals.protein / goals.protein) * 100, 100);
            proteinBar.style.width = `${proteinPercent}%`;
            proteinLabel.textContent = `${Math.round(totals.protein)} / ${goals.protein}г`;
        }
        
        // Жиры
        const fatElement = document.getElementById('dash-fat');
        const fatBar = document.getElementById('fb');
        const fatLabel = document.getElementById('fb-lbl');
        
        if (fatElement) fatElement.textContent = `${Math.round(totals.fat)}г`;
        if (fatBar && fatLabel) {
            const fatPercent = Math.min((totals.fat / goals.fat) * 100, 100);
            fatBar.style.width = `${fatPercent}%`;
            fatLabel.textContent = `${Math.round(totals.fat)} / ${goals.fat}г`;
        }
        
        // Углеводы
        const carbsElement = document.getElementById('dash-carbs');
        const carbsBar = document.getElementById('cb');
        const carbsLabel = document.getElementById('cb-lbl');
        
        if (carbsElement) carbsElement.textContent = `${Math.round(totals.carbs)}г`;
        if (carbsBar && carbsLabel) {
            const carbsPercent = Math.min((totals.carbs / goals.carbs) * 100, 100);
            carbsBar.style.width = `${carbsPercent}%`;
            carbsLabel.textContent = `${Math.round(totals.carbs)} / ${goals.carbs}г`;
        }
    };
    
    /**
     * Обновляет график недели
     * @param {Array} weekData - Данные за неделю
     * @param {number} goal - Целевое количество калорий
     */
    const updateWeekChart = (weekData, goal) => {
        const container = document.getElementById('week-chart');
        if (!container) return;
        
        // Находим максимальное значение для масштабирования
        const maxKcal = Math.max(...weekData.map(d => d.kcal), goal, 1);
        
        // Генерируем HTML для графика
        const todayKey = StateModule.todayKey();
        const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        container.innerHTML = weekData.map((day, index) => {
            const height = Math.round((day.kcal / maxKcal) * 52);
            const isToday = day.date === todayKey;
            const dayLabel = weekLabels[index] || day.dayOfWeek;
            
            return `
                <div class="bar ${isToday ? 'today' : ''}" style="height:${Math.max(height, 4)}px">
                    <span class="bar-label">${dayLabel}</span>
                </div>
            `;
        }).join('');
    };
    
    /**
     * Обновляет дневник питания
     * @param {Object} meals - Приемы пищи
     */
    const updateDiary = (meals) => {
        const container = document.getElementById('meals-container');
        if (!container) return;
        
        const mealGroups = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];
        const today = StateModule.todayKey();
        const dayMeals = meals[today] || {};
        
        container.innerHTML = mealGroups.map(group => {
            const items = dayMeals[group] || [];
            const totalKcal = items.reduce((sum, item) => sum + (item.kcal || 0), 0);
            
            // Генерация HTML для элементов приема пищи
            const itemsHTML = items.length > 0
                ? items.map((item, index) => `
                    <div class="meal-item">
                        <div class="meal-item-info">
                            <div class="meal-item-name">${item.name}</div>
                            <div class="meal-item-macros">
                                Б: ${item.protein}г · Ж: ${item.fat}г · У: ${item.carbs}г
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px">
                            <div class="meal-item-kcal">${item.kcal} ккал</div>
                            <button onclick="AppModule.removeMeal('${group}', ${index})" 
                                style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:2px">
                                ✕
                            </button>
                        </div>
                    </div>
                `).join('')
                : '<div class="meal-empty">Нет записей</div>';
            
            return `
                <div class="meal-group">
                    <div class="meal-header">
                        <span>${getMealIcon(group)} ${group}</span>
                        <span class="kcal-sum">${totalKcal > 0 ? totalKcal + ' ККАЛ' : '0 ККАЛ'}</span>
                    </div>
                    ${itemsHTML}
                </div>
            `;
        }).join('');
    };
    
    /**
     * Возвращает иконку для типа приема пищи
     * @param {string} mealType - Тип приема пищи
     * @returns {string} Иконка
     */
    const getMealIcon = (mealType) => {
        const icons = {
            'Завтрак': '🌅',
            'Обед': '☀️',
            'Ужин': '🌙',
            'Перекус': '🍎'
        };
        return icons[mealType] || '';
    };
    
    /**
     * Обновляет график веса
     * @param {Array} weights - История весов
     */
    const updateWeightChart = (weights) => {
        const container = document.getElementById('weight-chart');
        if (!container) return;
        
        if (!weights || weights.length === 0) {
            container.innerHTML = '<span style="color:var(--muted);font-size:12px;margin:auto">Нет данных</span>';
            return;
        }
        
        // Берем последние 10 записей
        const recentWeights = [...weights].slice(0, 10).reverse();
        const weightValues = recentWeights.map(w => w.value);
        const maxWeight = Math.max(...weightValues);
        const minWeight = Math.min(...weightValues);
        const range = maxWeight - minWeight || 1;
        
        container.innerHTML = recentWeights.map((weight, index) => {
            const height = Math.round(((weight.value - minWeight) / range) * 60 + 20);
            return `
                <div class="wbar" style="height:${height}px">
                    <span class="wbar-val">${weight.value}</span>
                </div>
            `;
        }).join('');
    };
    
    /**
     * Обновляет список весов
     * @param {Array} weights - История весов
     */
    const updateWeightList = (weights) => {
        const container = document.getElementById('weight-list');
        if (!container) return;
        
        if (!weights || weights.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = weights.slice(0, 20).map(weight => `
            <div class="weight-entry">
                <span class="weight-date">${StateModule.formatDate(weight.date)}</span>
                <span class="weight-val">${weight.value} кг</span>
            </div>
        `).join('');
    };
    
    /**
     * Обновляет форму целей
     * @param {Object} goals - Цели пользователя
     */
    const updateGoalsForm = (goals) => {
        const elements = {
            'goal-kcal': goals.kcal,
            'goal-protein': goals.protein,
            'goal-fat': goals.fat,
            'goal-carbs': goals.carbs,
            'goal-weight': goals.weight
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    };
    
    /**
     * Показывает модальное окно профиля
     */
    const showProfileModal = () => {
        const state = StateModule.getState();
        const today = StateModule.todayKey();
        
        // Подсчет приемов пищи за сегодня
        const todayMeals = state.meals[today] || {};
        const mealCount = Object.values(todayMeals).reduce((count, meals) => count + meals.length, 0);
        
        const modalHTML = `
            <div class="modal-overlay" id="profile-modal">
                <div class="modal">
                    <button class="modal-close" onclick="UIModule.closeProfileModal()">✕</button>
                    <h2>Профиль</h2>
                    <div style="color:var(--muted);font-size:13px;line-height:1.8">
                        <div>Сегодня: <strong style="color:var(--text)">${StateModule.formatDate(today)}</strong></div>
                        <div>Цель по калориям: <strong style="color:var(--green)">${state.goals.kcal} ккал</strong></div>
                        <div>Цель по весу: <strong style="color:var(--cyan)">${state.goals.weight} кг</strong></div>
                        <div>Приёмов пищи сегодня: <strong style="color:var(--text)">${mealCount}</strong></div>
                        <div>Записей веса: <strong style="color:var(--text)">${state.weights.length}</strong></div>
                    </div>
                    <button onclick="AppModule.restartOnboarding();UIModule.closeProfileModal()"
                        style="margin-top:12px;width:100%;background:rgba(68,255,0,.15);border:1px solid var(--green);
                               border-radius:var(--radius-sm);color:var(--green);font-size:13px;font-weight:600;
                               padding:12px;cursor:pointer;font-family:var(--font-body)">
                        Начать заново (онбординг)
                    </button>
                    <button onclick="AppModule.clearAndRestart();UIModule.closeProfileModal()"
                        style="margin-top:12px;width:100%;background:rgba(255,107,107,.15);border:1px solid var(--red);
                               border-radius:var(--radius-sm);color:var(--red);font-size:13px;font-weight:600;
                               padding:12px;cursor:pointer;font-family:var(--font-body)">
                        Сбросить данные и начать заново
                    </button>
                </div>
            </div>
        `;
        
        // Удаляем старые модальные окна
        const oldModal = document.getElementById('profile-modal');
        if (oldModal) oldModal.remove();
        
        // Добавляем новое
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Добавляем обработчик закрытия по клику на оверлей
        const newModal = document.getElementById('profile-modal');
        newModal.addEventListener('click', (e) => {
            if (e.target === newModal) {
                closeProfileModal();
            }
        });
    };
    
    /**
     * Закрывает модальное окно профиля
     */
    const closeProfileModal = () => {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    /**
     * Показывает модальное окно добавления
     */
    const showAddModal = () => {
        const modalHTML = `
            <div class="modal-overlay" id="add-modal" onclick="if(event.target===this)UIModule.closeAddModal()">
                <div class="modal add-modal-content">
                    <button class="modal-close" onclick="UIModule.closeAddModal()">✕</button>
                    <h2>Добавить</h2>
                    <div class="add-options">
                        <button class="add-option-btn" onclick="UIModule.closeAddModal();AppModule.showDiaryTab('Завтрак')">
                            <span class="add-opt-icon">🌅</span>
                            <span>Завтрак</span>
                        </button>
                        <button class="add-option-btn" onclick="UIModule.closeAddModal();AppModule.showDiaryTab('Обед')">
                            <span class="add-opt-icon">☀️</span>
                            <span>Обед</span>
                        </button>
                        <button class="add-option-btn" onclick="UIModule.closeAddModal();AppModule.showDiaryTab('Ужин')">
                            <span class="add-opt-icon">🌙</span>
                            <span>Ужин</span>
                        </button>
                        <button class="add-option-btn" onclick="UIModule.closeAddModal();AppModule.showWeightTab()">
                            <span class="add-opt-icon">⚖️</span>
                            <span>Обновить вес</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Удаляем старые модальные окна
        const oldModal = document.getElementById('add-modal');
        if (oldModal) oldModal.remove();
        
        // Добавляем новое
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };
    
    /**
     * Закрывает модальное окно добавления
     */
    const closeAddModal = () => {
        const modal = document.getElementById('add-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    return {
        showToast,
        showButtonLoading,
        showTab,
        restoreLastTab,
        updateCaloriesRing,
        updateMacroStats,
        updateWeekChart,
        updateDiary,
        updateWeightChart,
        updateWeightList,
        updateGoalsForm,
        showProfileModal,
        closeProfileModal,
        showAddModal,
        closeAddModal
    };
})();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIModule;
} else {
    window.UIModule = UIModule;
}