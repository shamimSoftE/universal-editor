import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorStatistics, StatisticsConfig, LimitEventPayload } from './types';

export const WordCounterPluginKey = new PluginKey('wordCounterPlugin');

export function countWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/\S+/g);
  return matches ? matches.length : 0;
}

export function countCharacters(text: string, excludeSpaces = false): number {
  if (!text) return 0;
  if (excludeSpaces) {
    return text.replace(/\s/g, '').length;
  }
  return text.length;
}

export function countParagraphs(doc: any): number {
  if (!doc) return 0;
  if (typeof doc === 'string') {
    const trimmed = doc.trim();
    if (!trimmed) return 0;
    const pMatches = trimmed.match(/<p\b[^>]*>/gi);
    if (pMatches) return pMatches.length;
    return trimmed.split(/\n\s*\n/).filter(Boolean).length || 1;
  }
  let count = 0;
  if (typeof doc.forEach === 'function') {
    doc.forEach((node: any) => {
      if (node.isBlock) {
        count++;
      }
    });
    return Math.max(count, 1);
  }
  return 1;
}

export function calculateReadingTime(words: number, wpm = 200): { minutes: number; text: string } {
  if (words <= 0) {
    return { minutes: 0, text: '0 min read' };
  }
  const minutes = Math.ceil(words / wpm);
  const text = minutes <= 1 ? '< 1 min read' : `${minutes} min read`;
  return { minutes, text };
}

export interface WordCounterOptions extends StatisticsConfig {
  onUpdate?: (stats: EditorStatistics) => void;
  onLimitWarning?: (payload: LimitEventPayload) => void;
  onLimitExceeded?: (payload: LimitEventPayload) => void;
}

export interface WordCounterStorage {
  getStatistics: (node?: any) => EditorStatistics;
  words: (node?: any) => number;
  characters: (excludeSpaces?: boolean, node?: any) => number;
  paragraphs: (node?: any) => number;
  setLimits: (limits: StatisticsConfig) => void;
  config: StatisticsConfig;
}

