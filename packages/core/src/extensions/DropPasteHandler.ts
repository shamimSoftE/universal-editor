import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { UniversalEditor } from '../UniversalEditor';
import { ContentSanitizer } from '../security/ContentSanitizer';

export const DropPasteHandler = Extension.create<{ editorInstance?: UniversalEditor }>({
  name: 'dropPasteHandler',

  addOptions() {
    return {
      editorInstance: undefined,
    };
  },

  addProseMirrorPlugins() {
    const editor = this.options.editorInstance;

    return [
      new Plugin({
        key: new PluginKey('dropPasteHandler'),
        props: {
          handleDrop(_view, event: DragEvent) {
            if (!editor) return false;
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;

            const file = files[0];
            event.preventDefault();

            if (file.type.startsWith('image/')) {
              editor.uploadAndInsertImage(file).catch(err => {
                console.error('Failed to upload dropped image:', err);
              });
            } else {
              editor.uploadAndInsertFile(file).catch(err => {
                console.error('Failed to upload dropped file:', err);
              });
            }
            return true;
          },

          handlePaste(_view, event: ClipboardEvent) {
            if (!editor) return false;
            const files = event.clipboardData?.files;
            if (!files || files.length === 0) return false;

            const file = files[0];
            event.preventDefault();

            if (file.type.startsWith('image/')) {
              editor.uploadAndInsertImage(file).catch(err => {
                console.error('Failed to upload pasted image:', err);
              });
            } else {
              editor.uploadAndInsertFile(file).catch(err => {
                console.error('Failed to upload pasted file:', err);
              });
            }
            return true;
          },

          transformPastedHTML(html: string) {
            return ContentSanitizer.sanitize(html);
          },
        },
      }),
    ];
  },
});
