# @shamimsofte/universal-editor-core

[![npm version](https://img.shields.io/npm/v/@shamimsofte/universal-editor-core.svg?style=flat-square)](https://www.npmjs.com/package/@shamimsofte/universal-editor-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/@shamimsofte/universal-editor-core/badge)](https://www.jsdelivr.com/package/npm/@shamimsofte/universal-editor-core)

A modern, fast, secure, framework-independent Rich Text Editor engine (built on ProseMirror & TipTap). Works seamlessly in Plain JavaScript, HTML, PHP, CodeIgniter, Laravel, WordPress, and all frontend frameworks.

---

## 🚀 Quick Start via CDN (TinyMCE Style)

No installation or build tools required. Just include the stylesheet and script in your HTML page:

```html
<!-- Editor Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/styles.css">

<!-- Container -->
<div id="editor"></div>

<!-- Core Engine (UMD) -->
<script src="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/universal-editor.umd.js"></script>

<script>
  const editor = UniversalEditor.createEditor({
    element: document.getElementById('editor'),
    content: '<p>Hello world! Start typing or press "/" for commands...</p>',
    placeholder: 'Type something...',
    theme: 'light', // 'light' | 'dark' | 'sepia'
    enableToolbar: true,
    enableBubbleMenu: true,
    enableSlashCommands: true,
    onUpdate: ({ editor }) => {
      console.log('HTML content:', editor.getHTML());
    }
  });
</script>
```

---

## 📦 Installation via NPM

```bash
npm install @shamimsofte/universal-editor-core
```

### Usage in Modern JavaScript (ES Modules):

```javascript
import { createEditor } from '@shamimsofte/universal-editor-core';
import '@shamimsofte/universal-editor-core/styles.css';

const editor = createEditor({
  element: document.querySelector('#editor'),
  content: '<p>Welcome to Universal Editor</p>',
  enableToolbar: true,
  enableSlashCommands: true,
});
```

---

## ✨ Features

- ⚡ **Framework Independent**: Works in Vanilla JS, PHP, Vue 2, Vue 3, React, and Laravel.
- 🛡️ **Enterprise Security**: Built-in XSS sanitization preventing malicious scripts.
- 🎨 **Modern Interface**: Notion-style Slash Commands (`/`), Floating Bubble Menu, and customizable Toolbar.
- 🌗 **Theme Engine**: Built-in Light, Dark, and Sepia themes with full CSS custom property overrides.
- 📊 **Rich Content Support**: Tables with context menu, Code syntax highlighting (lowlight), YouTube/Vimeo embeds, images, task lists, and mentions (`@`).
- 🌍 **Multilingual & RTL**: Full Unicode support for complex scripts (Bengali, Arabic RTL, etc.).
- 💾 **Autosave & History**: Automatic draft recovery and snapshot version history.

---

## 📖 Full Documentation

Check out the complete [User Integration Guide](https://github.com/shamimSoftE/universal-editor/blob/master/USER_INTEGRATION_GUIDE.md) on GitHub for advanced configurations, backend API specifications, and Laravel integration.

---

## 📄 License

MIT © [shamimSoftE](https://github.com/shamimSoftE)
