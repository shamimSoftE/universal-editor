import { Node, mergeAttributes } from '@tiptap/core';
import { icons } from '../icons';
import { detectEmbedProvider } from '../embed/detectEmbed';
import type { EmbedAttributes, EmbedProvider } from '../embed/types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options: EmbedAttributes) => ReturnType;
    };
  }
}

export const EmbedExtension = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: element => element.getAttribute('data-src') || '',
        renderHTML: attributes => ({ 'data-src': attributes.src }),
      },
      provider: {
        default: 'iframe' as EmbedProvider,
        parseHTML: element => (element.getAttribute('data-provider') as EmbedProvider) || 'iframe',
        renderHTML: attributes => ({ 'data-provider': attributes.provider }),
      },
      originalUrl: {
        default: '',
        parseHTML: element => element.getAttribute('data-original-url') || '',
        renderHTML: attributes => ({ 'data-original-url': attributes.originalUrl }),
      },
      width: {
        default: '100%',
        parseHTML: element => element.style.maxWidth || element.getAttribute('width') || '100%',
      },
      height: {
        default: '420px',
        parseHTML: element => element.getAttribute('height') || '420px',
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title') || element.getAttribute('title') || '',
        renderHTML: attributes => ({ 'data-title': attributes.title || '' }),
      },
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({ 'data-alignment': attributes.alignment || 'center' }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="embed"]',
      },
      {
        tag: 'iframe[src]',
        getAttrs: el => {
          const element = el as HTMLIFrameElement;
          const src = element.getAttribute('src') || '';
          const detected = detectEmbedProvider(src);
          return {
            src,
            provider: detected.provider,
            originalUrl: src,
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || '420px',
            title: element.getAttribute('title') || '',
          };
        },
      },
      {
        tag: 'video[src]',
        getAttrs: el => {
          const element = el as HTMLVideoElement;
          const src = element.getAttribute('src') || '';
          return {
            src,
            provider: 'video',
            originalUrl: src,
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || 'auto',
            title: 'HTML5 Video',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const provider = HTMLAttributes['data-provider'] || HTMLAttributes.provider || 'iframe';
    const isVideo = provider === 'video';
    const alignment = HTMLAttributes['data-alignment'] || HTMLAttributes.alignment || 'center';
    const src = HTMLAttributes['data-src'] || HTMLAttributes.src || '';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'embed',
        class: `ue-embed-wrapper ue-embed-align-${alignment}`,
        style: `max-width: ${HTMLAttributes.width || '100%'};`,
      }),
      isVideo
        ? [
            'video',
            {
              controls: 'true',
              src: src,
              class: 'ue-embed-video',
              style: `width: 100%; height: ${HTMLAttributes.height || 'auto'}; border-radius: 8px;`,
            },
          ]
        : [
            'div',
            { class: 'ue-embed-responsive' },
            [
              'iframe',
              {
                src: src,
                title: HTMLAttributes['data-title'] || HTMLAttributes.title || 'Embedded content',
                frameborder: '0',
                allow:
                  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                allowfullscreen: 'true',
                class: 'ue-embed-iframe',
                style: `width: 100%; height: ${HTMLAttributes.height || '420px'}; border: none;`,
              },
            ],
          ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      const provider = node.attrs.provider || 'iframe';
      const isVideo = provider === 'video';
      const alignment = node.attrs.alignment || 'center';

      container.className = `ue-embed-wrapper ue-embed-align-${alignment}`;
      container.setAttribute('data-type', 'embed');
      container.setAttribute('data-provider', provider);
      container.style.maxWidth = node.attrs.width || '100%';

      // Header Bar
      const header = document.createElement('div');
      header.className = 'ue-embed-header';

      let providerIcon = icons.embed;
      let providerLabel = 'Media Embed';
      if (provider === 'youtube') {
        providerIcon = icons.youtube;
        providerLabel = 'YouTube';
      } else if (provider === 'vimeo') {
        providerIcon = icons.vimeo;
        providerLabel = 'Vimeo';
      } else if (provider === 'google-maps') {
        providerIcon = icons.map;
        providerLabel = 'Google Maps';
      } else if (provider === 'video') {
        providerIcon = icons.video;
        providerLabel = 'HTML5 Video';
      }

      const badge = document.createElement('div');
      badge.className = 'ue-embed-badge';
      badge.innerHTML = `
        <span class="ue-embed-badge-icon">${providerIcon}</span>
        <span class="ue-embed-badge-text">${providerLabel}</span>
      `;
      header.appendChild(badge);

      const actions = document.createElement('div');
      actions.className = 'ue-embed-actions';

      // External link button
      if (node.attrs.originalUrl) {
        const linkBtn = document.createElement('a');
        linkBtn.href = node.attrs.originalUrl;
        linkBtn.target = '_blank';
        linkBtn.rel = 'noopener noreferrer';
        linkBtn.className = 'ue-embed-action-btn';
        linkBtn.title = 'Open original link';
        linkBtn.innerHTML = icons.externalLink;
        actions.appendChild(linkBtn);
      }

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'ue-embed-action-btn ue-embed-delete-btn';
      deleteBtn.title = 'Remove embed';
      deleteBtn.innerHTML = icons.clearFormatting;
      deleteBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (typeof pos === 'number') {
            editor.view.dispatch(editor.state.tr.delete(pos, pos + 1));
          }
        }
      });
      actions.appendChild(deleteBtn);
      header.appendChild(actions);
      container.appendChild(header);

      // Frame / Player Content
      const frameContainer = document.createElement('div');
      frameContainer.className = 'ue-embed-frame-box';

      if (isVideo) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = node.attrs.src;
        video.className = 'ue-embed-video';
        video.style.width = '100%';
        video.style.height = node.attrs.height || 'auto';
        frameContainer.appendChild(video);
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = node.attrs.src;
        iframe.title = node.attrs.title || `${providerLabel} player`;
        iframe.frameBorder = '0';
        iframe.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.className = 'ue-embed-iframe';
        iframe.style.width = '100%';
        iframe.style.height = node.attrs.height || '420px';
        iframe.style.border = 'none';
        frameContainer.appendChild(iframe);
      }

      container.appendChild(frameContainer);

      return {
        dom: container,
      };
    };
  },

  addCommands() {
    return {
      setEmbed:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
