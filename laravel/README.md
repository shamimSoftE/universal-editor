# Laravel Universal Rich Text Editor

[![Latest Version on Packagist](https://img.shields.io/packagist/v/shamimsofte/laravel-universal-editor.svg?style=flat-square)](https://packagist.org/packages/shamimsofte/laravel-universal-editor)
[![Total Downloads](https://img.shields.io/packagist/dt/shamimsofte/laravel-universal-editor.svg?style=flat-square)](https://packagist.org/packages/shamimsofte/laravel-universal-editor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

An enterprise-grade, secure, and full-featured backend integration package for **Universal Rich Text Editor** in Laravel.

---

## ✨ Features

- 🛡️ **Enterprise Security (XSS Sanitizer)**: Robust HTML sanitization preventing XSS attacks.
- 🗄️ **Document & Version Management**: Built-in models and migrations for document history, drafts, and version rollback.
- 💬 **Collaborative Comments & Document Locking**: Support for user comments and editing locks to prevent overwrite conflicts.
- 🤖 **AI Assistant Backend Integration**: Dedicated controllers and endpoints for AI-assisted writing tools.
- 🚀 **Auto-Discovery**: Compatible with Laravel 10 and Laravel 11.

---

## 📦 Installation

Install the package via Composer:

```bash
composer require shamimsofte/laravel-universal-editor
```

---

## ⚙️ Configuration & Publishing

Publish the configuration file:

```bash
php artisan vendor:publish --tag=editor-config
```

Publish the database migrations:

```bash
php artisan vendor:publish --tag=editor-migrations
php artisan migrate
```

This will publish:
- `config/editor.php`: Customizable limits, sanitize rules, AI configurations, and upload paths.
- Migrations for documents, revisions, comments, and editing locks.

---

## 🛠️ Usage

### 1. Content Sanitization (XSS Safe)

```php
use UniversalEditor\Laravel\Facades\Editor;

// Sanitize user-submitted HTML
$cleanHtml = Editor::sanitize($request->input('content'));
```

### 2. Available API Endpoints

The package registers the following routes automatically under `/api/editor/`:
- `GET|POST /api/editor/documents` — Manage documents and drafts
- `GET|POST /api/editor/versions` — Document version history and restore
- `POST /api/editor/comments` — Inline comment threads
- `POST /api/editor/lock` — Real-time editing lock acquisition
- `POST /api/editor/ai` — AI writing assistance prompts

---

## 🧪 Testing

Run test suite:

```bash
php tests/FullTestSuiteTest.php
```

---

## 📄 License

The MIT License (MIT). Please see [License File](LICENSE) for more information.
