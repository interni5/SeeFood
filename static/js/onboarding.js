/**
 * Модуль онбординга
 * Управляет процессом знакомства с приложением
 */

const OnboardingModule = (() => {
    // Текущий шаг
    let currentStep = 0;
    const totalSteps = 11; // 0-10
    
    // Данные онбординга
    let onboardingData = {
        goal: null,
        important: [],
        gender: null,
        birthDate: { day: '', month: '', year: '' },
        height: null,
        weight: null,
        targetWeight: null,
        priorities: [],
        challenges: [],
        activity: null
    };
    
    /**
     * Инициализирует онбординг
     */
    const init = () => {
        console.log('Инициализация онбординга...');
        
        // Проверяем, нужно ли показывать онбординг
        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
        
        if (hasCompletedOnboarding === 'true') {
            // Пользователь уже прошел онбординг
            showApp();
        } else {
            // Показываем онбординг
            showOnboarding();
            updateProgressBar();
        }
    };
    
    /**
     * Показывает онбординг
     */
    const showOnboarding = () => {
        const onboarding = document.getElementById('onboarding');
        const app = document.getElementById('app');
        
        if (onboarding) onboarding.style.display = 'flex';
        if (app) app.style.display = 'none';
    };
    
    /**
     * Показывает основное приложение
     */
    const showApp = () => {
        const onboarding = document.getElementById('onboarding');
        const app = document.getElementById('app');
        
        if (onboarding) onboarding.style.display = 'none';
        if (app) app.style.display = 'block';
    };
    
    /**
     * Обновляет прогресс-бар
     */
    const updateProgressBar = () => {
        const progressFill = document.getElementById('ob-progress-fill');
        if (progressFill) {
            const progress = ((currentStep + 1) / totalSteps) * 100;
            progressFill.style.width = `${progress}%`;
        }
    };
    
    /**
     * Переходит к следующему шагу
     */
    const nextStep = () => {
        // Проверяем валидность текущего шага
        if (!validateCurrentStep()) {
            return;
        }
        
        // Скрываем текущий шаг
        const currentStepElement = document.querySelector(`.ob-step[data-step="${currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
        
        // Увеличиваем шаг
        currentStep++;
        
        // Если это последний шаг, завершаем онбординг
        if (currentStep >= totalSteps) {
            finishOnboarding();
            return;
        }
        
        // Показываем следующий шаг
        const nextStepElement = document.querySelector(`.ob-step[data-step="${currentStep}"]`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            nextStepElement.classList.remove('back');
        }
        
        // Обновляем прогресс-бар
        updateProgressBar();
        
        // Фокусируемся на первом поле ввода, если есть
        setTimeout(() => {
            const firstInput = nextStepElement.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    };
    
    /**
     * Возвращается к предыдущему шагу
     */
    const prevStep = () => {
        // Скрываем текущий шаг
        const currentStepElement = document.querySelector(`.ob-step[data-step="${currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
        
        // Уменьшаем шаг
        currentStep--;
        
        // Показываем предыдущий шаг
        const prevStepElement = document.querySelector(`.ob-step[data-step="${currentStep}"]`);
        if (prevStepElement) {
            prevStepElement.classList.add('active');
            prevStepElement.classList.add('back');
        }
        
        // Обновляем прогресс-бар
        updateProgressBar();
    };
    
    /**
     * Проверяет валидность текущего шага
     * @returns {boolean} true если шаг валиден
     */
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1: // Цель
                return onboardingData.goal !== null;
                
            case 3: // Пол
                return onboardingData.gender !== null;
                
            case 4: // Дата рождения
                const day = document.getElementById('ob-day');
                const month = document.getElementById('ob-month');
                const year = document.getElementById('ob-year');
                
                if (!day || !month || !year) return false;
                
                const dayVal = parseInt(day.value);
                const monthVal = parseInt(month.value);
                const yearVal = parseInt(year.value);
                
                // Базовая валидация
                if (!dayVal || dayVal < 1 || dayVal > 31) {
                    showValidationError('Введите корректный день (1-31)');
                    return false;
                }
                
                if (!monthVal || monthVal < 1 || monthVal > 12) {
                    showValidationError('Введите корректный месяц (1-12)');
                    return false;
                }
                
                if (!yearVal || yearVal < 1920 || yearVal > 2015) {
                    showValidationError('Введите корректный год (1920-2015)');
                    return false;
                }
                
                // Сохраняем данные
                onboardingData.birthDate = {
                    day: dayVal,
                    month: monthVal,
                    year: yearVal
                };
                
                return true;
                
            case 5: // Рост
                const heightInput = document.getElementById('ob-height');
                if (!heightInput) return false;
                
                const height = parseInt(heightInput.value);
                if (!height || height < 100 || height > 250) {
                    showValidationError('Введите корректный рост (100-250 см)');
                    return false;
                }
                
                onboardingData.height = height;
                return true;
                
            case 6: // Вес
                const weightInput = document.getElementById('ob-weight');
                if (!weightInput) return false;
                
                const weight = parseFloat(weightInput.value);
                if (!weight || weight < 30 || weight > 300) {
                    showValidationError('Введите корректный вес (30-300 кг)');
                    return false;
                }
                
                onboardingData.weight = weight;
                return true;
                
            case 7: // Целевой вес
                const targetWeightInput = document.getElementById('ob-target-weight');
                if (!targetWeightInput) return false;
                
                const targetWeight = parseFloat(targetWeightInput.value);
                if (!targetWeight || targetWeight < 30 || targetWeight > 300) {
                    showValidationError('Введите корректный целевой вес (30-300 кг)');
                    return false;
                }
                
                onboardingData.targetWeight = targetWeight;
                return true;
                
            case 10: // Активность
                return onboardingData.activity !== null;
                
            default:
                return true;
        }
    };
    
    /**
     * Показывает ошибку валидации
     * @param {string} message - Сообщение об ошибке
     */
    const showValidationError = (message) => {
        // Создаем элемент для ошибки
        let errorElement = document.querySelector('.ob-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'ob-error';
            errorElement.style.cssText = `
                color: var(--red);
                font-size: 12px;
                margin-top: 8px;
                text-align: center;
            `;
            
            const currentStepElement = document.querySelector(`.ob-step[data-step="${currentStep}"]`);
            if (currentStepElement) {
                const actions = currentStepElement.querySelector('.ob-actions');
                if (actions) {
                    actions.parentNode.insertBefore(errorElement, actions);
                }
            }
        }
        
        errorElement.textContent = message;
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 3000);
    };
    
    /**
     * Выбирает чип (одиночный выбор)
     * @param {HTMLElement} element - Элемент чипа
     */
    const selectChip = (element) => {
        const key = element.getAttribute('data-key');
        const value = element.getAttribute('data-val');
        
        if (!key || !value) return;
        
        // Снимаем выделение с других чипов в той же группе
        const parent = element.parentElement;
        if (parent) {
            const siblings = parent.querySelectorAll('.ob-chip');
            siblings.forEach(chip => {
                chip.classList.remove('selected');
            });
        }
        
        // Выделяем выбранный чип
        element.classList.add('selected');
        
        // Сохраняем данные
        onboardingData[key] = value;
    };
    
    /**
     * Переключает чип (множественный выбор)
     * @param {HTMLElement} element - Элемент чипа
     */
    const toggleChip = (element) => {
        const key = element.getAttribute('data-key');
        const value = element.getAttribute('data-val');
        
        if (!key || !value) return;
        
        // Переключаем выделение
        element.classList.toggle('selected');
        
        // Обновляем данные
        if (!onboardingData[key]) {
            onboardingData[key] = [];
        }
        
        const index = onboardingData[key].indexOf(value);
        if (index === -1) {
            // Добавляем
            onboardingData[key].push(value);
        } else {
            // Удаляем
            onboardingData[key].splice(index, 1);
        }
    };
    
    /**
     * Завершает онбординг
     */
    const finishOnboarding = () => {
        console.log('Завершение онбординга с данными:', onboardingData);
        
        // Сохраняем данные профиля
        saveProfileData();
        
        // Сохраняем флаг завершения онбординга
        localStorage.setItem('hasCompletedOnboarding', 'true');
        
        // Показываем основное приложение
        showApp();
        
        // Инициализируем основное приложение
        if (window.AppModule && AppModule.init) {
            AppModule.init();
        }
        
        // Показываем приветственное сообщение
        setTimeout(() => {
            if (window.UIModule && UIModule.showToast) {
                UIModule.showToast('Добро пожаловать в CalAI Tracker!');
            }
        }, 500);
    };
    
    /**
     * Сохраняет данные профиля
     */
    const saveProfileData = () => {
        // Рассчитываем возраст
        let age = null;
        if (onboardingData.birthDate.year) {
            const currentYear = new Date().getFullYear();
            age = currentYear - onboardingData.birthDate.year;
        }
        
        // Создаем объект профиля
        const profile = {
            goal: onboardingData.goal || 'eat_better',
            gender: onboardingData.gender || 'male',
            height: onboardingData.height || 175,
            age: age || 30,
            activity: onboardingData.activity || 'moderate',
            currentWeight: onboardingData.weight || 70,
            targetWeight: onboardingData.targetWeight || 65,
            important: onboardingData.important || [],
            priorities: onboardingData.priorities || [],
            challenges: onboardingData.challenges || []
        };
        
        // Сохраняем в localStorage
        try {
            const state = JSON.parse(localStorage.getItem('calai_state') || '{}');
            state.userProfile = profile;
            localStorage.setItem('calai_state', JSON.stringify(state));
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
        }
        
        // Отправляем на сервер (если доступен)
        if (window.ApiModule && ApiModule.saveProfile) {
            ApiModule.saveProfile(profile).catch(error => {
                console.warn('Не удалось сохранить профиль на сервере:', error);
            });
        }
        
        // Устанавливаем начальные цели на основе профиля
        setInitialGoals(profile);
    };
    
    /**
     * Устанавливает начальные цели на основе профиля
     * @param {Object} profile - Профиль пользователя
     */
    const setInitialGoals = (profile) => {
        // Базовая формула для расчета калорий (упрощенная)
        let baseCalories = 2000;
        
        if (profile.gender === 'male') {
            baseCalories = 2500;
        } else if (profile.gender === 'female') {
            baseCalories = 2000;
        }
        
        // Корректировка на основе активности
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        };
        
        const multiplier = activityMultipliers[profile.activity] || 1.55;
        baseCalories = Math.round(baseCalories * multiplier);
        
        // Корректировка на основе цели
        if (profile.goal === 'lose') {
            baseCalories = Math.round(baseCalories * 0.85); // -15%
        } else if (profile.goal === 'muscle') {
            baseCalories = Math.round(baseCalories * 1.15); // +15%
        }
        
        // Расчет макронутриентов (упрощенный)
        const protein = Math.round(baseCalories * 0.3 / 4); // 30% калорий из белка
        const fat = Math.round(baseCalories * 0.25 / 9);    // 25% калорий из жиров
        const carbs = Math.round(baseCalories * 0.45 / 4);  // 45% калорий из углеводов
        
        // Создаем объект целей
        const goals = {
            kcal: baseCalories,
            protein: protein,
            fat: fat,
            carbs: carbs,
            weight: profile.targetWeight || 70
        };
        
        // Сохраняем в localStorage
        try {
            const state = JSON.parse(localStorage.getItem('calai_state') || '{}');
            state.goals = goals;
            localStorage.setItem('calai_state', JSON.stringify(state));
        } catch (error) {
            console.error('Ошибка сохранения целей:', error);
        }
        
        // Отправляем на сервер (если доступен)
        if (window.ApiModule && ApiModule.saveGoals) {
            ApiModule.saveGoals(goals).catch(error => {
                console.warn('Не удалось сохранить цели на сервере:', error);
            });
        }
    };
    
    return {
        init,
        nextStep,
        prevStep,
        selectChip,
        toggleChip,
        finishOnboarding
    };
})();

