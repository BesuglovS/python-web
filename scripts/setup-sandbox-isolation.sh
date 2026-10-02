#!/bin/bash
# ==========================================================================
# setup-sandbox-isolation.sh — идемпотентная установка изоляции Python-песочницы.
# Запускать от root на сервере.
#
# Usage:
#   bash setup-sandbox-isolation.sh [PUBLIC_DIR] [HELPER_SRC]
#
#   PUBLIC_DIR  — корень сайта (по умолчанию /var/www/python.nayanovaacademy.ru/public)
#   HELPER_SRC  — путь к sandbox-python.run (по умолчанию рядом со скриптом)
#
# Делает:
#   1. создаёт системного пользователя sandbox (без shell и home);
#   2. ставит /usr/local/sbin/sandbox-python.run (root:root 0755);
#   3. ставит sudoers-правило только на этот хелпер;
#   4. выставляет права web-root: root:root 0755/0644 (www-data НЕ может
#      перезаписывать файлы сайта), а записываемыми оставляет только
#      data/ и runtime-каталоги песочницы.
# ==========================================================================
set -euo pipefail

PUBLIC_DIR="${1:-/var/www/python.nayanovaacademy.ru/public}"
HELPER_SRC="${2:-$(cd "$(dirname "$0")" && pwd)/sandbox-python.run}"
HELPER_DST="/usr/local/sbin/sandbox-python.run"
SANDBOX_USER="sandbox"
SUDOERS_FILE="/etc/sudoers.d/python-sandbox"

[ "$(id -u)" -eq 0 ] || { echo "ERROR: root required"; exit 1; }
[ -d "$PUBLIC_DIR" ] || { echo "ERROR: public dir not found: $PUBLIC_DIR"; exit 1; }
[ -f "$HELPER_SRC" ] || { echo "ERROR: helper not found: $HELPER_SRC"; exit 1; }

echo "==> bubblewrap"
if command -v bwrap >/dev/null 2>&1; then
  echo "    bwrap already installed"
else
  apt-get update -qq && apt-get install -y bubblewrap
fi

echo "==> sandbox user"
if ! id -u "$SANDBOX_USER" >/dev/null 2>&1; then
  useradd --system --no-create-home --home-dir /nonexistent \
    --shell /usr/sbin/nologin --comment "Python sandbox" "$SANDBOX_USER"
  echo "    created user $SANDBOX_USER"
else
  echo "    user $SANDBOX_USER already exists"
fi

echo "==> helper $HELPER_DST"
install -o root -g root -m 0755 "$HELPER_SRC" "$HELPER_DST"

echo "==> sudoers $SUDOERS_FILE"
echo "www-data ALL=(root) NOPASSWD: $HELPER_DST" > "$SUDOERS_FILE"
chmod 0440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE"

echo "==> web-root permissions (root:root, не writable для www-data)"
chown -R root:root "$PUBLIC_DIR"
find "$PUBLIC_DIR" -type d -exec chmod 0755 {} +
find "$PUBLIC_DIR" -type f -exec chmod 0644 {} +

echo "==> REPL sessions dir (вне web-root; доступен www-data и sandbox)"
install -d -o root -g root -m 0755 /var/lib/python-sandbox
install -d -o "$SANDBOX_USER" -g www-data -m 2770 /var/lib/python-sandbox/sessions

echo "==> writable runtime dirs (только www-data)"
mkdir -p "$PUBLIC_DIR/data"
mkdir -p "$PUBLIC_DIR/sandbox/.repl_sessions"
mkdir -p "$PUBLIC_DIR/sandbox/.ratelimit"

chown -R www-data:www-data "$PUBLIC_DIR/data"
chmod 0750 "$PUBLIC_DIR/data"
[ -f "$PUBLIC_DIR/data/python.db" ] && chmod 0640 "$PUBLIC_DIR/data/python.db"
[ -d "$PUBLIC_DIR/data/audit-backup" ] && chmod 0700 "$PUBLIC_DIR/data/audit-backup"

chown -R www-data:www-data "$PUBLIC_DIR/sandbox/.repl_sessions"
chmod 0700 "$PUBLIC_DIR/sandbox/.repl_sessions"

chown -R www-data:www-data "$PUBLIC_DIR/sandbox/.ratelimit"
chmod 0700 "$PUBLIC_DIR/sandbox/.ratelimit"

echo "==> checking isolation works as www-data"
TEST_SCRIPT="$(mktemp /tmp/sandbox-selftest-XXXXXX.py)"
printf 'import os\nprint("uid=%%d" %% os.getuid())\n' > "$TEST_SCRIPT"
chown www-data:www-data "$TEST_SCRIPT"
chmod 0644 "$TEST_SCRIPT"
# Проверяем ровно боевую цепочку: www-data -> sudo -> helper (root) -> sandbox.
if runuser -u www-data -- sudo -n "$HELPER_DST" "$TEST_SCRIPT" 128 5 python3 2>&1; then
  echo "    isolation OK"
else
  echo "    ERROR: isolation self-test failed" >&2
  rm -f "$TEST_SCRIPT"
  exit 1
fi
rm -f "$TEST_SCRIPT"

echo "==> done"
