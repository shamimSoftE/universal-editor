import { renderViewerHTML } from '@universal-editor/core';

export const RichTextViewer = {
  name: 'RichTextViewer',
  props: {
    content: {
      type: [String, Object],
      default: '',
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'auto',
    },
    sanitize: {
      type: Boolean,
      default: true,
    },
    sanitizerConfig: {
      type: Object,
      default: undefined,
    },
    enableCopyCode: {
      type: Boolean,
      default: true,
    },
    enableImageLightbox: {
      type: Boolean,
      default: true,
    },
    responsiveEmbeds: {
      type: Boolean,
      default: true,
    },
    printOptimized: {
      type: Boolean,
      default: true,
    },
    wrapperClass: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      lightbox: {
        open: false,
        src: '',
        alt: '',
        caption: '',
      },
    };
  },
  computed: {
    renderedHtml(): string {
      const self = this as any;
      return renderViewerHTML(self.content, {
        sanitize: self.sanitize,
        sanitizerConfig: self.sanitizerConfig,
        enableCopyCode: self.enableCopyCode,
        responsiveEmbeds: self.responsiveEmbeds,
      });
    },
    themeClass(): string {
      const self = this as any;
      if (self.darkMode || self.theme === 'dark') return 'ue-viewer-dark';
      if (self.theme === 'light') return 'ue-viewer-light';
      return 'ue-viewer-auto';
    },
  },
  mounted() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (this as any).onKeydown);
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', (this as any).onKeydown);
    }
  },
  methods: {
    print() {
      if (typeof window !== 'undefined') {
        window.print();
      }
    },
    openLightbox(src: string, alt = '', caption = '') {
      const self = this as any;
      self.lightbox = {
        open: true,
        src,
        alt,
        caption,
      };
      self.$emit('lightbox-open', { src, alt, caption });
    },
    closeLightbox() {
      const self = this as any;
      self.lightbox.open = false;
      self.lightbox.src = '';
      self.$emit('lightbox-close');
    },
    onKeydown(e: KeyboardEvent) {
      const self = this as any;
      if (e.key === 'Escape' && self.lightbox.open) {
        self.closeLightbox();
      }
    },
    handleViewerClick(event: MouseEvent) {
      const self = this as any;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 1. Code copy button click
      const copyBtn = target.closest<HTMLButtonElement>(
        '.ue-code-copy-btn, [data-action="copy-code"]'
      );
      if (copyBtn) {
        event.preventDefault();
        event.stopPropagation();

        const block =
          copyBtn.closest<HTMLElement>('.ue-code-block-viewer') ||
          copyBtn.closest<HTMLElement>('pre');
        const pre =
          block?.querySelector('pre') || (block?.tagName === 'PRE' ? block : null);
        const codeEl = pre?.querySelector('code') || pre;
        const text = codeEl?.textContent || '';
        const language = block?.getAttribute('data-language') || undefined;

        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }

        copyBtn.classList.add('copied');
        const labelSpan = copyBtn.querySelector('.ue-copy-text');
        const prevText = labelSpan ? labelSpan.textContent : copyBtn.textContent;
        if (labelSpan) {
          labelSpan.textContent = '✓ Copied!';
        } else {
          copyBtn.textContent = '✓ Copied!';
        }

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (labelSpan) {
            labelSpan.textContent = prevText || 'Copy';
          } else {
            copyBtn.textContent = prevText || 'Copy';
          }
        }, 2000);

        self.$emit('copy-code', { code: text, language });
        return;
      }

      // 2. Image click (lightbox)
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        const figure = img.closest('figure');
        const captionEl = figure?.querySelector('figcaption');
        const captionText = captionEl?.textContent || img.title || img.alt || '';

        self.$emit('image-click', {
          src: img.src,
          alt: img.alt,
          title: img.title,
          event,
        });

        if (self.enableImageLightbox !== false) {
          self.openLightbox(img.src, img.alt, captionText);
        }
        return;
      }

      // 3. Link click
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (link) {
        self.$emit('link-click', {
          href: link.getAttribute('href') || link.href,
          target: link.getAttribute('target') || undefined,
          event,
        });
      }
    },
  },
  render(h: any) {
    const self = this as any;

    const articleNode = h('article', {
      class: ['ue-viewer', 'prose-content', self.themeClass],
      domProps: {
        innerHTML: self.renderedHtml,
      },
      on: {
        click: self.handleViewerClick,
      },
    });

    const children = [articleNode];

    // Lightbox modal
    if (self.lightbox.open) {
      const closeBtn = h(
        'button',
        {
          class: 'ue-viewer-lightbox-close',
          attrs: { type: 'button', title: 'Close image preview (Esc)' },
          on: { click: self.closeLightbox },
        },
        '×'
      );

      const imgNode = h('img', {
        class: 'ue-viewer-lightbox-img',
        attrs: {
          src: self.lightbox.src,
          alt: self.lightbox.alt || 'Full-size preview',
        },
      });

      const contentChildren = [closeBtn, imgNode];
      if (self.lightbox.caption) {
        contentChildren.push(
          h('div', { class: 'ue-viewer-lightbox-caption' }, self.lightbox.caption)
        );
      }

      const modalContent = h('div', { class: 'ue-viewer-lightbox-content' }, contentChildren);

      const lightboxModal = h(
        'div',
        {
          class: 'ue-viewer-lightbox',
          on: {
            click: (e: MouseEvent) => {
              if (e.target === e.currentTarget) {
                self.closeLightbox();
              }
            },
          },
        },
        [modalContent]
      );

      children.push(lightboxModal);
    }

    return h(
      'div',
      {
        class: ['ue-viewer-wrapper', self.themeClass, self.wrapperClass],
      },
      children
    );
  },
};
