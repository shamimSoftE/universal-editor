import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEditor, UniversalEditor, Toolbar } from '@universal-editor/core';

describe('Phase 2 — Basic Rich Text Editing', () => {
  let editor: UniversalEditor;
  let container: HTMLElement;

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

  describe('Text Formatting', () => {
    it('should toggle bold mark on selection', () => {
      editor = createEditor({
        element: container,
        content: '<p>Sample text</p>',
      });

      // Select all text
      editor.focus('all');
      expect(editor.toggleBold()).toBe(true);
      expect(editor.getHTML()).toContain('<strong>Sample text</strong>');
      expect(editor.isActive('bold')).toBe(true);

      editor.toggleBold();
      expect(editor.getHTML()).not.toContain('<strong>');
      expect(editor.isActive('bold')).toBe(false);
    });

    it('should toggle italic mark', () => {
      editor = createEditor({
        element: container,
        content: '<p>Italic test</p>',
      });

      editor.focus('all');
      expect(editor.toggleItalic()).toBe(true);
      expect(editor.getHTML()).toContain('<em>Italic test</em>');
      expect(editor.isActive('italic')).toBe(true);
    });

    it('should toggle underline mark', () => {
      editor = createEditor({
        element: container,
        content: '<p>Underline test</p>',
      });

      editor.focus('all');
      expect(editor.toggleUnderline()).toBe(true);
      expect(editor.getHTML()).toContain('<u>Underline test</u>');
      expect(editor.isActive('underline')).toBe(true);
    });

    it('should toggle strike mark', () => {
      editor = createEditor({
        element: container,
        content: '<p>Strike test</p>',
      });

      editor.focus('all');
      expect(editor.toggleStrike()).toBe(true);
      expect(editor.getHTML()).toContain('<s>Strike test</s>');
      expect(editor.isActive('strike')).toBe(true);
    });

    it('should toggle inline code mark', () => {
      editor = createEditor({
        element: container,
        content: '<p>Code test</p>',
      });

      editor.focus('all');
      expect(editor.toggleCode()).toBe(true);
      expect(editor.getHTML()).toContain('<code>Code test</code>');
      expect(editor.isActive('code')).toBe(true);
    });
  });

  describe('Headings & Blocks', () => {
    it('should toggle headings H1 through H6 and reset to paragraph', () => {
      editor = createEditor({
        element: container,
        content: '<p>Heading test</p>',
      });

      editor.focus('start');

      editor.toggleHeading(1);
      expect(editor.getHTML()).toContain('<h1>Heading test</h1>');
      expect(editor.isActive('heading', { level: 1 })).toBe(true);

      editor.toggleHeading(2);
      expect(editor.getHTML()).toContain('<h2>Heading test</h2>');
      expect(editor.isActive('heading', { level: 2 })).toBe(true);

      editor.setParagraph();
      expect(editor.getHTML()).toContain('<p>Heading test</p>');
      expect(editor.isActive('paragraph')).toBe(true);
    });

    it('should toggle blockquote', () => {
      editor = createEditor({
        element: container,
        content: '<p>Quote text</p>',
      });

      editor.focus('start');
      editor.toggleBlockquote();
      expect(editor.getHTML()).toContain('<blockquote>');
      expect(editor.isActive('blockquote')).toBe(true);
    });

    it('should insert horizontal rule', () => {
      editor = createEditor({
        element: container,
        content: '<p>Above rule</p>',
      });

      editor.focus('end');
      editor.setHorizontalRule();
      expect(editor.getHTML()).toContain('<hr>');
    });
  });

  describe('Lists', () => {
    it('should toggle bullet list', () => {
      editor = createEditor({
        element: container,
        content: '<p>Item 1</p>',
      });

      editor.focus('start');
      editor.toggleBulletList();
      expect(editor.getHTML()).toContain('<ul>');
      expect(editor.isActive('bulletList')).toBe(true);
    });

    it('should toggle ordered list', () => {
      editor = createEditor({
        element: container,
        content: '<p>Step 1</p>',
      });

      editor.focus('start');
      editor.toggleOrderedList();
      expect(editor.getHTML()).toContain('<ol>');
      expect(editor.isActive('orderedList')).toBe(true);
    });

    it('should toggle task list', () => {
      editor = createEditor({
        element: container,
        content: '<p>Todo item</p>',
      });

      editor.focus('start');
      editor.toggleTaskList();
      expect(editor.getHTML()).toContain('data-type="taskList"');
      expect(editor.isActive('taskList')).toBe(true);
    });
  });

  describe('Text Alignment & Clear Formatting', () => {
    it('should set text alignment', () => {
      editor = createEditor({
        element: container,
        content: '<p>Alignment test</p>',
      });

      editor.focus('start');
      editor.setTextAlign('center');
      expect(editor.getHTML()).toContain('text-align: center');
      expect(editor.isActive({ textAlign: 'center' })).toBe(true);

      editor.setTextAlign('right');
      expect(editor.getHTML()).toContain('text-align: right');
      expect(editor.isActive({ textAlign: 'right' })).toBe(true);
    });

    it('should clear formatting', () => {
      editor = createEditor({
        element: container,
        content: '<h1><strong><em>Formatted text</em></strong></h1>',
      });

      editor.focus('all');
      editor.clearFormatting();
      expect(editor.getHTML()).not.toContain('<strong>');
      expect(editor.getHTML()).not.toContain('<em>');
    });
  });

  describe('Links', () => {
    it('should set, retrieve, and remove link attributes', () => {
      editor = createEditor({
        element: container,
        content: '<p>Visit Google today</p>',
      });

      editor.focus('all');
      editor.setLink({ href: 'https://google.com', target: '_blank' });

      expect(editor.getHTML()).toContain('href="https://google.com"');
      expect(editor.getHTML()).toContain('target="_blank"');
      expect(editor.isActive('link')).toBe(true);

      const attrs = editor.getLinkAttributes();
      expect(attrs.href).toBe('https://google.com');

      editor.unsetLink();
      expect(editor.getHTML()).not.toContain('href=');
      expect(editor.isActive('link')).toBe(false);
    });
  });

  describe('Toolbar Component & Configurability', () => {
    it('should instantiate toolbar with custom configuration', () => {
      editor = createEditor({
        element: container,
        content: '<p>Toolbar test</p>',
      });

      const customConfig = ['bold', 'italic', '|', 'heading', '|', 'undo'];
      const toolbar = new Toolbar(editor, customConfig);

      expect(toolbar.element).toBeDefined();
      expect(toolbar.element.querySelectorAll('.ue-toolbar-btn').length).toBeGreaterThan(0);
      expect(toolbar.element.querySelector('.ue-btn-bold')).toBeDefined();
      expect(toolbar.element.querySelector('.ue-btn-italic')).toBeDefined();
      expect(toolbar.element.querySelector('.ue-toolbar-divider')).toBeDefined();

      toolbar.destroy();
    });

    it('should auto-attach toolbar when configured via options', () => {
      const parent = document.createElement('div');
      const editorEl = document.createElement('div');
      parent.appendChild(editorEl);
      document.body.appendChild(parent);

      editor = createEditor({
        element: editorEl,
        toolbar: ['bold', 'italic', 'underline'],
      });

      expect(editor.toolbar).toBeDefined();
      expect(parent.querySelector('.ue-toolbar')).toBeDefined();

      parent.remove();
    });
  });
});
