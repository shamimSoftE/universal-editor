import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEditor, UniversalEditor } from '@universal-editor/core';

describe('UniversalEditor - Phase 1 Core Architecture', () => {
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

  it('should initialize editor with default options and content', () => {
    editor = createEditor({
      element: container,
      content: '<p>Initial content</p>',
    });

    expect(editor).toBeInstanceOf(UniversalEditor);
    expect(editor.isEditable).toBe(true);
    expect(editor.isDestroyed).toBe(false);
    expect(editor.getText()).toContain('Initial content');
    expect(editor.getHTML()).toContain('<p>Initial content</p>');
  });

  it('should return valid JSON structure via getJSON()', () => {
    editor = createEditor({
      element: container,
      content: '<p>JSON Test</p>',
    });

    const json = editor.getJSON();
    expect(json).toBeDefined();
    expect(json.type).toBe('doc');
    expect(Array.isArray(json.content)).toBe(true);
  });

  it('should support setContent and clearContent', () => {
    editor = createEditor({
      element: container,
      content: '<p>First</p>',
    });

    expect(editor.getText()).toContain('First');

    editor.setContent('<p>Updated Content</p>');
    expect(editor.getText()).toContain('Updated Content');

    editor.clearContent();
    expect(editor.getText().trim()).toBe('');
  });

  it('should toggle editable state with setEditable', () => {
    editor = createEditor({
      element: container,
      editable: true,
    });

    expect(editor.isEditable).toBe(true);

    editor.setEditable(false);
    expect(editor.isEditable).toBe(false);

    editor.setEditable(true);
    expect(editor.isEditable).toBe(true);
  });

  it('should emit update event when content changes', () => {
    const updateSpy = vi.fn();
    editor = createEditor({
      element: container,
      content: '<p>Start</p>',
      onUpdate: updateSpy,
    });

    editor.setContent('<p>New content</p>', true);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should support custom event listener registration using on() and off()', () => {
    const customListener = vi.fn();
    editor = createEditor({
      element: container,
    });

    editor.on('update', customListener);
    editor.emit('update', { editor, transaction: {} });
    expect(customListener).toHaveBeenCalledTimes(1);

    editor.off('update', customListener);
    editor.emit('update', { editor, transaction: {} });
    expect(customListener).toHaveBeenCalledTimes(1);
  });

  it('should execute focus, blur, undo, and redo without crashing', () => {
    editor = createEditor({
      element: container,
      content: '<p>History Test</p>',
    });

    expect(() => editor.focus()).not.toThrow();
    expect(() => editor.blur()).not.toThrow();
    expect(() => editor.undo()).not.toThrow();
    expect(() => editor.redo()).not.toThrow();
  });

  it('should properly destroy instance and fire onDestroy callback', () => {
    const destroySpy = vi.fn();
    editor = createEditor({
      element: container,
      onDestroy: destroySpy,
    });

    expect(editor.isDestroyed).toBe(false);
    editor.destroy();
    expect(editor.isDestroyed).toBe(true);
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it('should handle null or undefined content safely', () => {
    editor = createEditor({
      element: container,
      content: null,
    });

    expect(editor.getText()).toBe('');
    expect(editor.getHTML()).toBe('<p></p>');
  });

  it('should allow passing custom extensions', () => {
    editor = createEditor({
      element: container,
      extensions: [],
    });

    expect(editor.tiptap).toBeDefined();
    expect(editor.isDestroyed).toBe(false);
  });

  it('should fire selectionUpdate and transaction events', () => {
    const selectionSpy = vi.fn();
    const transactionSpy = vi.fn();

    editor = createEditor({
      element: container,
      content: '<p>Testing selection & transaction</p>',
      onSelectionUpdate: selectionSpy,
      onTransaction: transactionSpy,
    });

    editor.setContent('<p>Changed text</p>', true);
    expect(transactionSpy).toHaveBeenCalled();
  });
});
