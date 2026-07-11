# Contributing to python-web

Thank you for your interest in contributing to this educational Python course!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/BesuglovS/python-web.git
cd python-web

# Install dependencies
npm install

# Start development server with live reload
npm run watch
```

The site will be available at `http://localhost:8080`.

## Project Structure

- `src/*.md` — lesson source files (Markdown with YAML front matter)
- `src/js/*.js` — JavaScript source files (unminified, readable)
- `src/_includes/` — Nunjucks templates
- `sandbox/` — PHP backend for code execution
- `quizzes/` — Quiz JSON files per lesson

## Making Changes

### Lessons

1. Edit the Markdown file in `src/` (e.g., `src/25-lists.md`)
2. Follow the front matter format documented in README.md
3. Run `npm run build` to generate HTML
4. Preview at `http://localhost:8080/25-lists.html`

### JavaScript

Source files live in `src/js/`. The build process minifies them to the project root.

```bash
# Lint source files
npm run lint

# Format source files
npm run format

# Build (includes minification)
npm run build:prod
```

### PHP Sandbox

The sandbox runs Python code server-side. Test changes carefully:

```bash
# Start PHP dev server
php -S localhost:8080 router.php

# Test the sandbox endpoint
curl -X POST http://localhost:8080/sandbox/run.php \
  -d '{"code":"print(42)","timeout":5}'
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Open Playwright UI for E2E tests
npm run test:ui
```

## Code Style

- **JavaScript**: ESLint + Prettier (config in `.eslintrc` and `.prettierrc`)
- **CSS**: Prettier
- **Markdown**: Prettier (120 char width)
- **PHP**: Follow existing conventions

Run `npm run lint` and `npm run format:check` before committing.

## Commit Messages

Use clear, descriptive commit messages in Russian or English:

- `fix: исправлен path traversal в router.php`
- `feat: добавлена XSS-защита в mindmap.js`
- `refactor: вынесен AST-валидатор в отдельный файл`

## Security

If you discover a security vulnerability, please report it privately via:

- Email: see `.well-known/security.txt`
- GitHub Security Advisories

Do **not** open a public issue for security vulnerabilities.
