import Image from '@tiptap/extension-image';
import type { ImageAttributes } from '../upload/types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: ImageAttributes) => ReturnType;
      updateImage: (options: Partial<ImageAttributes>) => ReturnType;
    };
  }
}

export const CustomImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: '100%',
      },
      alignment: {
        default: 'center',
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.ue-image-figure',
        getAttrs: element => {
          const figure = element as HTMLElement;
          const img = figure.querySelector('img');
          const figcaption = figure.querySelector('figcaption');
          if (!img) return false;

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: figure.getAttribute('data-width') || img.style.width || '100%',
            alignment: figure.getAttribute('data-alignment') || 'center',
            caption: figcaption ? figcaption.textContent : null,
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: element => {
          const img = element as HTMLElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.style.width || '100%',
            alignment: 'center',
            caption: null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { src, alt, title, width, alignment, caption } = node.attrs;
    const alignClass = `ue-image-align-${alignment || 'center'}`;
    const widthStyle = width
      ? `width: ${typeof width === 'number' ? `${width}px` : width}; max-width: 100%;`
      : 'max-width: 100%;';

    const figureAttrs = {
      class: `ue-image-figure ${alignClass}`,
      style: widthStyle,
      'data-alignment': alignment || 'center',
      'data-width': width || '100%',
    };

    const imgAttrs: Record<string, any> = { src };
    if (alt) imgAttrs.alt = alt;
    if (title) imgAttrs.title = title;

    if (caption) {
      return [
        'figure',
        figureAttrs,
        ['img', imgAttrs],
        ['figcaption', { class: 'ue-image-caption' }, caption],
      ];
    }

    return ['figure', figureAttrs, ['img', imgAttrs]];
  },

  addCommands() {
    return {
      setImage:
        (options: ImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      updateImage:
        (options: Partial<ImageAttributes>) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
    };
  },
});
