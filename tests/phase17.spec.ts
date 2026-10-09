import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEditor, UniversalEditor } from '@universal-editor/core';

describe('Phase 17: Vanilla JavaScript API (@universal-editor/core)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-editor-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Instantiation and Overloads', () => {
    it('creates an editor with options object', () => {
      const editor = createEditor({
        element: container,
        content: '<p>Hello from Options</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getHTML()).toContain('<p>Hello from Options</p>');
      expect(editor.isDestroyed).toBe(false);

      editor.destroy();
    });

    it('creates an editor using string selector in options object', () => {
      const editor = createEditor({
        element: '#test-editor-container',
        content: '<p>Hello via selector</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getHTML()).toContain('<p>Hello via selector</p>');

      editor.destroy();
    });

    it('creates an editor with selector as first argument overload (createEditor(selector, options))', () => {
      const editor = createEditor('#test-editor-container', {
        content: '<p>Overload with selector first</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getHTML()).toContain('<p>Overload with selector first</p>');

      editor.destroy();
    });

    it('creates an editor with HTMLElement as first argument overload (createEditor(element, options))', () => {
      const editor = createEditor(container, {
        content: '<p>Overload with element first</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getHTML()).toContain('<p>Overload with element first</p>');

      editor.destroy();
    });

    it('creates an editor without element (headless / virtual)', () => {
      const editor = createEditor({
        content: '<p>Headless Editor</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getHTML()).toContain('<p>Headless Editor</p>');

      editor.destroy();
    });
  });

  describe('API Methods: Content Retrieval & Formatting', () => {
    let editor: UniversalEditor;

    beforeEach(() => {
      editor = createEditor({
        element: container,
        content: '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p>',
      });
    });

    afterEach(() => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    });

    it('editor.getHTML() returns clean semantic HTML', () => {
      const html = editor.getHTML();
      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<p>Paragraph with <strong>bold</strong> text.</p>');
    });

    it('editor.getJSON() returns structured document object', () => {
      const json = editor.getJSON();
      expect(json).toBeDefined();
      expect(json.type).toBe('doc');
      expect(Array.isArray(json.content)).toBe(true);
      expect(json.content.length).toBeGreaterThan(0);
    });

    it('editor.getText() returns plain text without HTML tags', () => {
      const text = editor.getText();
      expect(text).toContain('Title');
      expect(text).toContain('Paragraph with bold text.');
      expect(text).not.toContain('<p>');
      expect(text).not.toContain('<strong>');
    });

    it('editor.getSanitizedHTML() strips dangerous script vectors', () => {
      globalThis.alert = vi.fn();
      editor.setContent('<p>Normal text</p><img src="x" onerror="void(0)">');
      const sanitized = editor.getSanitizedHTML();
      expect(sanitized).toContain('<p>Normal text</p>');
      expect(sanitized).not.toContain('onerror');
    });
  });

  describe('API Methods: Content Mutation', () => {
    let editor: UniversalEditor;

    beforeEach(() => {
      editor = createEditor({
        element: container,
        content: '<p>Initial text</p>',
      });
    });

    afterEach(() => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    });

    it('editor.setContent() updates editor content with new HTML', () => {
      editor.setContent('<p>Replaced content</p>');
      expect(editor.getHTML()).toContain('<p>Replaced content</p>');
      expect(editor.getHTML()).not.toContain('Initial text');
    });

    it('editor.setContent() accepts TipTap JSON structure', () => {
      const jsonDoc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Set via JSON' }],
          },
        ],
      };
      editor.setContent(jsonDoc);
      expect(editor.getHTML()).toContain('Set via JSON');
      expect(editor.getText()).toBe('Set via JSON');
    });

    it('editor.clearContent() empties the editor surface', () => {
      editor.clearContent();
      expect(editor.getText().trim()).toBe('');
      expect(editor.getHTML()).toBe('<p></p>');
    });
  });

  describe('API Methods: Focus, Blur, Editable State', () => {
    let editor: UniversalEditor;

    beforeEach(() => {
      editor = createEditor({
        element: container,
        content: '<p>Interactive content</p>',
      });
    });

    afterEach(() => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    });

    it('editor.focus() focuses the editor', () => {
      expect(() => editor.focus()).not.toThrow();
      expect(() => editor.focus('start')).not.toThrow();
      expect(() => editor.focus('end')).not.toThrow();
    });

    it('editor.blur() blurs the editor', () => {
      expect(() => editor.blur()).not.toThrow();
    });

    it('editor.setEditable() toggles editable state', () => {
      expect(editor.isEditable).toBe(true);
      editor.setEditable(false);
      expect(editor.isEditable).toBe(false);
      editor.setEditable(true);
      expect(editor.isEditable).toBe(true);
    });

    it('editor.undo() and editor.redo() execute history commands', () => {
      expect(typeof editor.undo()).toBe('boolean');
      expect(typeof editor.redo()).toBe('boolean');
    });
  });

  describe('Event Bus: on(), off(), once()', () => {
    let editor: UniversalEditor;

    beforeEach(() => {
      editor = createEditor({
        element: container,
        content: '<p>Event test</p>',
      });
    });

    afterEach(() => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    });

    it('editor.on() registers an event listener that fires on update and change', () => {
      const updateHandler = vi.fn();
      const changeHandler = vi.fn();

      editor.on('update', updateHandler);
      editor.on('change', changeHandler);

      editor.setContent('<p>Updated Content</p>', true);

      expect(updateHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
      expect(updateHandler.mock.calls[0][0].editor).toBe(editor);
    });

    it('editor.off() unregisters the event listener', () => {
      const handler = vi.fn();
      editor.on('update', handler);

      editor.setContent('<p>First Change</p>', true);
      expect(handler).toHaveBeenCalledTimes(1);

      editor.off('update', handler);

      editor.setContent('<p>Second Change</p>', true);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('editor.once() triggers listener only once', () => {
      const onceHandler = vi.fn();
      editor.once('update', onceHandler);

      editor.setContent('<p>Change 1</p>', true);
      editor.setContent('<p>Change 2</p>', true);
      editor.setContent('<p>Change 3</p>', true);

      expect(onceHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lifecycle and Destruction (editor.destroy())', () => {
    it('editor.destroy() marks instance as destroyed and cleans up', () => {
      const editor = createEditor({
        element: container,
        content: '<p>Destroy test</p>',
      });

      const destroyListener = vi.fn();
      editor.on('destroy', destroyListener);

      expect(editor.isDestroyed).toBe(false);
      editor.destroy();

      expect(editor.isDestroyed).toBe(true);
      expect(destroyListener).toHaveBeenCalled();

      // Subsequent destroy calls are idempotent
      expect(() => editor.destroy()).not.toThrow();
    });
  });

  describe('Global Browser Window Export (window.UniversalEditor)', () => {
    it('attaches createEditor and UniversalEditor to window in browser environment', () => {
      const globalAny = window as any;
      expect(globalAny.UniversalEditor).toBeDefined();
      expect(typeof globalAny.UniversalEditor.createEditor).toBe('function');
      expect(globalAny.UniversalEditor.UniversalEditor).toBe(UniversalEditor);

      const editorFromGlobal = globalAny.UniversalEditor.createEditor({
        element: container,
        content: '<p>Created via window.UniversalEditor</p>',
      });
      expect(editorFromGlobal.getHTML()).toContain('Created via window.UniversalEditor');
      editorFromGlobal.destroy();
    });
  });
});
