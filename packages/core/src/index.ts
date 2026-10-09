export * from './types';
export * from './UniversalEditor';
export * from './createEditor';
export * from './icons';
export * from './upload/types';
export * from './upload/Uploader';
export * from './extensions/CustomImage';
export * from './extensions/FileAttachment';
export * from './extensions/DropPasteHandler';
export * from './extensions/FontSize';
export * from './extensions/LineHeight';
export * from './extensions/TextIndent';
export * from './extensions/TextDirection';
export * from './extensions/CodeBlockExtension';
export * from './security/types';
export * from './security/ContentSanitizer';
export * from './ui/Toolbar';
export * from './ui/ToolbarButton';
export * from './ui/ToolbarDropdown';
export * from './ui/LinkDialog';
export * from './ui/ImageDialog';
export * from './ui/FileDialog';
export * from './ui/BubbleMenu';
export * from './ui/TableDialog';
export * from './ui/TableToolbar';
export * from './ui/TableContextMenu';
export * from './extensions/EmbedExtension';
export * from './ui/EmbedDialog';
export * from './slash-commands';
export * from './mentions';
export * from './autosave';
export * from './statistics';
export * from './viewer';
export * from './versioning/VersionHistoryManager';
export * from './collaboration';
export * from './ai';
export * from './theme';
export * from './accessibility';
export * from './mobile';
export * from './performance/LazyLoader';
export { Extension, Mark, Node } from '@tiptap/core';
export { EventEmitter } from '@universal-editor/utils';

import { UniversalEditor } from './UniversalEditor';
import { createEditor } from './createEditor';

// Browser global auto-registration for vanilla JS CDN/script tag usage
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.UniversalEditor = globalAny.UniversalEditor || {};
  globalAny.UniversalEditor.createEditor = createEditor;
  globalAny.UniversalEditor.UniversalEditor = UniversalEditor;
}