export const WordCounterExtension = Extension.create<WordCounterOptions, WordCounterStorage>({
  name: 'wordCounter',

  addOptions() {
    return {
      maxCharacters: undefined,
      characterLimit: undefined,
      maxWords: undefined,
      wordLimit: undefined,
      hardLimit: false,
      blockOnLimit: false,
      warningThreshold: 0.9,
      wordsPerMinute: 200,
    };
  },

  addStorage() {
    return {
      config: { ...this.options },
      getStatistics: () => ({} as any),
      words: () => 0,
      characters: () => 0,
      paragraphs: () => 1,
      setLimits: () => {},
    };
  },

  onBeforeCreate() {
    this.storage.words = (node?: any) => {
      const targetNode = node || this.editor.state.doc;
      const text = targetNode ? targetNode.textBetween(0, targetNode.content.size, ' ', ' ') : '';
      return countWords(text);
    };

    this.storage.characters = (excludeSpaces = false, node?: any) => {
      const targetNode = node || this.editor.state.doc;
      const text = targetNode ? targetNode.textBetween(0, targetNode.content.size, undefined, ' ') : '';
      return countCharacters(text, excludeSpaces);
    };

    this.storage.paragraphs = (node?: any) => {
      const targetNode = node || this.editor.state.doc;
      return countParagraphs(targetNode);
    };

    this.storage.setLimits = (limits: StatisticsConfig) => {
      const newMaxChars =
        'maxCharacters' in limits
          ? limits.maxCharacters
          : 'characterLimit' in limits
            ? limits.characterLimit
            : this.storage.config.maxCharacters;

      const newMaxWords =
        'maxWords' in limits
          ? limits.maxWords
          : 'wordLimit' in limits
            ? limits.wordLimit
            : this.storage.config.maxWords;

      const newHardLimit =
        'hardLimit' in limits
          ? limits.hardLimit
          : 'blockOnLimit' in limits
            ? limits.blockOnLimit
            : this.storage.config.hardLimit;

      this.storage.config = {
        ...this.storage.config,
        ...limits,
        maxCharacters: newMaxChars,
        characterLimit: newMaxChars,
        maxWords: newMaxWords,
        wordLimit: newMaxWords,
        hardLimit: newHardLimit,
      };
    };

    this.storage.getStatistics = (node?: any) => {
      const targetNode = node || this.editor.state.doc;
      const text = targetNode ? targetNode.textBetween(0, targetNode.content.size, ' ', ' ') : '';
      const words = countWords(text);
      const characters = countCharacters(text, false);
      const charactersExcludingSpaces = countCharacters(text, true);
      const paragraphs = countParagraphs(targetNode);
      const config = this.storage.config;
      const wpm = config.wordsPerMinute || 200;
      const reading = calculateReadingTime(words, wpm);

      const charLimit = config.maxCharacters ?? config.characterLimit;
      const wordLimit = config.maxWords ?? config.wordLimit;
      const threshold = config.warningThreshold ?? 0.9;

      const isCharacterLimitApproaching =
        charLimit !== undefined && charLimit > 0
          ? characters >= charLimit * threshold && characters <= charLimit
          : false;
      const isCharacterLimitExceeded =
        charLimit !== undefined && charLimit > 0 ? characters > charLimit : false;

      const isWordLimitApproaching =
        wordLimit !== undefined && wordLimit > 0
          ? words >= wordLimit * threshold && words <= wordLimit
          : false;
      const isWordLimitExceeded =
        wordLimit !== undefined && wordLimit > 0 ? words > wordLimit : false;

      return {
        words,
        characters,
        charactersExcludingSpaces,
        paragraphs,
        readingTime: reading.minutes,
        readingTimeString: reading.text,
        characterLimit: charLimit,
        wordLimit: wordLimit,
        isCharacterLimitApproaching,
        isCharacterLimitExceeded,
        isWordLimitApproaching,
        isWordLimitExceeded,
      };
    };
  },

  onTransaction({ transaction }) {
    if (!transaction.docChanged) return;

    const stats = this.storage.getStatistics(transaction.doc);
    this.options.onUpdate?.(stats);

    if (stats.isCharacterLimitApproaching && stats.characterLimit) {
      this.options.onLimitWarning?.({
        type: 'characters',
        current: stats.characters,
        limit: stats.characterLimit,
        percentage: Math.round((stats.characters / stats.characterLimit) * 100),
      });
    }

    if (stats.isCharacterLimitExceeded && stats.characterLimit) {
      this.options.onLimitExceeded?.({
        type: 'characters',
        current: stats.characters,
        limit: stats.characterLimit,
        percentage: Math.round((stats.characters / stats.characterLimit) * 100),
      });
    }

    if (stats.isWordLimitApproaching && stats.wordLimit) {
      this.options.onLimitWarning?.({
        type: 'words',
        current: stats.words,
        limit: stats.wordLimit,
        percentage: Math.round((stats.words / stats.wordLimit) * 100),
      });
    }

    if (stats.isWordLimitExceeded && stats.wordLimit) {
      this.options.onLimitExceeded?.({
        type: 'words',
        current: stats.words,
        limit: stats.wordLimit,
        percentage: Math.round((stats.words / stats.wordLimit) * 100),
      });
    }
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: WordCounterPluginKey,
        filterTransaction(tr, state) {
          if (!tr.docChanged) return true;

          const isHardLimit =
            extension.storage.config.hardLimit || extension.storage.config.blockOnLimit;
          if (!isHardLimit) return true;

          const charLimit =
            extension.storage.config.maxCharacters ?? extension.storage.config.characterLimit;
          const wordLimit =
            extension.storage.config.maxWords ?? extension.storage.config.wordLimit;

          if (!charLimit && !wordLimit) return true;

          const oldChars = extension.storage.characters(false, state.doc);
          const newChars = extension.storage.characters(false, tr.doc);
          const oldWords = extension.storage.words(state.doc);
          const newWords = extension.storage.words(tr.doc);

          // Always allow deletions or reduction in size
          if (newChars <= oldChars && newWords <= oldWords) {
            return true;
          }

          // Check if character limit is exceeded
          if (charLimit && charLimit > 0 && newChars > charLimit) {
            if (newChars > oldChars) {
              return false; // Block transaction
            }
          }

          // Check if word limit is exceeded
          if (wordLimit && wordLimit > 0 && newWords > wordLimit) {
            if (newWords > oldWords) {
              return false; // Block transaction
            }
          }

          return true;
        },
      }),
    ];
  },
});
