import { Node, mergeAttributes } from '@tiptap/core';
import type { FileAttachmentAttributes } from '../upload/types';
import { formatBytes } from '../upload/Uploader';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      insertFileAttachment: (options: FileAttachmentAttributes) => ReturnType;
    };
  }
}

export function getFileCategoryIcon(typeOrName: string): string {
  const ext = (typeOrName || '').toLowerCase();
  if (ext.includes('pdf')) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`;
  }
  if (ext.includes('doc') || ext.includes('word')) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  }
  if (ext.includes('xls') || ext.includes('sheet') || ext.includes('csv')) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2v4H8z"/><path d="M14 13h2v4h-2z"/></svg>`;
  }
  if (
    ext.includes('zip') ||
    ext.includes('compressed') ||
    ext.includes('tar') ||
    ext.includes('rar')
  ) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/></svg>`;
  }
  // Default file icon
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}

export const FileAttachment = Node.create({
  name: 'fileAttachment',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      name: {
        default: 'Attachment',
      },
      size: {
        default: 0,
      },
      type: {
        default: 'file',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-attachment"]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            url: el.getAttribute('data-url'),
            name: el.getAttribute('data-name'),
            size: Number(el.getAttribute('data-size') || 0),
            type: el.getAttribute('data-file-type') || 'file',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { url, name, size, type } = HTMLAttributes;
    const formattedSize = typeof size === 'number' ? formatBytes(size) : size;

    return [
      'div',
      mergeAttributes({
        class: 'ue-file-card',
        'data-type': 'file-attachment',
        'data-url': url,
        'data-name': name,
        'data-size': size,
        'data-file-type': type,
      }),
      ['div', { class: 'ue-file-icon' }],
      [
        'div',
        { class: 'ue-file-info' },
        ['div', { class: 'ue-file-name' }, name],
        ['div', { class: 'ue-file-size' }, formattedSize],
      ],
      [
        'a',
        {
          class: 'ue-file-download',
          href: url,
          download: name,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        'Download',
      ],
    ];
  },

  addCommands() {
    return {
      insertFileAttachment:
        (options: FileAttachmentAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
