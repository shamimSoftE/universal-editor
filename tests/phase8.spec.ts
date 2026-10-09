import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEditor, UniversalEditor, ContentSanitizer, TableDialog, TableToolbar, TableContextMenu } from '@universal-editor/core';

describe('Phase 8 — Tables Architecture & Features', () => {
  let editor: UniversalEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    editor = createEditor({
      element: container,
      content: '<p>Initial paragraph before table</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  describe('1. Table Creation and Basic State', () => {
    it('inserts a table with custom rows, columns, and header row', () => {
      editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
      const html = editor.getHTML();

      expect(html).toContain('<table');
      expect(html).toContain('<th');
      expect(html).toContain('<td');
      expect(editor.isTableActive()).toBe(true);
    });

    it('inserts a table without header row when requested', () => {
      editor.setContent('<p>Hello</p>');
      editor.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
      const html = editor.getHTML();

      expect(html).toContain('<table');
      expect(html).toContain('<td');
      expect(html).not.toContain('<th');
    });
  });

  describe('2. Row Operations', () => {
    beforeEach(() => {
      editor.setContent('');
      editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    });

    it('adds a row before the active cell', () => {
      const initialRows = (editor.getHTML().match(/<tr/g) || []).length;
      editor.addRowBefore();
      const updatedRows = (editor.getHTML().match(/<tr/g) || []).length;
      expect(updatedRows).toBe(initialRows + 1);
    });

    it('adds a row after the active cell', () => {
      const initialRows = (editor.getHTML().match(/<tr/g) || []).length;
      editor.addRowAfter();
      const updatedRows = (editor.getHTML().match(/<tr/g) || []).length;
      expect(updatedRows).toBe(initialRows + 1);
    });

    it('deletes the active row', () => {
      const initialRows = (editor.getHTML().match(/<tr/g) || []).length;
      editor.deleteRow();
      const updatedRows = (editor.getHTML().match(/<tr/g) || []).length;
      expect(updatedRows).toBe(initialRows - 1);
    });
  });

  describe('3. Column Operations', () => {
    beforeEach(() => {
      editor.setContent('');
      editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    });

    it('adds a column before active column', () => {
      editor.addColumnBefore();
      const html = editor.getHTML();
      expect(html).toContain('<table');
      expect(editor.isTableActive()).toBe(true);
    });

    it('adds a column after active column', () => {
      editor.addColumnAfter();
      const html = editor.getHTML();
      expect(html).toContain('<table');
      expect(editor.isTableActive()).toBe(true);
    });

    it('deletes active column', () => {
      editor.deleteColumn();
      const html = editor.getHTML();
      expect(html).toContain('<table');
    });
  });

  describe('4. Header Toggles & Deletion', () => {
    beforeEach(() => {
      editor.setContent('');
      editor.insertTable({ rows: 3, cols: 3, withHeaderRow: false });
    });

    it('toggles header row', () => {
      expect(editor.getHTML()).not.toContain('<th');
      editor.toggleHeaderRow();
      expect(editor.getHTML()).toContain('<th');
    });

    it('deletes the entire table', () => {
      expect(editor.isTableActive()).toBe(true);
      editor.deleteTable();
      expect(editor.isTableActive()).toBe(false);
      expect(editor.getHTML()).not.toContain('<table');
    });
  });

  describe('5. Table Sanitization & Security', () => {
    it('safely preserves valid table structure, colspan, rowspan, and colwidth', () => {
      const rawTable = `
        <table class="ue-table" style="width: 100%;">
          <thead>
            <tr>
              <th colspan="2" style="background: #111;">Header 1</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="2">Cell A</td>
              <td>Cell B</td>
            </tr>
          </tbody>
        </table>
      `;

      const sanitized = ContentSanitizer.sanitize(rawTable);
      expect(sanitized).toContain('<table');
      expect(sanitized).toContain('colspan="2"');
      expect(sanitized).toContain('rowspan="2"');
      expect(sanitized).toContain('Header 1');
      expect(sanitized).toContain('Cell A');
    });

    it('removes malicious scripts and event handlers injected inside tables', () => {
      const maliciousTable = `
        <table onclick="alert('xss')">
          <tr>
            <td><script>alert('table-xss')</script>Safe Cell</td>
            <td onerror="evil()">Data</td>
          </tr>
        </table>
      `;

      const sanitized = ContentSanitizer.sanitize(maliciousTable);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('Safe Cell');
      expect(sanitized).toContain('Data');
    });
  });

  describe('6. Table UI Components', () => {
    it('instantiates TableDialog and opens/closes successfully', () => {
      const dialog = new TableDialog(editor);
      expect(dialog.overlay).toBeDefined();

      dialog.open();
      expect(dialog.overlay.classList.contains('active')).toBe(true);

      dialog.close();
      expect(dialog.overlay.classList.contains('active')).toBe(false);

      dialog.destroy();
    });

    it('instantiates TableToolbar and TableContextMenu without errors', () => {
      expect(editor.tableToolbar).toBeDefined();
      expect(editor.tableContextMenu).toBeDefined();

      const toolbar = new TableToolbar(editor);
      expect(toolbar.element).toBeDefined();
      toolbar.destroy();

      const menu = new TableContextMenu(editor);
      expect(menu.element).toBeDefined();
      menu.destroy();
    });
  });
});
