import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      // Miniфицированные файлы (build output) — не проверяем
      'highlight-py.min.js',
      'script.js',
      'config.js',
      'repl.js',
      'mindmap.js',
      'sw.js',
      'style.css',
      // Хэшированные копии ассетов (build-assets-hash.mjs)
      'script.*.js',
      'config.*.js',
      'repl.*.js',
      'mindmap.*.js',
      'highlight-py.*.js',
      'highlight-theme.min.*.css',
      '_site/**',
      'package-lock.json',
      // Build & config files
      '.eleventy.js',
      'build-highlight.mjs',
      'build-sw.mjs',
      'minify.js',
      'playwright.config.js',
      'src/_data/lessonsData.js',
      // E2E tests using CommonJS
      'e2e/**/*.js',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        CustomEvent: 'readonly',
        IntersectionObserver: 'readonly',
        XMLHttpRequest: 'readonly',
        Blob: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        dataLayer: 'readonly',
        hljs: 'readonly',
        // Cross-file globals
        safeGetItem: 'readonly',
        safeSetItem: 'readonly',
        safeRemoveItem: 'readonly',
        LESSON_META: 'readonly',
        COMPLEXITY_LABELS: 'readonly',
        THEORY_CONTESTS: 'readonly',
        CONTEST_BASE_URL: 'readonly',
        REPL_URL: 'readonly',
        TOTAL_LESSONS: 'readonly',
        BADGES: 'readonly',
        escapeHtml: 'readonly',
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          // Глобалы, определённые в config.js и потребляемые другими
          // классическими скриптами (не через import) — не помечать как unused.
          varsIgnorePattern:
            '^(safeGetItem|safeSetItem|safeRemoveItem|LESSON_META|COMPLEXITY_LABELS|THEORY_CONTESTS|CONTEST_BASE_URL|REPL_URL|BADGES)$',
        },
      ],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          varsIgnorePattern:
            '^(safeGetItem|safeSetItem|safeRemoveItem|LESSON_META|COMPLEXITY_LABELS|THEORY_CONTESTS|CONTEST_BASE_URL|REPL_URL|BADGES)$',
        },
      ],
    },
  },
  {
    files: [
      'eslint.config.mjs',
      'build-highlight.mjs',
      'build-sw.mjs',
      'minify.js',
      'tests/**/*.js',
      'tests/**/*.ts',
    ],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['e2e/**/*.js', 'e2e/**/*.ts'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        // Playwright test globals
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    files: ['src/js/**/*.ts'],
    languageOptions: {
      sourceType: 'module',
    },
  },
);
