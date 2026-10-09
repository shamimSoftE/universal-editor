import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';

import { FontSize } from '../extensions/FontSize';
import { LineHeight } from '../extensions/LineHeight';
import { TextIndent } from '../extensions/TextIndent';
import { TextDirection } from '../extensions/TextDirection';
import { CustomImage } from '../extensions/CustomImage';
import { FileAttachment } from '../extensions/FileAttachment';
import { CustomCodeBlock } from '../extensions/CodeBlockExtension';
import { EmbedExtension } from '../extensions/EmbedExtension';
import { MentionExtension } from '../mentions/MentionExtension';

/**
 * Returns the complete array of extensions needed by generateHTML to deserialize
 * rich text document nodes into semantic HTML.
 */
export function getViewerExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Subscript,
    Superscript,
    FontFamily,
    FontSize,
    LineHeight,
    TextIndent,
    TextDirection,
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: 'ue-table',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    CustomImage,
    FileAttachment,
    CustomCodeBlock,
    EmbedExtension,
    MentionExtension,
  ];
}
