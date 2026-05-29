"""
CalAI Tracker - Улучшенный backend
Версия с лучшей структурой, обработкой ошибок и документацией
"""

import json
import os
import urllib.request
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from typing import Dict, List, Any, Optional

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

# API конфигурация
OPENROUTER_API_KEY = ""
OPENROUTER_MODEL = "inclusionai/ring-2.6-1t:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Временная база данных (в продакшене заменить на реальную БД)
db = {
    "meals": {"Завтрак": [], "Обед": [], "Ужин": [], "Перекус": []},
    "weights": [],
    "goals": {"kcal": 2000, "protein": 150, "fat": 65, "carbs": 250, "weight": 70.0},
    "user_profile": {
        "goal": "eat_better",
        "gender": "male",
        "height": 175,
        "age": 30,
        "activity": "moderate"
    }
}

# ============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================================================

def call_ai_api(system_prompt: str, user_prompt: str, max_tokens: int = 400) -> str:
    """
    Вызывает AI API (OpenRouter) для анализа питания.
    
    Args:
        system_prompt: Системный промпт для AI
        user_prompt: Пользовательский промпт
        max_tokens: Максимальное количество токенов в ответе
        
    Returns:
        Ответ от AI в виде строки
    """
    payload = json.dumps({
        "model": OPENROUTER_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "CalAI Tracker",
    }

    try:
        print(f"Отправка запроса к OpenRouter...")
        req = urllib.request.Request(
            OPENROUTER_URL, data=payload, headers=headers, method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            response_text = response.read().decode()
            print(f"Получен ответ (первые 200 символов): {response_text[:200]}")
            data = json.loads(response_text)

        if "choices" not in data or len(data["choices"]) == 0:
            print(f"Неожиданный формат ответа: {data.keys()}")
            return '{"name":"Ошибка анализа","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"API вернул неожиданный формат"}'

        content = data["choices"][0].get("message", {}).get("content", " ")
        if not content:
            print(f"Пустой ответ от API: {data}")
            return '{"name":"Ошибка анализа","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"API вернул пустой ответ"}'

        print(f"Успешно получен ответ от ИИ")
        return content

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        print(f"HTTP ошибка {e.code}: {error_body}")
        return f'{{"name":"Ошибка API","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"HTTP {e.code}"}}'

    except urllib.error.URLError as e:
        print(f"Ошибка сети: {e.reason}")
        return '{"name":"Ошибка сети","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"Проверьте интернет соединение"}'

    except json.JSONDecodeError as e:
        print(f"Ошибка парсинга JSON: {e}")
        return '{"name":"Ошибка формата","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"Неверный формат ответа от сервера"}'

    except Exception as e:
        print(f"Общая ошибка: {type(e).__name__}: {str(e)}")
        return '{"name":"Ошибка соединения","kcal":200,"protein":10,"fat":10,"carbs":20,"note":"Проверьте интернет и API ключ"}'


def parse_ai_response(raw_response: str) -> Dict[str, Any]:
    """
    Парсит ответ от AI и извлекает данные о питании.
    
    Args:
        raw_response: Сырой ответ от AI
        
    Returns:
        Словарь с данными о питании
    """
    try:
        # Очистка ответа от markdown и лишних символов
        raw_clean = raw_response.strip()
        
        # Удаление markdown блоков
        if raw_clean.startswith("```json"):
            raw_clean = raw_clean[7:]
        if raw_clean.startswith("```"):
            raw_clean = raw_clean[3:]
        if raw_clean.endswith("```"):
            raw_clean = raw_clean[:-3]
        raw_clean = raw_clean.strip()
        
        # Парсинг JSON
        data = json.loads(raw_clean)
        
        # Валидация и нормализация данных
        return {
            "name": data.get("name", "Неизвестное блюдо"),
            "kcal": max(0, int(data.get("kcal", 200))),
            "protein": max(0, int(data.get("protein", 10))),
            "fat": max(0, int(data.get("fat", 10))),
            "carbs": max(0, int(data.get("carbs", 20))),
            "note": data.get("note", "Сбалансированная порция"),
        }
        
    except json.JSONDecodeError:
        print(f"Ошибка парсинга JSON, ответ: {raw_response[:200]}")
        return {
            "name": "Не удалось распознать",
            "kcal": 200,
            "protein": 10,
            "fat": 10,
            "carbs": 20,
            "note": "Не удалось распознать, добавлено вручную",
        }
    except Exception as e:
        print(f"Ошибка при парсинге ответа AI: {e}")
        return {
            "name": "Ошибка анализа",
            "kcal": 200,
            "protein": 10,
            "fat": 10,
            "carbs": 20,
            "note": "Ошибка при обработке ответа",
        }


def calculate_daily_totals() -> Dict[str, int]:
    """
    Рассчитывает общее потребление за день.
    
    Returns:
        Словарь с суммарными значениями калорий и макронутриентов
    """
    totals = {"kcal": 0, "protein": 0, "fat": 0, "carbs": 0}
    
    for meal_type, meals in db["meals"].items():
        for meal in meals:
            totals["kcal"] += meal.get("kcal", 0)
            totals["protein"] += meal.get("protein", 0)
            totals["fat"] += meal.get("fat", 0)
            totals["carbs"] += meal.get("carbs", 0)
    
    return totals


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """
    Рассчитывает индекс массы тела (ИМТ).
    
    Args:
        weight_kg: Вес в килограммах
        height_cm: Рост в сантиметрах
        
    Returns:
        Значение ИМТ
    """
    height_m = height_cm / 100
    return round(weight_kg / (height_m * height_m), 1)


def get_bmi_category(bmi: float) -> str:
    """
    Определяет категорию ИМТ.
    
    Args:
        bmi: Значение ИМТ
        
    Returns:
        Категория ИМТ
    """
    if bmi < 18.5:
        return "Недостаточный вес"
    elif bmi < 25:
        return "Нормальный вес"
    elif bmi < 30:
        return "Избыточный вес"
    else:
        return "Ожирение"


# ============================================================================
# МАРШРУТЫ API
# ============================================================================

@app.route("/")
def index():
    """Главная страница приложения."""
    return render_template("index.html")


@app.route("/api/health")
def health_check():
    """Проверка работоспособности API."""
    return jsonify({
        "status": "healthy",
        "service": "CalAI Tracker",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/api/analyze", methods=["POST"])
def analyze_food():
    """
    Анализирует блюдо через ИИ и добавляет в дневник.
    
    Ожидает JSON с полями:
    - food: описание блюда
    - meal: тип приема пищи (Завтрак/Обед/Ужин/Перекус)
    """
    try:
        body = request.get_json() or {}
        food_text = body.get("food", "").strip()
        meal = body.get("meal", "Обед")

        # Валидация входных данных
        if not food_text:
            return jsonify({"error": "Укажите описание блюда"}), 400
        
        if meal not in ["Завтрак", "Обед", "Ужин", "Перекус"]:
            return jsonify({"error": "Неверный тип приема пищи"}), 400

        # Системный промпт для AI
        system_prompt = (
            "Ты диетолог. Возвращай ТОЛЬКО JSON без markdown, без пояснений. "
            'Формат: {"name":"Название блюда","kcal":200,"protein":15,"fat":10,"carbs":25,"note":"Короткий совет"} '
            "Все числа целые. Если вес не указан — стандартная порция 100-200г. "
            "Ничего кроме JSON не пиши."
        )

        # Вызов AI API
        raw_response = call_ai_api(system_prompt, f"Проанализируй и верни JSON для: {food_text}")
        
        # Парсинг ответа
        food_data = parse_ai_response(raw_response)
        
        # Добавление в базу данных
        if meal in db["meals"]:
            db["meals"][meal].append(food_data)

        # Подготовка ответа
        response_data = {
            "success": True,
            "item": food_data,
            "meal": meal,
            "daily_totals": calculate_daily_totals()
        }
        
        # Добавляем предупреждение, если использовалась заглушка
        if "Не удалось распознать" in food_data["name"]:
            response_data["warning"] = "Использована заглушка из-за ошибки распознавания"

        return jsonify(response_data)

    except Exception as e:
        print(f"Ошибка в analyze_food: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


@app.route("/api/diary", methods=["GET"])
def get_diary():
    """Возвращает дневник питания."""
    return jsonify({
        "meals": db["meals"],
        "daily_totals": calculate_daily_totals(),
        "goals": db["goals"]
    })


@app.route("/api/diary/<meal_type>", methods=["DELETE"])
def delete_meal_item(meal_type: str):
    """
    Удаляет запись из дневника питания.
    
    Args:
        meal_type: Тип приема пищи
    """
    try:
        body = request.get_json() or {}
        index = body.get("index")
        
        if meal_type not in db["meals"]:
            return jsonify({"error": "Неверный тип приема пищи"}), 400
        
        if index is None or not isinstance(index, int):
            return jsonify({"error": "Неверный индекс"}), 400
        
        try:
            deleted_item = db["meals"][meal_type].pop(index)
            return jsonify({
                "success": True,
                "deleted_item": deleted_item,
                "daily_totals": calculate_daily_totals()
            })
        except IndexError:
            return jsonify({"error": "Индекс вне диапазона"}), 400
            
    except Exception as e:
        print(f"Ошибка в delete_meal_item: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


@app.route("/api/weight", methods=["GET"])
def get_weights():
    """Возвращает историю весов."""
    return jsonify({
        "weights": db["weights"],
        "current_weight": db["weights"][0]["kg"] if db["weights"] else None,
        "goal_weight": db["goals"]["weight"]
    })


@app.route("/api/weight", methods=["POST"])
def add_weight():
    """Добавляет новую запись веса."""
    try:
        body = request.get_json() or {}
        kg = body.get("kg")
        
        # Валидация веса
        if not kg:
            return jsonify({"error": "Укажите вес"}), 400
        
        try:
            weight_kg = float(kg)
            if not (30 <= weight_kg <= 300):
                return jsonify({"error": "Вес должен быть от 30 до 300 кг"}), 400
        except ValueError:
            return jsonify({"error": "Неверный формат веса"}), 400

        # Создание записи
        entry = {
            "kg": weight_kg,
            "date": datetime.now().strftime("%d.%m.%Y"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Добавление в начало списка (последняя запись первая)
        db["weights"].insert(0, entry)
        
        # Расчет ИМТ, если есть данные о росте
        bmi_info = {}
        if "user_profile" in db and "height" in db["user_profile"]:
            bmi = calculate_bmi(weight_kg, db["user_profile"]["height"])
            bmi_info = {
                "bmi": bmi,
                "category": get_bmi_category(bmi)
            }

        return jsonify({
            "success": True,
            "entry": entry,
            "bmi": bmi_info,
            "total_entries": len(db["weights"])
        })

    except Exception as e:
        print(f"Ошибка в add_weight: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


@app.route("/api/goals", methods=["GET"])
def get_goals():
    """Возвращает текущие цели пользователя."""
    return jsonify(db["goals"])


@app.route("/api/goals", methods=["POST"])
def save_goals():
    """Сохраняет цели пользователя."""
    try:
        body = request.get_json() or {}
        
        # Обновление целей по калориям и макронутриентам
        for key in ("kcal", "protein", "fat", "carbs"):
            if key in body:
                try:
                    db["goals"][key] = int(body[key])
                except (ValueError, TypeError):
                    return jsonify({"error": f"Неверный формат для {key}"}), 400
        
        # Обновление цели по весу
        if "weight" in body:
            try:
                db["goals"]["weight"] = float(body["weight"])
            except (ValueError, TypeError):
                return jsonify({"error": "Неверный формат веса"}), 400

        return jsonify({
            "success": True,
            "goals": db["goals"],
            "message": "Цели успешно обновлены"
        })

    except Exception as e:
        print(f"Ошибка в save_goals: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


@app.route("/api/tip", methods=["POST"])
def get_tip():
    """Генерирует персональный совет по питанию с помощью ИИ."""
    try:
        body = request.get_json() or {}
        
        # Получение текущих потреблений
        daily_totals = calculate_daily_totals()
        goals = db["goals"]
        
        # Подготовка промпта для AI
        prompt = (
            f"Пользователь съел сегодня: калории {daily_totals.get('kcal', 0)} из {goals['kcal']}, "
            f"белки {daily_totals.get('protein', 0)}/{goals['protein']}г, "
            f"жиры {daily_totals.get('fat', 0)}/{goals['fat']}г, "
            f"углеводы {daily_totals.get('carbs', 0)}/{goals['carbs']}г. "
            f"Дай короткий практический совет (2-3 предложения) на русском."
        )
        
        # Системный промпт
        system_prompt = "Ты диетолог. Отвечай кратко, только практический совет без лишних слов."
        
        # Вызов AI API
        tip_text = call_ai_api(system_prompt, prompt, 300)
        
        # Очистка ответа
        if tip_text.startswith("{") or tip_text.startswith("```"):
            tip_text = "Следите за балансом БЖУ и пейте больше воды"
        
        return jsonify({
            "success": True,
            "tip": tip_text[:300],
            "daily_totals": daily_totals,
            "goals": goals
        })

    except Exception as e:
        print(f"Ошибка в get_tip: {e}")
        return jsonify({
            "success": False,
            "tip": "Старайтесь есть больше овощей и белковой пищи!",
            "error": str(e)
        })


@app.route("/api/profile", methods=["GET"])
def get_profile():
    """Возвращает профиль пользователя."""
    return jsonify(db.get("user_profile", {}))


@app.route("/api/profile", methods=["POST"])
def save_profile():
    """Сохраняет профиль пользователя."""
    try:
        body = request.get_json() or {}
        
        # Обновление профиля
        if "user_profile" not in db:
            db["user_profile"] = {}
        
        # Обновляем только существующие поля или добавляем новые
        for key, value in body.items():
            db["user_profile"][key] = value
        
        return jsonify({
            "success": True,
            "profile": db["user_profile"],
            "message": "Профиль успешно обновлен"
        })

    except Exception as e:
        print(f"Ошибка в save_profile: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Возвращает статистику пользователя."""
    daily_totals = calculate_daily_totals()
    goals = db["goals"]
    
    # Расчет прогресса
    progress = {}
    for key in ["kcal", "protein", "fat", "carbs"]:
        if goals[key] > 0:
            progress[key] = min(100, int((daily_totals.get(key, 0) / goals[key]) * 100))
        else:
            progress[key] = 0
    
    # Расчет ИМТ, если есть данные
    bmi_info = {}
    if db["weights"] and "user_profile" in db and "height" in db["user_profile"]:
        current_weight = db["weights"][0]["kg"]
        bmi = calculate_bmi(current_weight, db["user_profile"]["height"])
        bmi_info = {
            "bmi": bmi,
            "category": get_bmi_category(bmi)
        }
    
    return jsonify({
        "daily_totals": daily_totals,
        "goals": goals,
        "progress": progress,
        "bmi": bmi_info,
        "meal_count": sum(len(meals) for meals in db["meals"].values()),
        "weight_entries": len(db["weights"])
    })


@app.route("/api/reset", methods=["POST"])
def reset_data():
    """Сбрасывает все данные пользователя (только для разработки)."""
    try:
        # Сброс данных
        db["meals"] = {"Завтрак": [], "Обед": [], "Ужин": [], "Перекус": []}
        db["weights"] = []
        
        return jsonify({
            "success": True,
            "message": "Все данные успешно сброшены"
        })
        
    except Exception as e:
        print(f"Ошибка в reset_data: {e}")
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500


# ============================================================================
# ЗАПУСК СЕРВЕРА
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("CalAI Tracker - Улучшенная версия")
    print("="*60)
    print("\nДоступные эндпоинты:")
    print("  • GET  /              - Главная страница")
    print("  • GET  /api/health    - Проверка работоспособности")
    print("  • POST /api/analyze   - Анализ блюда через ИИ")
    print("  • GET  /api/diary     - Получить дневник питания")
    print("  • POST /api/weight    - Добавить вес")
    print("  • GET  /api/goals     - Получить цели")
    print("  • POST /api/goals     - Сохранить цели")
    print("  • POST /api/tip       - Получить совет от ИИ")
    print("  • GET  /api/stats     - Получить статистику")
    print("\nСервер запущен: http://127.0.0.1:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)