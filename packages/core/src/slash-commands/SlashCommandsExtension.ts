import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import type { SlashCommandItem, SlashCommandsConfig } from './types';
import { DEFAULT_SLASH_COMMANDS, filterSlashCommands } from './defaultCommands';
import { SlashMenuRenderer } from './SlashMenuRenderer';
import type { UniversalEditor } from '../UniversalEditor';

export const SlashCommandsPluginKey = new PluginKey('slashCommandsSuggestion');

export interface SlashCommandsOptions extends SlashCommandsConfig {
  coreEditor?: UniversalEditor;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slashCommands: {
      /**
       * Register a new slash command
       */
      registerSlashCommand: (item: SlashCommandItem) => ReturnType;
    };
  }
}

export const SlashCommandsExtension = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return {
      enabled: true,
      commands: DEFAULT_SLASH_COMMANDS,
      suggestionChar: '/',
      maxSuggestions: 20,
    };
  },

  addProseMirrorPlugins() {
    if (this.options.enabled === false) {
      return [];
    }

    let renderer: SlashMenuRenderer | null = null;
    const coreEditor = this.options.coreEditor;

    const suggestionOptions: SuggestionOptions<SlashCommandItem> = {
      pluginKey: SlashCommandsPluginKey,
      editor: this.editor,
      char: this.options.suggestionChar || '/',
      startOfLine: false,
      items: ({ query }) => {
        const commandList = this.options.commands || DEFAULT_SLASH_COMMANDS;
        return filterSlashCommands(commandList, query, this.options.maxSuggestions || 20);
      },
      command: ({ editor, range, props }) => {
        props.command({
          editor,
          range,
          coreEditor,
        });
        if (this.options.onCommandExecuted) {
          this.options.onCommandExecuted(props);
        }
      },
      render: () => {
        return {
          onStart: props => {
            if (!renderer) {
              renderer = new SlashMenuRenderer(coreEditor);
            }
            renderer.onStart(props);
          },
          onUpdate: props => {
            renderer?.onUpdate(props);
          },
          onKeyDown: props => {
            if (props.event.key === 'Escape') {
              renderer?.hide();
              return true;
            }
            return renderer?.onKeyDown(props) || false;
          },
          onExit: () => {
            renderer?.onExit();
          },
        };
      },
    };

    return [Suggestion(suggestionOptions)];
  },

  addCommands() {
    return {
      registerSlashCommand:
        (item: SlashCommandItem) =>
        () => {
          if (!this.options.commands) {
            this.options.commands = [...DEFAULT_SLASH_COMMANDS];
          }
          this.options.commands.push(item);
          return true;
        },
    };
  },
});
