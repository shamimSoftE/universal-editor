# Universal Rich Text Editor — Enterprise Developer Guide

> **Version**: 1.0.0 | **Author**: Enterprise Architecture Team | **License**: MIT  
> Enterprise-grade, framework-independent Rich Text Editor monorepo with official adapters for **Vue 3**, **Vue 2**, **Vanilla JavaScript**, and **Laravel**.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installation](#2-installation)
3. [Vue 3 Installation](#3-vue-3-installation)
4. [Vue 2 Installation](#4-vue-2-installation)
5. [Vanilla JS Installation](#5-vanilla-js-installation)
6. [Laravel Installation](#6-laravel-installation)
7. [Basic Usage](#7-basic-usage)
8. [Configuration](#8-configuration)
9. [Toolbar Customization](#9-toolbar-customization)
10. [Image Upload](#10-image-upload)
11. [File Upload](#11-file-upload)
12. [Tables](#12-tables)
13. [Code Blocks](#13-code-blocks)
14. [Embeds](#14-embeds)
15. [Slash Commands](#15-slash-commands)
16. [Mentions](#16-mentions)
17. [Autosave](#17-autosave)
18. [Sanitization](#18-sanitization)
19. [Custom Extensions](#19-custom-extensions)
20. [Custom Upload Provider](#20-custom-upload-provider)
21. [Custom AI Provider](#21-custom-ai-provider)
22. [Events](#22-events)
23. [Theming](#23-theming)
24. [Security](#24-security)
25. [API Reference](#25-api-reference)
26. [Troubleshooting](#26-troubleshooting)
27. [Migration Guide](#27-migration-guide)

---

## 1. Introduction

The **Universal Rich Text Editor** is designed as a modular, extensible, framework-independent rich content editing system. Unlike monolithic editors tightly coupled to a single frontend framework, Universal Editor cleanly separates the core document editing engine from UI adapters.

```
                    ┌───────────────────────────────┐
                    │      @universal-editor/core   │
                    │  (ProseMirror/Tiptap Engine)  │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌───────────────┐
│    Vue 3     │            │    Vue 2     │            │  Vanilla JS   │
│  @vue3       │            │  @vue2       │            │  Core API     │
└──────┬───────┘            └──────┬───────┘            └───────┬───────┘
       │                           │                            │
       └───────────────────────────┼────────────────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │    Laravel Backend Package    │
                    │   (Storage, Upload, Policy)   │
                    └───────────────────────────────┘
```

### Key Highlights
- **Framework Independent**: Core engine written in strict TypeScript with zero UI framework dependencies.
- **Rich Document Elements**: Complete support for headings (H1–H6), bold, italic, underline, strike, inline code, blockquotes, lists (bullet, ordered, task), horizontal dividers, tables, embeds, and syntax-highlighted code blocks.
- **Interactive Productivity**: Notion-style Slash Commands (`/`), User Mentions (`@`), Floating Bubble Menu, and Document Version History.
- **Media Architecture**: Image drag-and-drop, clipboard paste, client-side resizing, alignment, file attachment cards, and customizable upload providers.
- **Enterprise Security**: Dual-tier sanitization (client-side and server-side), strict MIME whitelisting, file size enforcement, and Laravel authorization policies.
- **Accessibility & Mobile**: WAI-ARIA Toolbar roving tabindex, screen reader live regions (WCAG 2.1 AA/AAA), focus traps, and touch-optimized mobile bottom sheets.

---

## 2. Installation

Install the required packages based on your application stack.

```bash
# Core engine (Required by all implementations)
npm install @universal-editor/core

# Vue 3 Component
npm install @universal-editor/vue3

# Vue 2 Component (For legacy Vue 2 projects)
npm install @universal-editor/vue2

# Laravel Backend Package (Composer)
composer require vendor/laravel-universal-editor
```

### Peer Dependencies
- **Node.js**: `>= 18.0.0`
- **TypeScript** (Optional but recommended): `>= 5.0.0`
- **Vue**: `^3.4.0` (for Vue 3) or `^2.6.14` (for Vue 2)
- **PHP**: `>= 8.1` (for Laravel package)

---

## 3. Vue 3 Installation

### Global Registration
In your application entry point (`main.ts` or `main.js`):

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { RichTextEditor } from '@universal-editor/vue3';
import '@universal-editor/vue3/style.css';

const app = createApp(App);
app.component('RichTextEditor', RichTextEditor);
app.mount('#app');
```

### Local SFC Import
In any Vue 3 Single File Component:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RichTextEditor } from '@universal-editor/vue3';
import '@universal-editor/vue3/style.css';

const documentContent = ref('<h1>Welcome to Universal Editor</h1><p>Start editing...</p>');
</script>

<template>
  <div class="editor-container">
    <RichTextEditor
      v-model="documentContent"
      placeholder="Type / for commands..."
      output-format="html"
    />
  </div>
</template>
```

---

## 4. Vue 2 Installation

Universal Editor provides full backward-compatibility for Vue 2 (2.6+ and 2.7+).

```bash
npm install @universal-editor/vue2 @universal-editor/core
```

*Note for Vue 2.6: Install `@vue/composition-api` if not already present in your project.*

```vue
<template>
  <div class="legacy-app">
    <RichTextEditor
      v-model="content"
      :toolbar="toolbarConfig"
      :dark-mode="false"
      @change="onEditorChange"
    />
  </div>
</template>

<script>
import { RichTextEditor } from '@universal-editor/vue2';
import '@universal-editor/core/style.css';

export default {
  name: 'DocumentEditor',
  components: {
    RichTextEditor,
  },
  data() {
    return {
      content: '<p>Content in Vue 2 application</p>',
      toolbarConfig: ['bold', 'italic', 'underline', '|', 'heading', 'bulletList', 'orderedList'],
    };
  },
  methods: {
    onEditorChange(newHtml) {
      console.log('Document updated:', newHtml);
    },
  },
};
</script>
```

---

## 5. Vanilla JS Installation

The core editor can be mounted on any standard HTML DOM element without Vue or any UI framework.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vanilla JS Editor</title>
  <link rel="stylesheet" href="node_modules/@universal-editor/core/dist/style.css">
</head>
<body>
  <div id="editor-container"></div>

  <script type="module">
    import { createEditor } from '@universal-editor/core';

    const editor = createEditor({
      element: document.getElementById('editor-container'),
      content: '<p>Hello from Vanilla JavaScript!</p>',
      editable: true,
      placeholder: 'Enter text...',
      onUpdate: ({ editor }) => {
        console.log('HTML Output:', editor.getHTML());
      },
    });

    // Clean up on page transition
    window.addEventListener('beforeunload', () => editor.destroy());
  </script>
</body>
</html>
```

---

## 6. Laravel Installation

The official Laravel package provides REST APIs, file storage handling, MIME validation, server-side XSS sanitization, and document persistence.

### Step 1: Require via Composer
```bash
composer require vendor/laravel-universal-editor
```

The package automatically discovers `UniversalEditor\Laravel\EditorServiceProvider`. If your project disables package discovery, manually register `EditorServiceProvider` in `config/app.php`:
```php
'providers' => [
    // Other Service Providers
    UniversalEditor\Laravel\EditorServiceProvider::class,
],
```

### Step 2: Publish Configuration & Migrations
```bash
# Publish config/editor.php
php artisan vendor:publish --tag=editor-config

# Publish migrations
php artisan vendor:publish --tag=editor-migrations

# Run database migrations
php artisan migrate
```

### Step 3: Configure Environment (`.env`)
```ini
EDITOR_DISK=public
EDITOR_PATH=editor
EDITOR_MAX_FILE_SIZE=10240
EDITOR_ALLOWED_MIMES=jpg,jpeg,png,webp,gif,pdf,docx,xlsx,zip
```

---

## 7. Basic Usage

### Programmatic API Overview
The `UniversalEditor` instance provides an imperative API across all platforms:

```typescript
import { createEditor } from '@universal-editor/core';

const editor = createEditor({ content: '<p>Initial text</p>' });

// Content Retrieval
const html = editor.getHTML();
const json = editor.getJSON();
const plainText = editor.getText();
const safeHtml = editor.getSanitizedHTML();

// Content Manipulation
editor.setContent('<h2>New Heading</h2><p>Updated content.</p>');
editor.clearContent();

// Focus & Selection
editor.focus();
editor.blur();

// History
if (editor.canUndo()) editor.undo();
if (editor.canRedo()) editor.redo();

// Destroy
editor.destroy();
```

---

## 8. Configuration

Pass configuration options when mounting the editor:

```typescript
const options: EditorOptions = {
  element: '#editor',                // DOM Element or selector string
  content: '<p>Initial content</p>', // Initial HTML or JSON string
  editable: true,                    // Read-only toggle
  placeholder: 'Type something...',  // Empty state placeholder
  autofocus: 'end',                  // 'start' | 'end' | 'all' | boolean
  outputFormat: 'html',              // 'html' | 'json' | 'text'
  minHeight: '250px',                // Minimum content height
  maxHeight: '600px',                // Maximum height with vertical scroll
  characterLimit: 5000,              // Hard character limit
  wordLimit: 1000,                   // Hard word limit
  accessibility: {
    announcer: true,                 // Enable ARIA live region announcements
    keyboardNav: true,               // Enable roving tabindex
    focusTrap: true,                 // Trap focus in dialogs
  },
  mobile: {
    responsiveToolbar: true,         // Horizontal touch carousel
    bottomSheet: true,               // Dock toolbar to bottom on small viewports
  },
  theme: 'dark',                     // 'light' | 'dark' | 'auto' | CustomTheme
};
```

---

## 9. Toolbar Customization

### Configuring Toolbar Controls
The toolbar can be customized by specifying an array of command keys and divider tokens (`'|'`):

```vue
<template>
  <RichTextEditor
    v-model="content"
    :toolbar="[
      'bold', 'italic', 'underline', 'strike', '|',
      'heading', '|',
      'bulletList', 'orderedList', 'taskList', '|',
      'alignLeft', 'alignCenter', 'alignRight', '|',
      'link', 'image', 'table', 'codeBlock', 'embed', '|',
      'undo', 'redo'
    ]"
  />
</template>
```

### Available Toolbar Tokens
| Token | Description |
| :--- | :--- |
| `'bold'`, `'italic'`, `'underline'`, `'strike'` | Basic inline marks |
| `'heading'` | Headings dropdown (Paragraph, H1–H6) |
| `'bulletList'`, `'orderedList'`, `'taskList'` | List formatting |
| `'blockquote'`, `'horizontalRule'` | Semantic blocks |
| `'alignLeft'`, `'alignCenter'`, `'alignRight'`, `'alignJustify'` | Text alignment |
| `'link'`, `'image'`, `'file'`, `'table'`, `'codeBlock'`, `'embed'` | Rich media & elements |
| `'color'`, `'highlight'`, `'fontSize'`, `'fontFamily'` | Typography & styling |
| `'undo'`, `'redo'` | History state navigation |
| `'|'` | Visual divider |

---

## 10. Image Upload

The editor supports seamless image insertion through drag-and-drop, clipboard paste, local file picking, and remote URLs.

```
User Action (Drop/Paste/Picker)
         │
         ▼
Editor Upload Service
         │
         ▼
Laravel Backend API (POST /editor/upload)
         │
         ▼
Storage Disk (Local/S3/Public)
         │
         ▼
Return Public CDN URL (JSON)
         │
         ▼
Editor Inserts <img src="..." alt="..." />
```

### Vue 3 Image Handling
```vue
<template>
  <RichTextEditor
    v-model="content"
    :upload-endpoint="'/api/editor/upload'"
    :max-file-size="5 * 1024 * 1024"
    @image-upload="onImageUploaded"
  />
</template>

<script setup lang="ts">
const onImageUploaded = (result: { url: string; name: string; size: number }) => {
  console.log('Image stored at:', result.url);
};
</script>
```

---

## 11. File Upload

Files are embedded inside the document as interactive attachment cards with download links, formatted file sizes, and filetype badge icons:

```typescript
editor.insertFileAttachment({
  url: 'https://cdn.example.com/reports/q3_financials.pdf',
  name: 'q3_financials.pdf',
  size: 245760, // 240 KB
  mime: 'application/pdf',
});
```

Supported MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/zip`, `text/plain`, `text/csv`.

---

## 12. Tables

Universal Editor provides advanced ProseMirror table matrices with cell selection, resizing, and context menus.

```typescript
// Insert 3x3 table with headers
editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });

// Table Navigation Commands
editor.addRowBefore();
editor.addRowAfter();
editor.deleteRow();
editor.addColumnBefore();
editor.addColumnAfter();
editor.deleteColumn();
editor.mergeCells();
editor.splitCell();
editor.toggleHeaderRow();
editor.deleteTable();
```

### Context Menu
Right-clicking any cell inside a table opens the contextual table menu containing actions to add/remove rows, merge cells, and format columns.

---

## 13. Code Blocks

Syntax-highlighted code blocks powered by lowlight / highlight.js:

```typescript
editor.setCodeBlock({ language: 'typescript' });
```

### Supported Languages
`javascript`, `typescript`, `php`, `python`, `html`, `css`, `sql`, `json`, `java`, `c`, `cpp`, `bash`, `blade`.

Each code block includes a language selection dropdown header and a one-click **Copy Code** button.

---

## 14. Embeds

Media embeds support YouTube, Vimeo, Google Maps, video streams, and generic iframes with responsive 16:9 ratio wrappers.

```typescript
editor.insertEmbed({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  provider: 'youtube',
  caption: 'Enterprise Architecture Overview',
});
```

Security enforcement prevents unauthorized domains from rendering inside iframes. Configure the domain whitelist in `config/editor.php`:
```php
'embeds' => [
    'allowed_domains' => ['youtube.com', 'youtu.be', 'vimeo.com', 'google.com/maps'],
],
```

---

## 15. Slash Commands

Type `/` at the start of any line or empty paragraph to trigger the Notion-style command palette:

| Command | Action |
| :--- | :--- |
| `/paragraph` | Regular paragraph text |
| `/h1`, `/h2`, `/h3` | Heading 1, 2, or 3 |
| `/bullet`, `/ordered`, `/task` | Lists |
| `/quote` | Blockquote callout |
| `/table` | Interactive table grid |
| `/code` | Syntax-highlighted code block |
| `/image`, `/file`, `/embed` | Media attachments and embeds |
| `/divider` | Horizontal rule divider |

Navigate with `ArrowUp` / `ArrowDown`, press `Enter` to select, or `Escape` to dismiss.

---

## 16. Mentions

Trigger user autocomplete with `@`:

```typescript
const editor = createEditor({
  mentionProvider: async (query: string) => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    const users = await res.json();
    return users.map(user => ({
      id: user.id,
      label: user.name,
      username: user.handle,
      avatar: user.avatar_url,
    }));
  },
});
```

Mentions serialize as semantic nodes:
```json
{
  "type": "mention",
  "attrs": {
    "id": 42,
    "label": "Sarah Connor",
    "avatar": "https://example.com/avatars/sarah.png"
  }
}
```

---

## 17. Autosave

Automatic, debounced synchronization with draft persistence:

```typescript
const editor = createEditor({
  autosave: {
    enabled: true,
    interval: 5000,    // Periodic sync interval (ms)
    debounce: 1000,    // Debounce duration after typing (ms)
    endpoint: '/api/editor/autosave',
    onSaveStatusChange: (status) => {
      // 'saving' | 'saved' | 'unsaved' | 'error'
      console.log('Current status:', status);
    },
  },
});
```

If the user goes offline or loses connectivity, drafts are cached in `localStorage` and can be restored when the application reloads.

---

## 18. Sanitization

Universal Editor enforces a strict defense-in-depth sanitization model:

### Client-Side (`ContentSanitizer`)
```typescript
import { ContentSanitizer } from '@universal-editor/core';

const sanitizer = new ContentSanitizer();
const cleanHtml = sanitizer.sanitize('<p>Hello<script>alert(1)</script></p>');
// Output: <p>Hello</p>
```

### Server-Side (Laravel `EditorSanitizer`)
```php
use UniversalEditor\Laravel\Facades\Editor;

$cleanHtml = Editor::sanitize($request->input('content_html'));
```

### Sanitization Policy
- **Dangerous tags stripped**: `<script>`, `<style>`, `<form>`, `<input>`, `<object>`, `<embed>`, `<applet>`.
- **Event handlers stripped**: `onerror`, `onload`, `onclick`, `onmouseover`, etc.
- **Protocols whitelisted**: `http:`, `https:`, `mailto:`, `tel:`.
- **Malicious SVG payloads stripped**: `<svg onload="...">` and nested `<foreignObject>` tags.

---

## 19. Custom Extensions

Extend the editor with custom ProseMirror / Tiptap extensions:

```typescript
import { Extension } from '@tiptap/core';

export const AutoCapitalizeExtension = Extension.create({
  name: 'autoCapitalize',

  addKeyboardShortcuts() {
    return {
      'Shift-Alt-u': () => {
        // Custom transformation logic
        return true;
      },
    };
  },
});

// Register extension
const editor = createEditor({
  extensions: [AutoCapitalizeExtension],
});
```

---

## 20. Custom Upload Provider

Implement `UploaderInterface` to route uploads through AWS S3, Cloudinary, or custom microservices:

```typescript
import type { UploaderInterface, UploadResult, ProgressCallback } from '@universal-editor/core';

export class S3DirectUploader implements UploaderInterface {
  async uploadImage(file: File, onProgress?: ProgressCallback): Promise<UploadResult> {
    // 1. Get presigned upload URL
    const presign = await fetch('/api/s3/presign', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, type: file.type }),
    }).then(r => r.json());

    // 2. Upload file directly to S3 bucket
    await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    return {
      url: presign.publicCdnUrl,
      name: file.name,
      size: file.size,
    };
  }

  async uploadFile(file: File, onProgress?: ProgressCallback): Promise<UploadResult> {
    return this.uploadImage(file, onProgress);
  }
}

// Inject into editor
const editor = createEditor({
  uploader: new S3DirectUploader(),
});
```

---

## 21. Custom AI Provider

Connect custom Large Language Models (OpenAI, Anthropic Claude, Google Gemini, or local models) by implementing `AIProviderInterface`:

```typescript
import type { AIProviderInterface, AIActionType } from '@universal-editor/core';

export class OpenAIAssistantProvider implements AIProviderInterface {
  constructor(private apiKey: string) {}

  async execute(action: AIActionType, text: string, prompt?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Perform action: ${action}` },
          { role: 'user', content: text },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

---

## 22. Events

Subscribe to editor lifecycle and state events:

```typescript
// Document updates
editor.on('update', ({ editor }) => {
  console.log('Document modified:', editor.getHTML());
});

// Focus and blur
editor.on('focus', () => console.log('Editor focused'));
editor.on('blur', () => console.log('Editor blurred'));

// Selection update
editor.on('selectionUpdate', ({ editor }) => {
  console.log('Cursor offset:', editor.getSelectionPosition());
});

// Low-level ProseMirror transaction
editor.on('transaction', ({ transaction }) => {
  // Inspect document steps
});

// Unsubscribe
const handler = () => {};
editor.on('update', handler);
editor.off('update', handler);
```

---

## 23. Theming

Theming is powered by modern CSS custom properties and high-contrast accessibility tokens.

```css
:root {
  /* Surface and Text */
  --ue-bg: #0f172a;
  --ue-text: #f8fafc;
  --ue-border: #334155;
  --ue-placeholder: #64748b;

  /* Toolbar */
  --ue-toolbar-bg: #1e293b;
  --ue-toolbar-border: #334155;
  --ue-button-hover: #334155;
  --ue-button-active: #2563eb;
  --ue-button-text: #cbd5e1;

  /* Typography & Layout */
  --ue-font-family: 'Inter', system-ui, sans-serif;
  --ue-font-size: 16px;
  --ue-radius: 8px;
}
```

Switch themes dynamically at runtime:
```typescript
import { generateCSSVariables } from '@universal-editor/core';

// Apply custom branding
const cssVariables = generateCSSVariables({
  backgroundColor: '#18181b',
  textColor: '#fafafa',
  primaryColor: '#8b5cf6',
});
```

---

## 24. Security

Universal Editor follows a multi-tiered security framework:

1. **Client-Side Defense**: Strips XSS attack vectors before emitting HTML to parents or viewers.
2. **Server-Side Enforcement**: Laravel validation rejects unwhitelisted MIME types, executes file signature inspection (via PHP `finfo`), and sanitizes persisted HTML.
3. **MIME Spoofing Prevention**: Validates actual binary file headers instead of relying on client-supplied extensions.
4. **Path Traversal Protection**: Uploaded files receive SHA-256 hashed filenames stored in isolated public storage partitions.
5. **CSRF & Authentication**: Laravel routes are protected by Laravel's `web` or `auth:sanctum` middleware guards.
6. **Authorization Policies**: `EditorDocumentPolicy` verifies model ownership before permitting `update` or `delete` actions.

---

## 25. API Reference

### `UniversalEditor` Core Class
| Method | Return Type | Description |
| :--- | :--- | :--- |
| `getHTML()` | `string` | Returns current document content as HTML |
| `getJSON()` | `Record<string, any>` | Returns current document content as ProseMirror JSON |
| `getText()` | `string` | Returns plain text representation of document |
| `getSanitizedHTML()` | `string` | Returns XSS-sanitized HTML |
| `setContent(content)` | `void` | Sets document content from HTML or JSON |
| `clearContent()` | `void` | Clears all content, leaving an empty paragraph |
| `focus(position?)` | `void` | Focuses editor at specified position |
| `blur()` | `void` | Blurs editor DOM node |
| `undo()` | `void` | Undoes last editing transaction |
| `redo()` | `void` | Redoes previously undone transaction |
| `canUndo()` | `boolean` | Checks if undo history is available |
| `canRedo()` | `boolean` | Checks if redo history is available |
| `destroy()` | `void` | Destroys editor instance and unbinds event listeners |
| `on(event, callback)` | `void` | Registers an event listener |
| `off(event, callback)`| `void` | Removes an event listener |

### Vue 3 `<RichTextEditor />` Component Props
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `v-model` | `string` | `''` | Two-way binding for document HTML or JSON |
| `editable` | `boolean` | `true` | Read-only mode toggle |
| `placeholder` | `string` | `'Start typing...'` | Placeholder text when document is empty |
| `toolbar` | `string[]` | Default set | Array of toolbar tokens and separators |
| `outputFormat` | `'html' \| 'json'` | `'html'` | Format emitted via `update:modelValue` |
| `minHeight` | `string` | `'200px'` | Minimum content area height |
| `maxHeight` | `string` | `undefined` | Maximum content area height with scrolling |
| `darkMode` | `boolean` | `false` | Dark mode styling toggle |
| `accessibility` | `boolean \| object` | `true` | ARIA live region and roving tabindex |
| `mobile` | `boolean \| object` | `true` | Responsive mobile toolbar handling |

---

## 26. Troubleshooting

### 1. SSR Hydration Mismatch (Nuxt / Next.js)
**Issue**: `document is not defined` or `window is not defined` when rendering on the server.  
**Solution**: Render `<RichTextEditor />` inside `<ClientOnly>` in Nuxt 3 or use dynamic imports with `{ ssr: false }` in Next.js.

### 2. Laravel CSRF Token Mismatch (419 Error on Upload)
**Issue**: Image upload fails with HTTP status 419.  
**Solution**: Include the CSRF token in the upload headers or configure Axios interceptors:
```javascript
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
```

### 3. Missing CSS Styles
**Issue**: Toolbar buttons lack styling or editor is transparent.  
**Solution**: Ensure you import the stylesheet:
```typescript
import '@universal-editor/vue3/style.css'; // or @universal-editor/core/style.css
```

---

## 27. Migration Guide

### Migrating from Tiptap v1 / v2
1. Replace individual Tiptap extension imports with `@universal-editor/core` or `@universal-editor/vue3`.
2. Replace `new Editor({ extensions: [...] })` with `createEditor({ ... })`.
3. Universal Editor retains 100% ProseMirror JSON schema compatibility—existing documents load without migration scripts.

### Migrating from Quill.js / TinyMCE / CKEditor
1. Export stored documents as standard HTML.
2. Ingest HTML via `editor.setContent(savedHtml)`. Universal Editor automatically normalizes legacy HTML tags (`<b>` to `<strong>`, `<i>` to `<em>`, etc.) into ProseMirror schema nodes.
3. Switch file upload routes from legacy controller endpoints to `/editor/upload`.
