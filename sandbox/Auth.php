<?php
/**
 * Аутентификация python-web через auth-web.
 * Проверяет сессию через auth-web API, кэширует в PHP-сессии.
 */
class Auth
{
    private static int $cacheTtl = 300;

    public static function isLoggedIn(): bool
    {
        $user = self::check();
        return $user !== null;
    }

    public static function isAdmin(): bool
    {
        $user = self::check();
        return $user !== null && !empty($user['is_admin']);
    }

    public static function getUserId(): ?int
    {
        $user = self::check();
        return $user['id'] ?? null;
    }

    public static function getUserName(): ?string
    {
        $user = self::check();
        return $user['display_name'] ?? null;
    }

    public static function getUser(): ?array
    {
        return self::check();
    }

    public static function requireLogin(): void
    {
        if (!self::isLoggedIn()) {
            jsonResponse(['authenticated' => false, 'error' => 'Требуется авторизация'], 401);
        }
    }

    public static function requireAdmin(): void
    {
        self::requireLogin();
        if (!self::isAdmin()) {
            jsonResponse(['error' => 'Доступ запрещён'], 403);
        }
    }

    private static function check(): ?array
    {
        $cached = self::getCachedUser();
        if ($cached !== null) {
            return $cached;
        }

        $response = self::apiGet('/api/check.php');
        if ($response === null || empty($response['authenticated'])) {
            self::clearCache();
            return null;
        }

        $user = $response['user'];
        self::setCachedUser($user);
        return $user;
    }

    private static function apiGet(string $path): ?array
    {
        $url = AUTH_URL . $path;

        $cookieHeader = '';
        if (!empty($_COOKIE['auth_session'])) {
            $cookieHeader = 'auth_session=' . $_COOKIE['auth_session'];
        }

        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
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
            return null;
        }

        $data = json_decode($response, true);
        return is_array($data) ? $data : null;
    }

    private static function getCachedUser(): ?array
    {
        if (empty($_SESSION['auth_user'])) {
            return null;
        }
        $cachedAt = $_SESSION['auth_user_cached_at'] ?? 0;
        if (time() - $cachedAt > self::$cacheTtl) {
            return null;
        }
        if (($_SESSION['auth_cookie_hash'] ?? '') !== self::getCookieHash()) {
            return null;
        }
        return $_SESSION['auth_user'];
    }

    private static function setCachedUser(array $user): void
    {
        $_SESSION['auth_user'] = $user;
        $_SESSION['auth_user_cached_at'] = time();
        $_SESSION['auth_cookie_hash'] = self::getCookieHash();
    }

    public static function clearCache(): void
    {
        unset($_SESSION['auth_user'], $_SESSION['auth_user_cached_at'], $_SESSION['auth_cookie_hash']);
    }

    private static function getCookieHash(): string
    {
        return hash('sha256', $_COOKIE['auth_session'] ?? '');
    }
}
