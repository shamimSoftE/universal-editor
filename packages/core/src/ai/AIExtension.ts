import { Extension } from '@tiptap/core';
import { AIAssistantManager } from './AIAssistantManager';
import { AIProvider, AIOptions, AIActionType } from './types';
import { MockAIProvider } from './MockAIProvider';

export interface AIExtensionOptions {
  provider?: AIProvider;
  defaultTone?: string;
  defaultLanguage?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiExtension: {
      /**
       * Run an AI action on the current selection or document
       */
      executeAIAction: (
        action: AIActionType,
        options?: AIOptions,
        insertMode?: 'replace' | 'insertBelow'
      ) => ReturnType;
      aiImprove: () => ReturnType;
      aiFixGrammar: () => ReturnType;
      aiRewrite: (instructionOrTone?: string) => ReturnType;
      aiMakeShorter: () => ReturnType;
      aiMakeLonger: () => ReturnType;
      aiSummarize: () => ReturnType;
      aiTranslate: (targetLanguage: string) => ReturnType;
      aiGenerateTitle: () => ReturnType;
      aiGenerateDescription: () => ReturnType;
    };
  }
}

/**
 * AIExtension
 *
 * Optional Tiptap extension adding AI-assisted writing, rewriting, translation,
 * and text transformations to the rich text editor.
 */
export const AIExtension = Extension.create<AIExtensionOptions>({
  name: 'aiExtension',

  addOptions() {
    return {
      provider: new MockAIProvider(),
      defaultTone: 'professional',
      defaultLanguage: 'Spanish',
    };
  },

  addStorage() {
    return {
      manager: new AIAssistantManager({
        provider: this.options.provider,
        defaultTone: this.options.defaultTone,
        defaultLanguage: this.options.defaultLanguage,
      }),
      lastResult: null as any,
    };
  },

  addCommands() {
    return {
      executeAIAction:
        (action: AIActionType, options: AIOptions = {}, insertMode: 'replace' | 'insertBelow' = 'replace') =>
        ({ editor, state, dispatch: _dispatch }) => {
          const { from, to } = state.selection;
          const selectedText = state.doc.textBetween(from, to, ' ').trim();
          const targetText = selectedText || state.doc.textBetween(0, state.doc.content.size, ' ').trim();

          if (!targetText && action !== 'custom') {
            return false;
          }

          const manager: AIAssistantManager = this.storage.manager;

          // Asynchronously execute action
          manager
            .executeAction(action, targetText, options)
            .then((res) => {
              this.storage.lastResult = res;

              if (insertMode === 'replace' && from !== to) {
                editor.chain().focus().deleteRange({ from, to }).insertContent(res.resultText).run();
              } else if (insertMode === 'replace' && from === to) {
                // If no selection, insert at current cursor
                editor.chain().focus().insertContent(res.resultText).run();
              } else {
                // Insert below
                editor.chain().focus().setTextSelection(Math.max(from, to)).insertContent(`\n${res.resultText}\n`).run();
              }
            })
            .catch((err) => {
              console.error('[AIExtension] AI execution failed:', err);
            });

          return true;
        },

      aiImprove:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('improve');
        },

      aiFixGrammar:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('grammar');
        },

      aiRewrite:
        (instructionOrTone?: string) =>
        ({ commands }) => {
          return commands.executeAIAction('rewrite', { tone: instructionOrTone as any });
        },

      aiMakeShorter:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('shorter');
        },

      aiMakeLonger:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('longer');
        },

      aiSummarize:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('summarize', {}, 'insertBelow');
        },

      aiTranslate:
        (targetLanguage: string) =>
        ({ commands }) => {
          return commands.executeAIAction('translate', { targetLanguage }, 'replace');
        },

      aiGenerateTitle:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('title', {}, 'insertBelow');
        },

      aiGenerateDescription:
        () =>
        ({ commands }) => {
          return commands.executeAIAction('description', {}, 'insertBelow');
        },
    };
  },
});
