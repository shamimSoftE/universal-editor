import type { SlashCommandItem } from './types';
import { icons } from '../icons';

export const DEFAULT_SLASH_COMMANDS: SlashCommandItem[] = [
  // Basic Blocks
  {
    id: 'paragraph',
    title: 'Text',
    description: 'Just start writing with plain text',
    aliases: ['p', 'paragraph', 'text', 'normal'],
    group: 'Basic Blocks',
    icon: icons.paragraph,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    id: 'heading',
    title: 'Heading',
    description: 'Large section heading',
    aliases: ['heading', 'header'],
    group: 'Basic Blocks',
    icon: icons.h1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'Top-level section heading',
    aliases: ['h1', 'heading1', 'title'],
    group: 'Basic Blocks',
    icon: icons.h1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Medium section heading',
    aliases: ['h2', 'heading2', 'subtitle'],
    group: 'Basic Blocks',
    icon: icons.h2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Small section heading',
    aliases: ['h3', 'heading3'],
    group: 'Basic Blocks',
    icon: icons.h3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    id: 'bullet',
    title: 'Bullet List',
    description: 'Create a simple bulleted list',
    aliases: ['bullet', 'ul', 'list', 'unordered'],
    group: 'Basic Blocks',
    icon: icons.bulletList,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'numbered',
    title: 'Numbered List',
    description: 'Create a list with numbering',
    aliases: ['numbered', 'ol', 'number', 'ordered'],
    group: 'Basic Blocks',
    icon: icons.orderedList,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'checklist',
    title: 'Checklist / Task List',
    description: 'Track tasks with an interactive checklist',
    aliases: ['checklist', 'todo', 'task', 'checkbox'],
    group: 'Basic Blocks',
    icon: icons.taskList,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    id: 'quote',
    title: 'Blockquote',
    description: 'Capture a notable quotation or callout',
    aliases: ['quote', 'blockquote', 'cite'],
    group: 'Basic Blocks',
    icon: icons.blockquote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Visually separate sections with a horizontal rule',
    aliases: ['divider', 'hr', 'line', 'rule', 'separator'],
    group: 'Basic Blocks',
    icon: icons.hr,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },

  // Advanced Blocks
  {
    id: 'code',
    title: 'Code Block',
    description: 'Code snippet with syntax highlighting and language picker',
    aliases: ['code', 'codeblock', 'pre', 'snippet'],
    group: 'Advanced',
    icon: icons.codeBlock,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    id: 'table',
    title: 'Table Grid',
    description: 'Insert an interactive 3x3 table with header row',
    aliases: ['table', 'grid', 'matrix', 'spreadsheet'],
    group: 'Advanced',
    icon: icons.table,
    command: ({ editor, range, coreEditor }) => {
      editor.chain().focus().deleteRange(range).run();
      if (coreEditor) {
        coreEditor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
      } else {
        editor.chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      }
    },
  },

  // Rich Media
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or insert an image with caption',
    aliases: ['image', 'img', 'photo', 'picture', 'upload'],
    group: 'Rich Media',
    icon: icons.image,
    command: ({ editor, range, coreEditor }) => {
      editor.chain().focus().deleteRange(range).run();
      if (coreEditor) {
        coreEditor.openImageDialog?.();
      }
    },
  },
  {
    id: 'file',
    title: 'File Attachment',
    description: 'Upload or link a downloadable document or attachment',
    aliases: ['file', 'attachment', 'document', 'pdf', 'upload'],
    group: 'Rich Media',
    icon: icons.file,
    command: ({ editor, range, coreEditor }) => {
      editor.chain().focus().deleteRange(range).run();
      if (coreEditor) {
        coreEditor.openFileDialog?.();
      }
    },
  },
  {
    id: 'youtube',
    title: 'YouTube Video',
    description: 'Embed a responsive YouTube video with privacy mode',
    aliases: ['youtube', 'yt', 'embed'],
    group: 'Rich Media',
    icon: icons.youtube,
    command: ({ editor, range, coreEditor }) => {
      editor.chain().focus().deleteRange(range).run();
      if (coreEditor) {
        coreEditor.openEmbedDialog?.();
      }
    },
  },
  {
    id: 'video',
    title: 'Video Player',
    description: 'Embed an HTML5 video or media player',
    aliases: ['video', 'mp4', 'webm', 'movie'],
    group: 'Rich Media',
    icon: icons.video,
    command: ({ editor, range, coreEditor }) => {
      editor.chain().focus().deleteRange(range).run();
      if (coreEditor) {
        coreEditor.openEmbedDialog?.();
      }
    },
  },
];

/**
 * Filter slash commands based on a user search query
 */
export function filterSlashCommands(
  items: SlashCommandItem[],
  rawQuery: string,
  limit: number = 20
): SlashCommandItem[] {
  const query = (rawQuery || '').trim().toLowerCase().replace(/^\//, '');
  if (!query) {
    return items.slice(0, limit);
  }

  const matches = items.filter(item => {
    // 1. Direct ID match
    if (item.id.toLowerCase().includes(query)) return true;
    // 2. Title match
    if (item.title.toLowerCase().includes(query)) return true;
    // 3. Description match
    if (item.description.toLowerCase().includes(query)) return true;
    // 4. Aliases match
    if (item.aliases?.some(alias => alias.toLowerCase().includes(query))) return true;
    return false;
  });

  return matches.slice(0, limit);
}
