import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UniversalEditor,
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  SlashMenuRenderer,
} from '../packages/core/src';
import type { SlashCommandItem } from '../packages/core/src';

describe('Phase 11: Slash Commands Suite', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('DEFAULT_SLASH_COMMANDS List & Completeness', () => {
    it('contains all required slash commands from prompt specification', () => {
      const requiredCommandIds = [
        'paragraph',
        'heading',
        'h1',
        'h2',
        'h3',
        'image',
        'file',
        'table',
        'code',
        'quote',
        'divider',
        'youtube',
        'video',
        'bullet',
        'numbered',
        'checklist',
      ];

      const existingIds = DEFAULT_SLASH_COMMANDS.map(c => c.id);
      requiredCommandIds.forEach(id => {
        expect(existingIds).toContain(id);
      });
    });

    it('ensures each command has valid structure, metadata, and handler', () => {
      DEFAULT_SLASH_COMMANDS.forEach(cmd => {
        expect(cmd.id).toBeDefined();
        expect(cmd.title).toBeDefined();
        expect(cmd.description).toBeDefined();
        expect(cmd.group).toBeDefined();
        expect(cmd.icon).toBeDefined();
        expect(typeof cmd.command).toBe('function');
      });
    });
  });

  describe('filterSlashCommands Filtering & Search', () => {
    it('returns all commands when query is empty', () => {
      const results = filterSlashCommands(DEFAULT_SLASH_COMMANDS, '');
      expect(results.length).toBe(DEFAULT_SLASH_COMMANDS.length);
    });

    it('filters commands by exact ID or substring', () => {
      const results = filterSlashCommands(DEFAULT_SLASH_COMMANDS, 'h1');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('h1');
    });

    it('strips leading slash automatically from user query', () => {
      const results = filterSlashCommands(DEFAULT_SLASH_COMMANDS, '/image');
      expect(results.some(c => c.id === 'image')).toBe(true);
    });

    it('finds commands using aliases and keywords', () => {
      // 'todo' -> checklist
      const todoResults = filterSlashCommands(DEFAULT_SLASH_COMMANDS, 'todo');
      expect(todoResults.some(c => c.id === 'checklist')).toBe(true);

      // 'yt' -> youtube
      const ytResults = filterSlashCommands(DEFAULT_SLASH_COMMANDS, 'yt');
      expect(ytResults.some(c => c.id === 'youtube')).toBe(true);

      // 'hr' -> divider
      const hrResults = filterSlashCommands(DEFAULT_SLASH_COMMANDS, 'hr');
      expect(hrResults.some(c => c.id === 'divider')).toBe(true);
    });

    it('returns empty array when no commands match', () => {
      const results = filterSlashCommands(DEFAULT_SLASH_COMMANDS, 'nonexistentquery123');
      expect(results).toEqual([]);
    });
  });

  describe('UniversalEditor Slash Commands API & Execution', () => {
    it('retrieves default slash commands via editor API', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Initial content</p>',
      });

      const commands = editor.getSlashCommands();
      expect(commands.length).toBe(DEFAULT_SLASH_COMMANDS.length);

      editor.destroy();
    });

    it('allows registering custom slash commands dynamically', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Test</p>',
      });

      const customCmd: SlashCommandItem = {
        id: 'callout',
        title: 'Callout Box',
        description: 'Highlight important information',
        group: 'Advanced',
        icon: '<svg></svg>',
        command: ({ editor: tiptap, range }) => {
          tiptap.chain().focus().deleteRange(range).setParagraph().run();
        },
      };

      editor.registerSlashCommand(customCmd);
      const commands = editor.getSlashCommands();
      expect(commands.some(c => c.id === 'callout')).toBe(true);

      editor.destroy();
    });

    it('executes /h1 slash command correctly on editor document', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>/h1</p>',
      });

      const h1Cmd = DEFAULT_SLASH_COMMANDS.find(c => c.id === 'h1');
      expect(h1Cmd).toBeDefined();

      h1Cmd!.command({
        editor: editor.tiptap,
        range: { from: 1, to: 4 },
        coreEditor: editor,
      });

      expect(editor.getHTML()).toContain('<h1>');
      editor.destroy();
    });

    it('executes /code slash command correctly on editor document', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>/code</p>',
      });

      const codeCmd = DEFAULT_SLASH_COMMANDS.find(c => c.id === 'code');
      expect(codeCmd).toBeDefined();

      codeCmd!.command({
        editor: editor.tiptap,
        range: { from: 1, to: 6 },
        coreEditor: editor,
      });

      expect(editor.getHTML()).toContain('<pre');
      editor.destroy();
    });

    it('executes /divider slash command correctly', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Line 1</p><p>/divider</p>',
      });

      const divCmd = DEFAULT_SLASH_COMMANDS.find(c => c.id === 'divider');
      expect(divCmd).toBeDefined();

      divCmd!.command({
        editor: editor.tiptap,
        range: { from: 8, to: 16 },
        coreEditor: editor,
      });

      expect(editor.getHTML()).toContain('<hr');
      editor.destroy();
    });

    it('executes /bullet list slash command correctly', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>/bullet</p>',
      });

      const bulletCmd = DEFAULT_SLASH_COMMANDS.find(c => c.id === 'bullet');
      expect(bulletCmd).toBeDefined();

      bulletCmd!.command({
        editor: editor.tiptap,
        range: { from: 1, to: 8 },
        coreEditor: editor,
      });

      expect(editor.getHTML()).toContain('<ul');
      editor.destroy();
    });
  });

  describe('SlashMenuRenderer DOM & Keyboard Navigation', () => {
    it('initializes menu DOM element and manages visibility lifecycle', () => {
      const renderer = new SlashMenuRenderer();
      expect(renderer.element).toBeDefined();
      expect(renderer.element.className).toContain('ue-slash-menu');

      let executed = false;
      const sampleItem = DEFAULT_SLASH_COMMANDS[0];

      renderer.onStart({
        editor: null as any,
        range: { from: 0, to: 1 },
        query: '',
        text: '/',
        items: [sampleItem],
        command: () => {
          executed = true;
        },
        decorationNode: null,
        clientRect: () => new DOMRect(100, 100, 10, 20),
      });

      expect(renderer.element.style.display).toBe('block');

      // Test keyboard navigation (Enter key)
      const handled = renderer.onKeyDown({
        view: null as any,
        event: new KeyboardEvent('keydown', { key: 'Enter' }),
        range: { from: 0, to: 1 },
      });

      expect(handled).toBe(true);
      expect(executed).toBe(true);

      // Hide and destroy
      renderer.hide();
      expect(renderer.element.style.display).toBe('none');

      renderer.destroy();
      expect(renderer.element.parentNode).toBeNull();
    });

    it('handles ArrowDown and ArrowUp cycling with Escape close', () => {
      const renderer = new SlashMenuRenderer();
      const items = DEFAULT_SLASH_COMMANDS.slice(0, 3);

      renderer.onStart({
        editor: null as any,
        range: { from: 0, to: 1 },
        query: '',
        text: '/',
        items,
        command: () => {},
        decorationNode: null,
        clientRect: () => new DOMRect(50, 50, 10, 20),
      });

      // Arrow down
      expect(
        renderer.onKeyDown({
          view: null as any,
          event: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
          range: { from: 0, to: 1 },
        })
      ).toBe(true);

      // Arrow up
      expect(
        renderer.onKeyDown({
          view: null as any,
          event: new KeyboardEvent('keydown', { key: 'ArrowUp' }),
          range: { from: 0, to: 1 },
        })
      ).toBe(true);

      // Escape key closes menu
      expect(
        renderer.onKeyDown({
          view: null as any,
          event: new KeyboardEvent('keydown', { key: 'Escape' }),
          range: { from: 0, to: 1 },
        })
      ).toBe(true);

      expect(renderer.element.style.display).toBe('none');
      renderer.destroy();
    });
  });
});
