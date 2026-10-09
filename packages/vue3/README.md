# @shamimsofte/universal-editor-vue3

[![npm version](https://img.shields.io/npm/v/@shamimsofte/universal-editor-vue3.svg?style=flat-square)](https://www.npmjs.com/package/@shamimsofte/universal-editor-vue3)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Official Vue 3 component and reactive adapter for **Universal Rich Text Editor**. Compatible with Vue 3.3+, Vite, Nuxt 3, and Vue CLI.

---

## 📦 Installation

```bash
npm install @shamimsofte/universal-editor-vue3 @shamimsofte/universal-editor-core
```

---

## 🚀 Usage

### In a Vue 3 SFC (Composition API / `<script setup>`):

```vue
<template>
  <div class="editor-container">
    <RichTextEditor
      v-model="content"
      placeholder="Type something or press '/' for commands..."
      theme="light"
      :enable-toolbar="true"
      :enable-bubble-menu="true"
      :enable-slash-commands="true"
      :upload-url="'/api/editor/upload'"
      @update="onEditorUpdate"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RichTextEditor } from '@shamimsofte/universal-editor-vue3';
import '@shamimsofte/universal-editor-vue3/style.css';

const content = ref('<h1>Welcome!</h1><p>Start writing rich content in Vue 3.</p>');

function onEditorUpdate({ editor }) {
  console.log('Character count:', editor.getText().length);
}
</script>
```

---

## ⚙️ Component Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` / `v-model` | `string` | `''` | Two-way reactive HTML content binding |
| `placeholder` | `string` | `'Type something...'` | Placeholder text when empty |
| `theme` | `string` | `'light'` | Theme name (`'light'`, `'dark'`, `'sepia'`) |
| `enableToolbar` | `boolean` | `true` | Show top formatting toolbar |
| `enableBubbleMenu` | `boolean` | `true` | Show floating text selection bubble menu |
| `enableSlashCommands`| `boolean` | `true` | Enable Notion-style `/` slash commands |
| `readOnly` | `boolean` | `false` | Read-only viewer mode |
| `uploadUrl` | `string` | `null` | Backend endpoint for file/image uploads |

---

## 📄 License

MIT © [shamimSoftE](https://github.com/shamimSoftE)
