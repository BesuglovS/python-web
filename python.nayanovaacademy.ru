# ==========================================
# 1. Редирект HTTP -> HTTPS
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
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://mc.yandex.ru; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru; connect-src 'self' https://mc.yandex.ru wss://mc.yandex.ru; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" always;

    # --- Сжатие gzip ---
    gzip on;
    gzip_types text/css application/javascript text/javascript application/json text/xml image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_vary on;

    # --- Основные параметры сайта ---
    root /var/www/python.nayanovaacademy.ru/public;
    index index.html index.htm index.php;
    autoindex off;

    # Логирование
    access_log /var/log/nginx/python.nayanovaacademy.ru.access.log;
    error_log  /var/log/nginx/python.nayanovaacademy.ru.error.log;

    # 1. Блокировка служебных файлов сборки
    location ~* ^/(router\.php|playwright\.config\.js|package\.json|package-lock\.json|\.eleventy\.js|minify\.js|build-highlight\.mjs|build-css\.mjs|build-js\.mjs|build-sw\.mjs|build-config-meta\.mjs|build-assets-hash\.mjs|build-og-image\.py|ga\.js|vitest\.config\.mjs|tsconfig\.json|eslint\.config\.mjs|\.env|\.env\.example|ssh-private\.key|deploy\.ps1|lighthouserc\.json|nginx-sandbox\.conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 2. Основная маршрутизация
    location / {
        try_files $uri $uri/ =404;
    }

    # 3. Песочница PHP с rate limiting
    location /sandbox/ {
        limit_req zone=sandbox burst=10 nodelay;
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 3a. Защита служебных каталогов песочницы (сессии REPL, rate-limit).
    # На Apache их закрывает .htaccess; здесь дублируем для nginx.
    location ~ ^/sandbox/\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 3b. Блокировка служебных файлов песочницы (ответы теста, AST-валидатор, скрипты).
    location ~ ^/sandbox/(validate-test\.php|_test_.*\.php|ast_validator\.py|permissions\.sh|sandbox_common\.php|nginx-sandbox\.conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 4. Обработка PHP-файлов через FastCGI
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 5. Кэширование статических ресурсов (CSS/JS/изображения/шрифты — 1 год)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 6. Кэширование JSON и манифестов — 1 час
    location ~* \.(json|webmanifest)$ {
        expires 1h;
        add_header Cache-Control "public";
        access_log off;
    }

    # 7. Кэширование HTML — 1 час
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # 8. Блокировка скрытых файлов
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
