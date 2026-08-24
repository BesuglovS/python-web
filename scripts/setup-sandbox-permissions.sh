#!/bin/bash
# Настройка прав для Python-песочницы
# Запускать от root на сервере: bash permissions.sh
# Скрипт сам определяет путь к проекту

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Проект: $PROJECT_DIR"

echo "=== Настройка прав для Python-песочницы ==="

# 1. Владелец — www-data (пользователь PHP/Apache/Nginx)
chown -R www-data:www-data "$PROJECT_DIR/sandbox"

# 2. Права на директорию sandbox: rwx для владельца, r-x для остальных
chmod 755 "$PROJECT_DIR/sandbox"

# 3. Права на run.php: rwx для владельца, r-- для остальных
chmod 755 "$PROJECT_DIR/sandbox/run.php"

# 4. PHP должен иметь доступ к python3
# Проверяем, где python3:
PYTHON_PATH=$(which python3)
echo "Python найден: $PYTHON_PATH"

# 5. PHP должен иметь доступ к команде timeout
TIMEOUT_PATH=$(which timeout)
echo "timeout найден: $TIMEOUT_PATH"

# 6. PHP должен иметь доступ на запись во временную папку
# Временные файлы создаются в sys_get_temp_dir() (обычно /tmp)
# Права на /tmp обычно уже правильные (1777)
ls -ld /tmp

# 7. (ОПЦИОНАЛЬНО) Если хочешь свою папку для временных файлов:
#    mkdir -p "$PROJECT_DIR/sandbox/tmp"
#    chown www-data:www-data "$PROJECT_DIR/sandbox/tmp"
#    chmod 755 "$PROJECT_DIR/sandbox/tmp"
#    И в run.php заменить $TEMP_DIR на этот путь

echo ""
echo "✅ Готово! Проверка:"
ls -la "$PROJECT_DIR/sandbox/"
echo ""
# Определяем URL для теста (можно передать как аргумент: bash permissions.sh http://domain)
TEST_URL="${1:-http://localhost}"
echo ""
echo "Тест песочницы (URL: $TEST_URL):"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello from Python!\")"}' \
  "$TEST_URL/sandbox/run.php"

echo ""
echo "=== Если тест прошёл — всё работает ==="
echo ""
echo "💡 Если 404 — проверь настройки nginx:"
echo "   location ~ \.php$ {"
echo "       include snippets/fastcgi-php.conf;"
echo "       fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;"
echo "   }"
echo ""
echo "   Перезапусти nginx после изменений:"
echo "   systemctl reload nginx"
