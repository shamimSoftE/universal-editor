import {
  Mention as TiptapMention,
  type MentionOptions as TiptapMentionOptions,
} from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import type { MentionConfig, MentionUser } from './types';
import { DEFAULT_MENTION_USERS, createDefaultMentionProvider } from './defaultUsers';
import { MentionListRenderer } from './MentionListRenderer';
import type { UniversalEditor } from '../UniversalEditor';

export const MentionPluginKey = new PluginKey('mentionSuggestion');

export interface MentionOptions extends TiptapMentionOptions, MentionConfig {
  coreEditor?: UniversalEditor;
}

export const MentionExtension = TiptapMention.extend<MentionOptions>({
  name: 'mention',

  addOptions() {
    return {
      ...this.parent?.(),
      enabled: true,
      triggerChar: '@',
      defaultUsers: DEFAULT_MENTION_USERS,
      maxSuggestions: 10,
      suggestion: {
        pluginKey: MentionPluginKey,
        char: '@',
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: {
                  id: props.id,
                  label: props.name || props.username,
                  username: props.username,
                  avatar: props.avatar,
                  role: props.role,
                },
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return { 'data-label': attributes.label };
        },
      },
      username: {
        default: null,
        parseHTML: element => element.getAttribute('data-username'),
        renderHTML: attributes => {
          if (!attributes.username) {
            return {};
          }
          return { 'data-username': attributes.username };
        },
      },
      avatar: {
        default: null,
        parseHTML: element => element.getAttribute('data-avatar'),
        renderHTML: attributes => {
          if (!attributes.avatar) {
            return {};
          }
          return { 'data-avatar': attributes.avatar };
        },
      },
      role: {
        default: null,
        parseHTML: element => element.getAttribute('data-role'),
        renderHTML: attributes => {
          if (!attributes.role) {
            return {};
          }
          return { 'data-role': attributes.role };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.label || node.attrs.username || node.attrs.id;
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'mention',
          class: 'ue-mention',
        },
        HTMLAttributes
      ),
      `@${label}`,
    ];
  },

  addProseMirrorPlugins() {
    if (this.options.enabled === false) {
      return [];
    }

    return [
      ...(this.parent?.() || []).map(plugin => {
        return plugin;
      }),
    ];
  },
}).configure({
  suggestion: {
    pluginKey: MentionPluginKey,
    char: '@',
    items: async ({ query, editor }: { query: string; editor: any }) => {
      const extension = editor.extensionManager.extensions.find((e: any) => e.name === 'mention');
      const opts = (extension?.options || {}) as MentionOptions;
      const provider =
        opts.provider || createDefaultMentionProvider(opts.defaultUsers || DEFAULT_MENTION_USERS);
      const results = await provider(query);
      return (results || []).slice(0, opts.maxSuggestions || 10);
    },
    render: () => {
      let renderer: MentionListRenderer | null = null;
      return {
        onStart: (props: any) => {
          const extension = props.editor.extensionManager.extensions.find(
            (e: any) => e.name === 'mention'
          );
          const opts = (extension?.options || {}) as MentionOptions;
          if (!renderer) {
            renderer = new MentionListRenderer(opts.coreEditor);
          }
          renderer.onStart(props);
        },
        onUpdate: (props: any) => {
          renderer?.onUpdate(props);
        },
        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            renderer?.hide();
            return true;
          }
          return renderer?.onKeyDown(props) || false;
        },
        onExit: () => {
          renderer?.onExit();
          renderer?.destroy();
          renderer = null;
        },
      };
    },
    command: ({ editor, range, props }: { editor: any; range: any; props: MentionUser }) => {
      const extension = editor.extensionManager.extensions.find((e: any) => e.name === 'mention');
      const opts = (extension?.options || {}) as MentionOptions;

      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: {
              id: props.id,
              label: props.name || props.username,
              username: props.username,
              avatar: props.avatar,
              role: props.role,
            },
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run();

      if (opts.onMentionSelected) {
        opts.onMentionSelected(props);
      }
      if (opts.coreEditor) {
        opts.coreEditor.emit('mention', { user: props });
      }
    },
  },
});
