# Universal Rich Text Editor — Complete API Reference

This document provides exhaustive type definitions, signatures, and descriptions for all exported classes, components, options, and APIs across the Universal Rich Text Editor monorepo.

---

## 1. Core API (`@universal-editor/core`)

### `createEditor(options?: Partial<EditorOptions>): UniversalEditor`
Factory function to instantiate and initialize a new `UniversalEditor` instance.

```typescript
import { createEditor } from '@universal-editor/core';

const editor = createEditor({
  element: '#editor',
  content: '<p>Welcome</p>',
  editable: true,
});
```

### `UniversalEditor`
The core framework-independent class wrapping ProseMirror and Tiptap.

#### Properties
- `readonly isReady: boolean`: Indicates if the editor DOM and ProseMirror view are initialized.
- `readonly options: EditorOptions`: The resolved editor options.

#### Content Methods
- `getHTML(): string`: Returns document HTML.
- `getJSON(): Record<string, any>`: Returns document as ProseMirror JSON abstract syntax tree.
- `getText(): string`: Returns document plain text with newline separators.
- `getSanitizedHTML(): string`: Returns XSS-purified HTML via `ContentSanitizer`.
- `setContent(content: string | Record<string, any>, emitUpdate?: boolean): void`: Replaces document content.
- `clearContent(emitUpdate?: boolean): void`: Empties document content.

#### Formatting & Commands
- `toggleBold(): void`
- `toggleItalic(): void`
- `toggleUnderline(): void`
- `toggleStrike(): void`
- `toggleCode(): void`
- `setParagraph(): void`
- `setHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void`
- `toggleBulletList(): void`
- `toggleOrderedList(): void`
- `toggleTaskList(): void`
- `toggleBlockquote(): void`
- `setHorizontalRule(): void`
- `setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify'): void`
- `setLink(options: { href: string; target?: string; rel?: string }): void`
- `unsetLink(): void`
- `insertImage(options: { src: string; alt?: string; title?: string; width?: string; align?: 'left' | 'center' | 'right' }): void`
- `insertTable(options: { rows: number; cols: number; withHeaderRow?: boolean }): void`
- `setCodeBlock(options?: { language?: string }): void`
- `insertEmbed(options: { url: string; provider?: string; caption?: string }): void`

#### History & State Methods
- `undo(): void`
- `redo(): void`
- `canUndo(): boolean`
- `canRedo(): boolean`
- `focus(position?: 'start' | 'end' | 'all' | number): void`
- `blur(): void`
- `destroy(): void`

#### Event Subscription
- `on(event: string, handler: Function): void`: Adds event listener.
- `off(event: string, handler: Function): void`: Removes event listener.
- `emit(event: string, payload?: any): void`: Dispatches event to listeners.

---

## 2. Vue 3 Adapter (`@universal-editor/vue3`)

### `<RichTextEditor />` Component

#### Props
```typescript
interface RichTextEditorProps {
  modelValue?: string | Record<string, any>;
  content?: string | Record<string, any>;
  placeholder?: string;
  editable?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  toolbar?: (string | ToolbarButtonConfig)[];
  outputFormat?: 'html' | 'json' | 'text';
  autofocus?: boolean | 'start' | 'end' | 'all';
  characterLimit?: number;
  wordLimit?: number;
  darkMode?: boolean;
  accessibility?: boolean | AccessibilityConfig;
  mobile?: boolean | MobileConfig;
  uploadEndpoint?: string;
  maxFileSize?: number;
}
```

#### Emits
- `update:modelValue`: `(value: string | Record<string, any>) => void`
- `change`: `(value: string | Record<string, any>) => void`
- `focus`: `(event: FocusEvent) => void`
- `blur`: `(event: FocusEvent) => void`
- `ready`: `(editor: UniversalEditor) => void`
- `imageUpload`: `(result: UploadResult) => void`
- `fileUpload`: `(result: UploadResult) => void`
- `error`: `(error: Error) => void`

#### Exposed Instance Methods
Available via `ref`:
- `getEditor(): UniversalEditor | null`
- `getHTML(): string`
- `getJSON(): Record<string, any>`
- `getText(): string`
- `setContent(content: string | Record<string, any>): void`
- `focus(): void`
- `blur(): void`
- `undo(): void`
- `redo(): void`
- `announce(message: string, options?: AnnounceOptions): void`

---

## 3. Vue 2 Adapter (`@universal-editor/vue2`)

Provides equivalent component props, slots, and v-model bindings matching the Vue 3 component interface for seamless interoperability across legacy Vue 2 applications.

---

## 4. Laravel Package (`laravel-universal-editor`)

### Facade: `Editor`
```php
use UniversalEditor\Laravel\Facades\Editor;

// Sanitize HTML string
$safe = Editor::sanitize($untrustedHtml);

// Store uploaded file
$media = Editor::upload($uploadedFile, $options);
```

### Endpoints
- `POST /editor/upload`: Handles image and document binary uploads.
- `DELETE /editor/media/{id}`: Deletes stored media attachment.
- `GET /editor/media`: Lists media files.
- `POST /editor/autosave`: Persists periodic document draft payloads.
- `GET /editor/documents`: Lists documents with pagination.
- `POST /editor/documents`: Stores new document.
- `GET /editor/documents/{id}`: Fetches document by ID.
- `PUT /editor/documents/{id}`: Updates existing document.
- `DELETE /editor/documents/{id}`: Soft/hard deletes document.
