# Universal Rich Text Editor — Architecture Specification

## 1. Executive Overview
The **Universal Rich Text Editor** is an enterprise-grade, extensible, framework-independent rich content editing engine. The architecture adheres to strict modularity, separation of concerns, and pluggability so that the core editor can be seamlessly integrated across **Vue 3**, **Vue 2**, **Vanilla JavaScript**, and backend platforms such as **Laravel**.

---

## 2. Core Architectural Principles

```
              ┌────────────────────────┐
              │   Universal Editor     │
              │         Core           │
              │ (@universal-editor/core)│
              └───────────┬────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│ Vue 3 Adapter│   │ Vue 2 Adapter│   │ Vanilla JS API│
│  (Phase 3)   │   │  (Phase 16)  │   │  (Phase 17)   │
└──────────────┘   └──────────────┘   └───────────────┘
                          │
                          ▼
             ┌─────────────────────────┐
             │ Laravel Backend Package │
             │(laravel-universal-editor│
             │     Phase 5 & beyond)   │
             └─────────────────────────┘
```

1. **Framework Independence**: The core engine (`packages/core`) does not have dependencies on Vue, React, or any UI framework. It wraps and abstracts ProseMirror and Tiptap.
2. **Unified API Contract**: All adapters implement the same consumer-facing API (`getHTML`, `getJSON`, `getText`, `setContent`, `clearContent`, `focus`, `blur`, `undo`, `redo`, `destroy`).
3. **Pluggable Extensions**: Extensions are decoupled from the core editor surface. Phase-specific features (Tables, Code Blocks, Mentions, Slash Commands, AI Integration) are added as standalone extensions.
4. **Resilient Event System**: A lightweight typed event emitter decouples state changes (`update`, `focus`, `blur`, `selectionUpdate`, `transaction`, `destroy`) from UI rendering.

---

## 3. Monorepo Organization

```
universal-editor/
├── packages/
│   ├── core/              # Framework-independent core engine
│   ├── vue3/              # Vue 3 component adapter
│   ├── vue2/              # Vue 2 component adapter
│   ├── extensions/        # Custom and extended extensions
│   └── utils/             # Shared utilities (EventEmitter, debounce, etc.)
│
├── laravel/               # Official Laravel integration package
│   ├── src/               # ServiceProvider, Controllers, Services
│   ├── config/            # editor.php configuration
│   ├── routes/            # API endpoints (upload, media, autosave)
│   ├── database/          # Migrations (editor_documents, etc.)
│   └── tests/             # PHPUnit / Pest tests
│
├── demo/                  # Interactive demo application (Vite)
├── docs/                  # Architectural and technical documentation
├── tests/                 # Monorepo unit and integration tests
├── package.json           # Workspace orchestration
├── tsconfig.json          # Strict TypeScript configuration
└── vitest.config.ts       # Test runner configuration
```

---

## 4. Phase 1 Core Engine API

### Instantiation
```typescript
import { createEditor } from '@universal-editor/core';

const editor = createEditor({
  element: document.querySelector('#editor'),
  content: '<p>Initial text</p>',
  editable: true,
  autofocus: 'end',
  onUpdate: ({ editor, transaction }) => {
    console.log('Content updated:', editor.getHTML());
  }
});
```

### Core Methods
| Method | Return Type | Description |
| :--- | :--- | :--- |
| `getHTML()` | `string` | Serializes document to sanitized HTML |
| `getJSON()` | `Record<string, any>` | Serializes document to structured JSON |
| `getText()` | `string` | Extracts plain text from document |
| `setContent(content, emitUpdate?)` | `void` | Updates editor content |
| `clearContent(emitUpdate?)` | `void` | Clears all content from the editor |
| `focus(position?)` | `void` | Focuses the editor cursor ('start', 'end', 'all') |
| `blur()` | `void` | Removes focus from editor |
| `undo()` | `boolean` | Reverts previous transaction |
| `redo()` | `boolean` | Re-applies reverted transaction |
| `setEditable(boolean)` | `void` | Toggles read-only or editable mode |
| `destroy()` | `void` | Cleans up ProseMirror DOM and listeners |

### Event Lifecycle
- `update`: Fired when document state or content changes.
- `focus`: Fired when editor gains focus.
- `blur`: Fired when editor loses focus.
- `selectionUpdate`: Fired when cursor position or selection changes.
- `transaction`: Fired when any ProseMirror transaction completes.
- `destroy`: Fired when editor instance is torn down.

---

## 5. Development Roadmap (Phases 1 — 30)

As specified in the Enterprise Project Prompt, development strictly proceeds phase by phase:
- **Phase 1**: Project Architecture & Core Setup *(Active / Current Deliverable)*
- **Phase 2**: Basic Rich Text Editing (Bold, Italic, Lists, Headings, Toolbar)
- **Phase 3**: Vue 3 Production Component (`<RichTextEditor />`)
- **Phase 4**: Image & File Management (Upload, Preview, Resize, Attachment cards)
- **Phase 5**: Laravel Package (`laravel-universal-editor`)
- **Phase 6**: Security & Content Sanitization (`ContentSanitizer`, XSS Defense)
- **Phase 7**: Advanced Formatting (Colors, Font Sizes, RTL/LTR, Bangla, Arabic, etc.)
- **Phase 8**: Tables (Rows, Columns, Merge, Split, Context Menu)
- **Phase 9**: Code Block & Syntax Highlighting
- **Phase 10**: Media Embeds (YouTube, Vimeo, Maps)
- **Phase 11**: Notion-Style Slash Commands (`/image`, `/table`, etc.)
- **Phase 12**: Mentions System (`@user`)
- **Phase 13**: Autosave & Draft System
- **Phase 14**: Word & Character Counter
- **Phase 15**: Read-Only & Viewer Mode (`<RichTextViewer />`)
- **Phase 16**: Vue 2 Adapter
- **Phase 17**: Vanilla JavaScript Distribution Package
- **Phase 18**: Laravel Database & Content Management
- **Phase 19**: Document Version History
- **Phase 20**: Collaboration & Comments (WebSocket / Reverb)
- **Phase 21**: AI Assistant Integration
- **Phase 22**: Theming Engine (Light/Dark/CSS variables)
- **Phase 23**: Mobile & Accessibility (WCAG 2.1 / ARIA)
- **Phase 24**: Comprehensive Testing Suite
- **Phase 25**: Developer Documentation
- **Phase 26**: NPM & Composer Distribution Prep
- **Phase 27**: Showcase Documentation Website
- **Phase 28**: Production Bundle & Performance Optimization
- **Phase 29**: Security Audit & Penetration Testing
- **Phase 30**: Final Production Release
