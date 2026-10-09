# Vanilla JavaScript API Guide (`@universal-editor/core`)

> **Phase 17 Milestone Documentation**  
> Complete documentation for using the Universal Rich Text Editor in framework-independent Vanilla JavaScript environments without Vue, React, or build step requirements.

---

## 1. Overview

The Universal Rich Text Editor is architected from the ground up to be **100% framework-independent**. While official adapters are provided for Vue 3 and Vue 2, the underlying core engine (`@universal-editor/core`) can be consumed in:
- Pure HTML5/JavaScript web pages (zero build steps, plain `<script>` tags).
- Traditional server-rendered stacks (Laravel Blade, Django, Rails, Spring Boot, WordPress, ASP.NET).
- Modern bundled web applications using Vite, Webpack, Rollup, or esbuild.

---

## 2. Installation & Import Options

### Option A: Modern Bundler (ESM / TypeScript)
```bash
npm install @universal-editor/core
```

```javascript
import { createEditor } from '@universal-editor/core';
import '@universal-editor/core/styles.css';

const editor = createEditor({
  element: '#editor',
  content: '<p>Welcome to <strong>Universal Editor</strong>!</p>'
});
```

### Option B: Plain HTML Script Tag (UMD / CDN)
Include the compiled UMD bundle and stylesheet directly in your HTML `<head>` or before `</body>`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vanilla Editor Demo</title>
  <!-- Editor Stylesheet -->
  <link rel="stylesheet" href="/node_modules/@universal-editor/core/dist/styles.css">
</head>
<body>
  <!-- Editor Container -->
  <div id="editor"></div>

  <!-- UMD Script (exposes window.UniversalEditor) -->
  <script src="/node_modules/@universal-editor/core/dist/universal-editor.umd.js"></script>
  <script>
    const { createEditor } = window.UniversalEditor;

    const editor = createEditor({
      element: '#editor',
      content: '<h1>Universal Editor</h1><p>Framework-independent vanilla JS!</p>',
      toolbar: true
    });
  </script>
</body>
</html>
```

---

## 3. Instantiation API

The `createEditor` factory function supports both flexible options objects and direct selector overloads:

### Pattern 1: Standard Options Object
```javascript
const editor = createEditor({
  element: '#editor', // CSS selector or HTMLElement
  content: '<p>Initial content</p>',
  editable: true,
  placeholder: 'Type something...',
  toolbar: true, // boolean or custom array of tool names
  bubbleMenu: true
});
```

### Pattern 2: Selector First (Shorthand)
```javascript
const editor = createEditor('#editor', {
  content: '<p>Initial content</p>',
  toolbar: true
});
```

### Pattern 3: Direct Class Construction
```javascript
import { UniversalEditor } from '@universal-editor/core';

const editor = new UniversalEditor({
  element: document.getElementById('editor'),
  content: '<p>Direct instantiation</p>'
});
```

---

## 4. API Methods Reference

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getHTML()` | None | `string` | Returns the current content formatted as clean semantic HTML. |
| `getJSON()` | None | `Record<string, any>` | Returns the content serialized into TipTap/ProseMirror JSON tree. |
| `getText()` | None | `string` | Returns plain text content without formatting tags. |
| `getSanitizedHTML()` | `config?: SanitizerConfig` | `string` | Returns safe HTML with script injection and XSS vectors stripped. |
| `setContent()` | `content: string \| object, emitUpdate?: boolean` | `void` | Replaces the document content with new HTML or JSON. |
| `clearContent()` | `emitUpdate?: boolean` | `void` | Clears all content from the editor surface. |
| `focus()` | `position?: 'start' \| 'end' \| 'all' \| number` | `void` | Focuses the editor surface at the specified cursor position. |
| `blur()` | None | `void` | Blurs the editor surface, removing cursor focus. |
| `undo()` | None | `boolean` | Reverts the previous editing transaction. |
| `redo()` | None | `boolean` | Reapplies an undone transaction. |
| `setEditable()` | `editable: boolean` | `void` | Toggles read-only and editable states dynamically. |
| `destroy()` | None | `void` | Destroys the editor instance, removes toolbars, and unbinds listeners. |
| `on()` | `event: string, handler: Function` | `this` | Registers an event listener on the editor's event bus. |
| `off()` | `event: string, handler: Function` | `this` | Unregisters an event listener from the editor's event bus. |
| `once()` | `event: string, handler: Function` | `this` | Registers an event listener that executes once then auto-removes. |

---

## 5. Event Bus Reference (`editor.on` / `editor.off`)

The editor provides a unified reactive event bus:

```javascript
// Listen to content updates
editor.on('update', ({ editor, transaction }) => {
  console.log('HTML changed:', editor.getHTML());
});

// Alias for update
editor.on('change', ({ editor }) => {
  console.log('Change detected');
});

// Focus and blur
editor.on('focus', ({ editor, event }) => {
  console.log('Editor focused');
});

editor.on('blur', ({ editor, event }) => {
  console.log('Editor blurred');
});

// Real-time word count & limit alerts
editor.on('statistics:update', (stats) => {
  console.log(`Words: ${stats.words}, Chars: ${stats.characters}, Reading Time: ${stats.readingTimeString}`);
});

editor.on('limit:warning', ({ current, limit }) => {
  console.warn(`Approaching limit: ${current} of ${limit}`);
});

// Autosave notifications
editor.on('autosave:status', ({ status, timestamp }) => {
  console.log(`Autosave status: ${status} at ${timestamp}`);
});
```

---

## 6. Complete Vanilla JS Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Complete Vanilla JS Editor</title>
  <link rel="stylesheet" href="./node_modules/@universal-editor/core/src/ui/styles.css">
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .editor-wrapper { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; }
    .controls { margin-top: 1rem; display: flex; gap: 0.5rem; }
    button { background: #6366f1; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    button:hover { background: #4f46e5; }
    pre { background: #020617; padding: 1rem; border-radius: 6px; overflow: auto; max-height: 200px; }
  </style>
</head>
<body>
  <h1>Vanilla JavaScript Editor</h1>
  
  <div class="editor-wrapper">
    <div id="editor"></div>
  </div>

  <div class="controls">
    <button id="btnGetHtml">Get HTML</button>
    <button id="btnSetContent">Set Content</button>
    <button id="btnClear">Clear</button>
    <button id="btnFocus">Focus</button>
    <button id="btnDestroy">Destroy</button>
  </div>

  <h3>Live HTML Output</h3>
  <pre id="output"></pre>

  <script type="module">
    import { createEditor } from './packages/core/src/index.ts';

    const editor = createEditor({
      element: '#editor',
      content: '<h2>Hello Vanilla JS!</h2><p>This editor runs without any framework.</p>',
      toolbar: true,
      placeholder: 'Type your story...',
    });

    const outputEl = document.getElementById('output');

    editor.on('update', () => {
      outputEl.textContent = editor.getHTML();
    });

    document.getElementById('btnGetHtml').addEventListener('click', () => {
      alert(editor.getHTML());
    });

    document.getElementById('btnSetContent').addEventListener('click', () => {
      editor.setContent('<p>Replaced dynamically via <code>editor.setContent()</code>!</p>', true);
    });

    document.getElementById('btnClear').addEventListener('click', () => {
      editor.clearContent(true);
    });

    document.getElementById('btnFocus').addEventListener('click', () => {
      editor.focus('end');
    });

    document.getElementById('btnDestroy').addEventListener('click', () => {
      editor.destroy();
      alert('Editor destroyed!');
    });
  </script>
</body>
</html>
```
