# Universal Rich Text Editor

> Enterprise-ready, extensible, framework-independent Rich Text Editor monorepo.
> 
> 📘 **[Client & Developer Integration Guide (ব্যবহার নির্দেশিকা)](USER_INTEGRATION_GUIDE.md)**: Step-by-step setup instructions for Plain HTML/PHP, Vue 3, Vue 2, and Laravel, feature explanations, and cPanel/Live server deployment guide.

## Project Structure
```
universal-editor/
├── packages/
│   ├── core/              # Framework-independent core engine
│   ├── vue3/              # Vue 3 component adapter
│   ├── vue2/              # Vue 2 component adapter
│   ├── extensions/        # Extension registry
│   └── utils/             # Shared utilities
├── laravel/               # Laravel integration package
├── demo/                  # Interactive demo application
├── docs/                  # Architecture & design documentation
├── tests/                 # Unit & integration tests
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Quick Start

### Installation
```bash
npm install
```

### Run Demo
```bash
npm run dev
```

### Run Tests
```bash
# Frontend Unit & Vue 3 Component Tests (Vitest)
npm test

# Full Monorepo Test Suite (TypeScript Vitest + PHP Laravel)
npm run test:all

# Automated Headless Browser E2E Lifecycle (Edge/Puppeteer)
npm run test:e2e

# Laravel Package Tests (PHP)
npm run test:laravel
```



