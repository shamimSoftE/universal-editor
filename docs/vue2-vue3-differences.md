# Universal Rich Text Editor — Vue 2 vs Vue 3 API Differences

This document details the architectural differences, feature parity, and migration guidance between `@universal-editor/vue3` and `@universal-editor/vue2`.

---

## 1. Overview & Architecture

Both `@universal-editor/vue3` and `@universal-editor/vue2` are thin, high-performance adapters wrapping the framework-independent **`@universal-editor/core`** engine. The underlying ProseMirror editor, Tiptap extensions, DOM sanitization, slash commands, mentions, autosave, media embeds, and statistics operate identically across both Vue versions.

---

## 2. API Differences & Compatibility Table

| Feature | Vue 3 (`@universal-editor/vue3`) | Vue 2 (`@universal-editor/vue2`) | Notes / Compatibility |
| :--- | :--- | :--- | :--- |
| **Package Import** | `@universal-editor/vue3` | `@universal-editor/vue2` | Separate namespaced packages |
| **`v-model` Prop** | `:modelValue` | `:value` (or `:modelValue`) | Vue 2 supports both `:value` and `:modelValue` |
| **`v-model` Event** | `@update:modelValue` | `@input` (and `@update:modelValue`) | Vue 2 emits both `@input` and `@update:modelValue` |
| **Component Tag Names** | `<RichTextEditor />`, `<RichTextViewer />` | `<RichTextEditor />`, `<rich-text-editor />`, `<RichTextViewer />`, `<rich-text-viewer />` | Vue 2 registers both PascalCase and kebab-case |
| **Plugin Installation** | `app.use(UniversalEditorPlugin)` | `Vue.use(UniversalEditorVue2Plugin)` | Follows framework idioms |
| **Template Ref Access** | `const editorRef = ref<InstanceType<typeof RichTextEditor>>()` | `this.$refs.editor` | Same public method signatures |
| **Lifecycle Destruction** | `beforeUnmount()` | `beforeDestroy()` | Automatically mapped |
| **Slots Syntax** | `<template #status>` / `<template #stats>` | `<template slot="status">` or `v-slot:status` | Native slot mechanisms supported |

---

## 3. Code Examples

### Vue 3 Implementation
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RichTextEditor, RichTextViewer } from '@universal-editor/vue3';

const content = ref('<p>Hello World</p>');
const editorRef = ref();
</script>

<template>
  <div>
    <!-- Editor -->
    <RichTextEditor
      ref="editorRef"
      v-model="content"
      :dark-mode="true"
      :word-limit="500"
    />

    <!-- Viewer -->
    <RichTextViewer
      :content="content"
      :dark-mode="true"
    />
  </div>
</template>
```

### Vue 2 Implementation (Vue 2.6+ / 2.7)
```vue
<template>
  <div>
    <!-- Editor (Supports both v-model and kebab-case tag) -->
    <rich-text-editor
      ref="editor"
      v-model="content"
      :dark-mode="true"
      :word-limit="500"
      @ready="onReady"
    />

    <!-- Viewer -->
    <rich-text-viewer
      :content="content"
      :dark-mode="true"
    />
  </div>
</template>

<script>
import { RichTextEditor, RichTextViewer } from '@universal-editor/vue2';

export default {
  components: {
    RichTextEditor,
    RichTextViewer,
  },
  data() {
    return {
      content: '<p>Hello World</p>',
    };
  },
  methods: {
    onReady({ editor }) {
      console.log('Vue 2 editor ready:', editor);
    },
    getContent() {
      return this.$refs.editor.getHTML();
    },
  },
};
</script>
```

---

## 4. Public Method Parity

All public methods available on Vue 3's `<RichTextEditor />` are exposed identically on Vue 2's `<rich-text-editor>` instance:
- `getHTML(): string`
- `getJSON(): Record<string, any>`
- `getText(): string`
- `getSanitizedHTML(): string`
- `setContent(content, emitUpdate?): void`
- `clearContent(emitUpdate?): void`
- `focus(position?): void`
- `blur(): void`
- `undo(): boolean`
- `redo(): boolean`
- `setEditable(editable: boolean): void`
- `insertImage(attrs): void`
- `insertFile(attrs): void`
- `insertEmbed(attrs): void`
- `insertMention(user): void`
- `saveDraft(force?): void`
- `restoreDraft(): boolean`
- `clearDraft(): void`
- `getWordCount(): number`
- `getCharacterCount(excludeSpaces?): number`
- `getParagraphCount(): number`
- `getStatistics(): EditorStatistics`
- `setLimits(limits): void`
- `getEditorInstance(): UniversalEditor | null`
