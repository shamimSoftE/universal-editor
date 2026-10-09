import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: 'ltr' | 'rtl' | 'auto') => ReturnType;
      setRtl: () => ReturnType;
      setLtr: () => ReturnType;
      toggleTextDirection: () => ReturnType;
    };
  }
}

export interface TextDirectionOptions {
  types: string[];
  defaultDirection?: 'ltr' | 'rtl' | 'auto' | null;
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: 'textDirection',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      defaultDirection: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: this.options.defaultDirection,
            parseHTML: element => element.getAttribute('dir') || null,
            renderHTML: attributes => {
              if (!attributes.dir) {
                return {};
              }
              return {
                dir: attributes.dir,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        direction =>
        ({ commands }) => {
          return this.options.types.every(type => commands.updateAttributes(type, { dir: direction }));
        },
      setRtl:
        () =>
        ({ commands }) => {
          return this.options.types.every(type => commands.updateAttributes(type, { dir: 'rtl' }));
        },
      setLtr:
        () =>
        ({ commands }) => {
          return this.options.types.every(type => commands.updateAttributes(type, { dir: 'ltr' }));
        },
      toggleTextDirection:
        () =>
        ({ editor, commands }) => {
          const currentDir =
            editor.getAttributes('paragraph').dir ||
            editor.getAttributes('heading').dir ||
            'ltr';
          const nextDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
          return this.options.types.every(type => commands.updateAttributes(type, { dir: nextDir }));
        },
    };
  },
});
