<?php
/**
 * SQLite singleton для python-web.
 * Управляет базой данных прогресса и синхронизацией пользователей.
 */
class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $dbDir = dirname(PYTHON_DB_PATH);
            if (!is_dir($dbDir)) {
                if (!mkdir($dbDir, 0755, true)) {
                    throw new RuntimeException("Не удалось создать директорию: {$dbDir}");
                }
            }
            if (!is_writable($dbDir)) {
                throw new RuntimeException("Директория недоступна для записи: {$dbDir}");
            }

            self::$instance = new PDO('sqlite:' . PYTHON_DB_PATH, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            self::$instance->exec('PRAGMA journal_mode=WAL');
            self::$instance->exec('PRAGMA foreign_keys=ON');
        }
        return self::$instance;
    }

    public static function initialize(): void
    {
        $db = self::getInstance();

        $db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                login TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                is_admin INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                lesson_number INTEGER NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
                quiz_score INTEGER DEFAULT NULL,
                completed_at DATETIME DEFAULT NULL,
                updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, lesson_number),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                badge_id TEXT NOT NULL,
                earned_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, badge_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS code_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                run_count INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        // Миграция: добавляем колонку completed_at, если её нет (таблица уже существовала)
        try {
            $db->exec("ALTER TABLE progress ADD COLUMN completed_at DATETIME DEFAULT NULL");
        } catch (PDOException $e) {
            // Колонка уже существует — игнорируем
        }

        $indexes = [
            'idx_progress_user_id'      => 'CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id)',
            'idx_progress_lesson'       => 'CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(user_id, lesson_number)',
            'idx_progress_completed_at' => 'CREATE INDEX IF NOT EXISTS idx_progress_completed_at ON progress(user_id, completed_at)',
            'idx_badges_user'           => 'CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id)',
        ];
        foreach ($indexes as $sql) {
            try { $db->exec($sql); } catch (PDOException $e) {}
        }

        // Миграция: заполняем completed_at для старых записей, где его нет
        $db->exec("UPDATE progress SET completed_at = updated_at WHERE completed = 1 AND completed_at IS NULL");
    }

    public static function syncUsers(): array
    {
        $db = self::getInstance();
        $authUrl = AUTH_URL . '/api/admin_users.php';

        $cookieHeader = '';
        if (!empty($_COOKIE['auth_session'])) {
            $cookieHeader = 'auth_session=' . $_COOKIE['auth_session'];
        }

        $ch = curl_init($authUrl);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => false,
        ];
        if ($cookieHeader !== '') {
            $opts[CURLOPT_COOKIE] = $cookieHeader;
        }
        curl_setopt_array($ch, $opts);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return ['success' => false, 'error' => 'Не удалось получить данные из auth-web (HTTP ' . $httpCode . ')'];
        }

        $data = json_decode($response, true);
        if (!is_array($data) || empty($data['users'])) {
            return ['success' => false, 'error' => 'Неверный ответ от auth-web'];
        }

        $remoteIds = [];
        $synced = 0;

        $stmt = $db->prepare(
            "INSERT INTO users (id, login, display_name, is_admin, created_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               login = excluded.login,
               display_name = excluded.display_name,
               is_admin = excluded.is_admin,
               created_at = excluded.created_at"
        );

        foreach ($data['users'] as $user) {
            $id = (int) $user['id'];
            $remoteIds[] = $id;
            $stmt->execute([
                $id,
                $user['login'],
                $user['display_name'],
                (int) ($user['is_admin'] ?? 0),
                $user['created_at'] ?? gmdate('Y-m-d H:i:s'),
            ]);
            $synced++;
        }

        $deleted = 0;
        if (!empty($remoteIds)) {
            $placeholders = implode(',', array_fill(0, count($remoteIds), '?'));
            $stmtDel = $db->prepare("DELETE FROM users WHERE id NOT IN ($placeholders)");
            $stmtDel->execute($remoteIds);
            $deleted = $stmtDel->rowCount();
        }

        return ['success' => true, 'synced' => $synced, 'deleted' => $deleted];
    }
}
