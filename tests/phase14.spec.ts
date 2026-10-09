import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createEditor,
  UniversalEditor,
  countWords,
  countCharacters,
  calculateReadingTime,
  type EditorStatistics,
  type LimitEventPayload,
} from '../packages/core/src';

describe('Phase 14: Word & Character Counter', () => {
  let container: HTMLElement;
  let editor: UniversalEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (editor && !editor.isDestroyed) {
      editor.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Pure Utility Calculation Functions', () => {
    it('accurately counts words with multiple spaces and punctuation', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  The   quick   brown  fox   jumps   ')).toBe(5);
      expect(countWords('One\ntwo\nthree\tfour')).toBe(4);
    });

    it('accurately counts international multilingual Unicode words', () => {
      // Bengali
      expect(countWords('আমাদের মাতৃভাষা বাংলা')).toBe(3);
      // Arabic
      expect(countWords('محرر النصوص العالمي الممتاز')).toBe(4);
      // Hindi
      expect(countWords('यूनिवर्सल रिच टेक्स्ट एडिटर')).toBe(4);
    });

    it('accurately counts characters with and without whitespace', () => {
      const text = 'Hello Universal World!';
      // Length including spaces: 22
      expect(countCharacters(text, false)).toBe(22);
      // Length without spaces (20 letters/punctuation):
      expect(countCharacters(text, true)).toBe(20);
      expect(countCharacters('', false)).toBe(0);
      expect(countCharacters('   ', true)).toBe(0);
    });

    it('calculates reading time estimates accurately', () => {
      expect(calculateReadingTime(0)).toEqual({ minutes: 0, text: '0 min read' });
      expect(calculateReadingTime(50)).toEqual({ minutes: 1, text: '< 1 min read' });
      expect(calculateReadingTime(200, 200)).toEqual({ minutes: 1, text: '< 1 min read' });
      expect(calculateReadingTime(450, 200)).toEqual({ minutes: 3, text: '3 min read' });
      expect(calculateReadingTime(1000, 200)).toEqual({ minutes: 5, text: '5 min read' });
    });
  });

  describe('Core Editor Statistics API', () => {
    it('retrieves word count, character count, and paragraph count from clean editor', () => {
      editor = createEditor({
        element: container,
        content: '<p>First paragraph with five words.</p><p>Second paragraph here.</p>',
      });

      expect(editor.getWordCount()).toBe(8);
      // "First paragraph with five words. Second paragraph here."
      expect(editor.getCharacterCount(false)).toBeGreaterThan(50);
      expect(editor.getCharacterCount(true)).toBeLessThan(editor.getCharacterCount(false));
      expect(editor.getParagraphCount()).toBe(2);
    });

    it('returns comprehensive EditorStatistics snapshot', () => {
      editor = createEditor({
        element: container,
        content: '<h1>Title</h1><p>This is a paragraph with several words to calculate statistics.</p>',
        statistics: {
          maxWords: 50,
          maxCharacters: 200,
        },
      });

      const stats = editor.getStatistics();
      expect(stats.words).toBe(11);
      expect(stats.paragraphs).toBe(2);
      expect(stats.characters).toBeGreaterThan(60);
      expect(stats.charactersExcludingSpaces).toBeGreaterThan(50);
      expect(stats.wordLimit).toBe(50);
      expect(stats.characterLimit).toBe(200);
      expect(stats.isWordLimitExceeded).toBe(false);
      expect(stats.isCharacterLimitExceeded).toBe(false);
      expect(stats.readingTimeString).toBe('< 1 min read');
    });

    it('updates statistics dynamically as content is modified', () => {
      editor = createEditor({
        element: container,
        content: '<p>Initial text</p>',
      });

      expect(editor.getWordCount()).toBe(2);

      editor.setContent('<p>Initial text is now expanded with additional words.</p>');
      expect(editor.getWordCount()).toBe(8);

      editor.clearContent();
      expect(editor.getWordCount()).toBe(0);
      expect(editor.getCharacterCount(false)).toBe(0);
    });
  });

  describe('Approaching Warning and Exceeded Limits', () => {
    it('detects approaching warning threshold (>= 90%)', () => {
      editor = createEditor({
        element: container,
        content: '<p>One two three four five six seven eight nine</p>', // 9 words
        statistics: {
          maxWords: 10,
          warningThreshold: 0.9,
        },
      });

      const stats = editor.getStatistics();
      expect(stats.words).toBe(9);
      expect(stats.wordLimit).toBe(10);
      expect(stats.isWordLimitApproaching).toBe(true);
      expect(stats.isWordLimitExceeded).toBe(false);
    });

    it('detects when limit is exceeded (> 100%)', () => {
      editor = createEditor({
        element: container,
        content: '<p>One two three four five six seven eight nine ten eleven</p>', // 11 words
        statistics: {
          maxWords: 10,
        },
      });

      const stats = editor.getStatistics();
      expect(stats.words).toBe(11);
      expect(stats.isWordLimitApproaching).toBe(false);
      expect(stats.isWordLimitExceeded).toBe(true);
    });

    it('emits limit:warning and limit:exceeded events during typing', () => {
      let warningPayload: LimitEventPayload | null = null;
      let exceededPayload: LimitEventPayload | null = null;

      editor = createEditor({
        element: container,
        content: '<p>Hello</p>',
        statistics: {
          maxWords: 5,
        },
      });

      editor.on('limit:warning', (payload: LimitEventPayload) => {
        warningPayload = payload;
      });

      editor.on('limit:exceeded', (payload: LimitEventPayload) => {
        exceededPayload = payload;
      });

      // Insert words up to approaching (4 of 5 = 80%, but threshold 0.8)
      editor.setLimits({ maxWords: 5, warningThreshold: 0.8 });
      editor.tiptap.commands.insertContent(' one two three'); // total 4 words
      expect(warningPayload).not.toBeNull();
      expect((warningPayload as any)?.type).toBe('words');

      // Exceed limit (6 words)
      editor.tiptap.commands.insertContent(' four five');
      expect(exceededPayload).not.toBeNull();
      expect((exceededPayload as any)?.type).toBe('words');
      expect((exceededPayload as any)?.current).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Hard Limit Input Blocking (blockOnLimit / hardLimit)', () => {
    it('blocks typing when maxCharacters limit is reached with hardLimit: true', () => {
      editor = createEditor({
        element: container,
        content: '<p>12345</p>', // 5 chars
        statistics: {
          maxCharacters: 8,
          hardLimit: true,
        },
      });

      expect(editor.getCharacterCount(false)).toBe(5);

      // Attempt inserting 2 chars (allowed, total 7 <= 8)
      editor.tiptap.commands.insertContent('67');
      expect(editor.getCharacterCount(false)).toBe(7);

      // Attempt inserting 5 chars (total 12 > 8) -> blocked!
      editor.tiptap.commands.insertContent('89012');
      // Content size remains 7 or was blocked
      expect(editor.getCharacterCount(false)).toBe(7);

      // Deletion is always allowed!
      editor.setContent('<p>123</p>');
      expect(editor.getCharacterCount(false)).toBe(3);
    });

    it('blocks typing when maxWords limit is reached with hardLimit: true', () => {
      editor = createEditor({
        element: container,
        content: '<p>one two three</p>', // 3 words
        statistics: {
          maxWords: 4,
          hardLimit: true,
        },
      });

      expect(editor.getWordCount()).toBe(3);

      // Attempt inserting 1 word (allowed: 4 words)
      editor.tiptap.commands.insertContent(' four');
      expect(editor.getWordCount()).toBe(4);

      // Attempt inserting more words -> blocked!
      editor.tiptap.commands.insertContent(' five six seven');
      expect(editor.getWordCount()).toBe(4);
    });

    it('dynamically updates limits and switches hardLimit mode', () => {
      editor = createEditor({
        element: container,
        content: '<p>word word word</p>',
        statistics: {
          maxWords: 10,
          hardLimit: false,
        },
      });

      expect(editor.getStatistics().wordLimit).toBe(10);

      // Update limits dynamically
      editor.setLimits({ maxWords: 5, hardLimit: true });
      expect(editor.getStatistics().wordLimit).toBe(5);

      // Add words up to 5
      editor.tiptap.commands.insertContent(' word word');
      expect(editor.getWordCount()).toBe(5);

      // Attempt 6th word -> blocked by dynamic hardLimit
      editor.tiptap.commands.insertContent(' extra');
      expect(editor.getWordCount()).toBe(5);
    });
  });

  describe('Statistics Event Subscription', () => {
    it('emits statistics:update on every document modification', () => {
      let emittedStats: EditorStatistics | null = null;

      editor = createEditor({
        element: container,
        content: '<p>Start</p>',
      });

      editor.on('statistics:update', (stats: EditorStatistics) => {
        emittedStats = stats;
      });

      editor.setContent('<p>Start extra content added</p>');
      expect(emittedStats).not.toBeNull();
      expect((emittedStats as any)?.words).toBe(4);
      expect((emittedStats as any)?.paragraphs).toBe(1);
    });

    it('accurately counts multilingual Unicode text in live editor instance', () => {
      editor = createEditor({
        element: container,
        content: '<p>আমাদের মাতৃভাষা বাংলা</p><p dir="rtl">محرر نصوص متطور</p>',
      });

      const stats = editor.getStatistics();
      // 3 Bengali words + 3 Arabic words = 6 words
      expect(stats.words).toBe(6);
      expect(stats.paragraphs).toBe(2);
      expect(stats.charactersExcludingSpaces).toBeGreaterThan(25);
    });

    it('supports custom wordsPerMinute reading time calculation', () => {
      editor = createEditor({
        element: container,
        content: '<p>' + 'word '.repeat(300).trim() + '</p>',
        statistics: {
          wordsPerMinute: 100, // 300 words @ 100 WPM = 3 minutes
        },
      });

      const stats = editor.getStatistics();
      expect(stats.words).toBe(300);
      expect(stats.readingTime).toBe(3);
      expect(stats.readingTimeString).toBe('3 min read');
    });

    it('accurately calculates characters excluding spaces across formatting tags', () => {
      editor = createEditor({
        element: container,
        content: '<p><strong>Bold</strong> <em>Italic</em> <code>Code</code></p>',
      });

      const stats = editor.getStatistics();
      expect(stats.words).toBe(3);
      // "Bold Italic Code" -> 16 chars including 2 spaces, 14 chars excluding spaces
      expect(stats.characters).toBe(16);
      expect(stats.charactersExcludingSpaces).toBe(14);
    });

    it('handles rapid limit toggles and reset to unlimited gracefully', () => {
      editor = createEditor({
        element: container,
        content: '<p>Hello world test</p>',
        statistics: {
          maxCharacters: 50,
          maxWords: 10,
          hardLimit: true,
        },
      });

      expect(editor.getStatistics().characterLimit).toBe(50);
      expect(editor.getStatistics().wordLimit).toBe(10);

      // Reset limits
      editor.setLimits({ maxCharacters: undefined, maxWords: undefined, hardLimit: false });
      const clearedStats = editor.getStatistics();
      expect(clearedStats.characterLimit).toBeUndefined();
      expect(clearedStats.wordLimit).toBeUndefined();
      expect(clearedStats.isCharacterLimitExceeded).toBe(false);
      expect(clearedStats.isWordLimitExceeded).toBe(false);
    });
  });
});
