# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] — 2026-07-11

### Security

- Fixed path traversal vulnerability in `router.php` with `realpath()` validation
- Added security headers to sandbox endpoints (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, `Cache-Control`)
- Fixed XSS vulnerability in `mindmap.js` — all data from `lessons.json` now escaped with `escapeHtml()`
- Added `file_put_contents` error checking in rate limiter
- Replaced silent `@mkdir` with proper error handling in sandbox

### Added

- Extracted Python AST validator to separate file `sandbox/ast_validator.py`
- JavaScript source files in `src/js/` with readable, maintainable code
- Unit tests with Vitest for config.js and mindmap.js
- Playwright browser caching in CI pipeline
- `CONTRIBUTING.md` with development guidelines
- `CHANGELOG.md` (this file)
- `lint-staged` configuration for pre-commit formatting

### Changed

- Build pipeline now reads JS from `src/js/` and minifies to project root
- `minify.js` updated to support source → destination file mapping
- ESLint and Prettier configs updated for new source file locations
- Refactored `run.php` into smaller, focused functions:
  - `sandbox_build_wrapper_code()` — Python wrapper generation
  - `sandbox_parse_sentinels()` — sentinel marker parsing
  - `sandbox_read_stdout_with_timeout()` — streaming stdout read
  - `sandbox_truncate_output()` — output size limiting
- Removed unused `$buffer` and redundant `$readStart` variables from `run.php`

### Fixed

- GA Measurement ID now configurable via `window.GA_MEASUREMENT_ID` instead of hardcoded

## [1.2.0] — 2026-07-11

### Added

- Migration to Eleventy (11ty) static site generator
- Nunjucks templates in `src/`, lesson content as Markdown (`.md`)
- Modular JavaScript architecture in `src/js/modules/` (18 modules)
- TypeScript configuration (`tsconfig.json`)
- ESLint flat config (`eslint.config.mjs`)
- Build pipeline: `build-assets-hash.mjs`, `build-config-meta.mjs`, `build-js.mjs`, `build-sw.mjs`
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Dependabot configuration (`.github/dependabot.yml`)
- Prettier config (`.prettierrc`, `.prettierignore`)
- Environment variables example (`.env.example`)
- Node version pinning (`.nvmrc`)
- Sandbox common utilities extracted to `sandbox_common.php`
- Sandbox internal test helpers (`_test_e2e.php`, `_test_stream_select.php`, `_test_wrapper.php`)
- Unit tests: config, mindmap, repl, sandbox-client, sw, utils (Vitest)
- Python AST validator unit tests (`tests/test_ast_validator.py`)
- PHP sandbox test suite (`tests/test_sandbox.php`)
- Open Graph image generation (`og-image.png`, build script)

### Changed

- Lesson HTML files replaced with Markdown sources in `src/`
- `.eleventy.js` heavily extended for the new build process
- JavaScript split into 18 focused modules with clean separation of concerns
- `sandbox/repl.php` and `sandbox/run.php` significantly refactored
- `manifest.json`, `sw.js`, `minify.js` updated for new architecture
- `README.md` rewritten with up-to-date development instructions

### Removed

- Flat HTML lesson files (50 files) — migrated to `src/*.md`
- `build.js`, `convert-lessons.js`, `extract-quizzes.js` — replaced by modular build pipeline
- `cheatsheets.html`, `final-test.html`, `mindmap.html`, `repl.html` — removed or migrated
- `mindmap.js`, `config.js`, `script.js` — replaced by modular JS sources
- `highlight-py.min.js`, `ga.js`, `ym-init.js` — removed
- `playwright.config.js` — removed

## [1.0.0] — 2026-06-01

### Added

- Initial release with 50 Python lessons
- Interactive REPL with Pyodide (browser) and PHP sandbox (server)
- PWA with Service Worker for offline access
- Quiz system per lesson
- Progress tracking and badges
- E2E tests with Playwright
- CI/CD with GitHub Actions
