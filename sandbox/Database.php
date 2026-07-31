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
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                lesson_number INTEGER NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
                quiz_score INTEGER DEFAULT NULL,
                completed_at DATETIME DEFAULT NULL,
                updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, lesson_number)
            );

            CREATE TABLE IF NOT EXISTS badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                badge_id TEXT NOT NULL,
                earned_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, badge_id)
            );

            CREATE TABLE IF NOT EXISTS code_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                run_count INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id)
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
}
