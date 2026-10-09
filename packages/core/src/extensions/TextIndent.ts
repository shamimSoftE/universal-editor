import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textIndent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export interface TextIndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
  indentUnit: number;
}

export const TextIndent = Extension.create<TextIndentOptions>({
  name: 'textIndent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 8,
      indentUnit: 24,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const margin = element.style.marginLeft;
              if (!margin) return 0;
              const px = parseInt(margin, 10);
              return Math.round(px / 24) || 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent * 24}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current + 1,
                });
              }
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current - 1,
                });
              }
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});
