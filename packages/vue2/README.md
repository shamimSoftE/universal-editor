# @shamimsofte/universal-editor-vue2

[![npm version](https://img.shields.io/npm/v/@shamimsofte/universal-editor-vue2.svg?style=flat-square)](https://www.npmjs.com/package/@shamimsofte/universal-editor-vue2)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Official Vue 2 component adapter for **Universal Rich Text Editor**. Compatible with Vue 2.6+ and Vue 2.7.

---

## 📦 Installation

```bash
npm install @shamimsofte/universal-editor-vue2 @shamimsofte/universal-editor-core
```

---

## 🚀 Usage

```vue
<template>
  <div>
    <RichTextEditor
      v-model="content"
      placeholder="Vue 2 Editor..."
      theme="light"
      :enable-toolbar="true"
    />
  </div>
</template>

<script>
import { RichTextEditor } from '@shamimsofte/universal-editor-vue2';

export default {
  components: { RichTextEditor },
  data() {
    return {
      content: '<p>Universal Editor running inside Vue 2!</p>'
    };
  }
};
</script>
```

---

## 📄 License

MIT © [shamimSoftE](https://github.com/shamimSoftE)