// ============================================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
// ============================================================================

/**
 * Переходит к следующему шагу онбординга
 */
function obNext() {
    if (OnboardingModule && OnboardingModule.nextStep) {
        OnboardingModule.nextStep();
    }
}

/**
 * Возвращается к предыдущему шагу онбординга
 */
function obBack() {
    if (OnboardingModule && OnboardingModule.prevStep) {
        OnboardingModule.prevStep();
    }
}

/**
 * Выбирает чип (одиночный выбор)
 * @param {HTMLElement} element - Элемент чипа
 */
function selectChip(element) {
    if (OnboardingModule && OnboardingModule.selectChip) {
        OnboardingModule.selectChip(element);
    }
}

/**
 * Переключает чип (множественный выбор)
 * @param {HTMLElement} element - Элемент чипа
 */
function toggleChip(element) {
    if (OnboardingModule && OnboardingModule.toggleChip) {
        OnboardingModule.toggleChip(element);
    }
}

/**
 * Завершает онбординг
 */
function finishOnboarding() {
    if (OnboardingModule && OnboardingModule.finishOnboarding) {
        OnboardingModule.finishOnboarding();
    }
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

// Инициализируем онбординг при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (OnboardingModule && OnboardingModule.init) {
        OnboardingModule.init();
    }
});

// Экспорт для глобального использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingModule;
} else {
    window.OnboardingModule = OnboardingModule;
}