# ==========================================
# python.nayanovaacademy.ru — конфиг nginx
#
# ВАЖНО про наследование add_header:
# nginx наследует директивы add_header с уровня сервера ТОЛЬКО если
# в location нет ни одной собственной директивы add_header. Поэтому
# набор security-заголовков продублирован в каждом location, который
# задаёт свой Cache-Control.
# ==========================================

# --- Rate limiting для песочницы (должна быть на уровне http) ---
limit_req_zone $binary_remote_addr zone=sandbox:10m rate=5r/s;

server {
    listen 80;
    server_name python.nayanovaacademy.ru;

    return 301 https://$host$request_uri;
}

# ==========================================
# 2. Основной HTTPS-сервер
# ==========================================
server {
    listen 443 ssl http2;
    server_name python.nayanovaacademy.ru;

    # --- SSL-сертификаты ---
    ssl_certificate     /etc/ssl/certs/nayanovaacademy.ru/cert.pem;
    ssl_certificate_key /etc/ssl/private/nayanovaacademy.ru/key.pem;

    # --- Настройки безопасности SSL ---
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security Headers — канонический набор (дублируется в location ниже).
    # CSP идентична meta-CSP в layout.njk/layout-index.njk и .htaccess Apache.
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://auth.nayanovaacademy.ru https://contest.nayanovaacademy.ru; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://auth.nayanovaacademy.ru; frame-ancestors 'none'" always;

    # --- Сжатие gzip ---
    gzip on;
    gzip_types text/css application/javascript text/javascript application/json text/xml image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_vary on;

    # --- Основные параметры сайта ---
    root /var/www/python.nayanovaacademy.ru/public;
    index index.html;
    autoindex off;

    # Логирование
    access_log /var/log/nginx/python.nayanovaacademy.ru.access.log;
    error_log  /var/log/nginx/python.nayanovaacademy.ru.error.log;

    # 0. База данных прогресса и служебные данные data/ никогда не отдаются.
    location ^~ /data/ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 0a. ACME challenge — исключение из общего запрета скрытых путей,
    # иначе не работает продление сертификата через webroot.
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        try_files $uri =404;
    }

    # 1. Блокировка служебных файлов сборки
    location ~* ^/(router\.php|playwright\.config\.js|package\.json|package-lock\.json|\.eleventy\.js|minify\.js|build-highlight\.mjs|build-css\.mjs|build-js\.mjs|build-sw\.mjs|build-config-meta\.mjs|build-assets-hash\.mjs|build-sitemap\.mjs|ga\.js|vitest\.config\.mjs|tsconfig\.json|eslint\.config\.mjs|\.env|\.env\.example|ssh-private\.key|deploy\.ps1|lighthouserc\.json|nginx-sandbox\.conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 2. Основная маршрутизация
    location / {
        try_files $uri $uri/ =404;
    }

    # 3. Песочница: единый ^~ location — иначе generic regex `\.php$`
    # перехватывал запросы раньше, и limit_req не применялся вообще.
    # Вложенный regex-locаtion наследует limit_req от префиксного родителя.
    location ^~ /sandbox/ {
        limit_req zone=sandbox burst=10 nodelay;

        # 3a. Служебные каталоги песочницы (сессии REPL, rate-limit).
        location ~ ^/sandbox/\.(.*)$ {
            deny all;
            access_log off;
            log_not_found off;
        }

        # 3b. Внутренние файлы песочницы: тестовые скрипты, исходники,
        # PHP-классы и конфиги. Веб-эндпоинты — только перечисленные ниже
        # в 3c (run, repl, progress, badges, auth_check, validate-test).
        location ~ ^/sandbox/(_test_.*|permissions\.sh|\.repl_runner\.py|ast_validator\.py|sandbox_common\.php|config\.php|Database\.php|Auth\.php|AuthClient\.php|ProgressReporter\.php|contest_map\.php)$ {
            deny all;
            access_log off;
            log_not_found off;
        }

        # 3c. PHP-эндпоинты песочницы через FastCGI
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }

        return 404;
    }

    # 4. Обработка прочих PHP-файлов через FastCGI
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 4a. Service Worker и JS-клиент трекинга без content-hash — не кэшируем,
    # иначе браузер не увидит обновления sw.js и продолжит отдавать старые страницы.
    # Свой add_header => дублируем security-набор (см. шапку файла).
    location ~* ^/(sw\.js|tracking-client\.js)$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://auth.nayanovaacademy.ru https://contest.nayanovaacademy.ru; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://auth.nayanovaacademy.ru; frame-ancestors 'none'" always;
    }

    # 4b. admin-quiz — админ-утилита: JS/CSS без долгого кэша (файлы без content-hash,
    # иначе обновления не доходят до браузера до Ctrl+F5).
    location ~* ^/admin-quiz/(admin-quiz\.(js|css))$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://auth.nayanovaacademy.ru https://contest.nayanovaacademy.ru; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://auth.nayanovaacademy.ru; frame-ancestors 'none'" always;
    }

    # 5. Кэширование статических ресурсов (CSS/JS/изображения/шрифты — 1 год)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
    }

    # 6. JSON и манифесты — не кэшируем (контент меняется при деплое)
    location ~* \.(json|webmanifest)$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
        access_log off;
    }

    # 7. HTML — не кэшируем (контент меняется при деплое)
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
    }

    # 8. Блокировка скрытых файлов (кроме /.well-known/acme-challenge/)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
