import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEditor, UniversalEditor } from '@universal-editor/core';

describe('Phase 7 — Advanced Formatting Architecture', () => {
  let editor: UniversalEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    editor = createEditor({
      element: container,
      content: '<p>Advanced formatting test paragraph.</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  describe('1. Text Color & Highlight', () => {
    it('applies text color and unsets color', () => {
      editor.focus('all');
      editor.setColor('#ef4444');
      let html = editor.getHTML();
      expect(html).toContain('color: #ef4444');

      editor.unsetColor();
      html = editor.getHTML();
      expect(html).not.toContain('color: #ef4444');
    });

    it('applies background/highlight color and unsets highlight', () => {
      editor.focus('all');
      editor.setHighlight('#fef08a');
      let html = editor.getHTML();
      expect(html).toContain('<mark');

      editor.unsetHighlight();
      html = editor.getHTML();
      expect(html).not.toContain('<mark');
    });
  });

  describe('2. Font Size', () => {
    it('sets custom font sizes on selected text', () => {
      editor.focus('all');
      editor.setFontSize('24px');
      let html = editor.getHTML();
      expect(html).toContain('font-size: 24px');

      editor.unsetFontSize();
      html = editor.getHTML();
      expect(html).not.toContain('font-size: 24px');
    });
  });

  describe('3. Font Family & Multilingual Fonts', () => {
    it('sets serif and monospace font families', () => {
      editor.focus('all');
      editor.setFontFamily('Georgia, serif');
      let html = editor.getHTML();
      expect(html).toContain('font-family: Georgia, serif');

      editor.unsetFontFamily();
      html = editor.getHTML();
      expect(html).not.toContain('font-family: Georgia, serif');
    });

    it('sets Bangla and Arabic font families with Unicode compatibility', () => {
      editor.focus('all');
      editor.setFontFamily("'Kalpurush', 'Noto Sans Bengali', sans-serif");
      let html = editor.getHTML();
      expect(html).toContain('Kalpurush');

      editor.setFontFamily("'Amiri', 'Noto Naskh Arabic', serif");
      html = editor.getHTML();
      expect(html).toContain('Amiri');
    });
  });

  describe('4. Subscript & Superscript', () => {
    it('toggles subscript mark on text', () => {
      editor.focus('all');
      editor.toggleSubscript();
      let html = editor.getHTML();
      expect(html).toContain('<sub>');

      editor.toggleSubscript();
      html = editor.getHTML();
      expect(html).not.toContain('<sub>');
    });

    it('toggles superscript mark on text', () => {
      editor.focus('all');
      editor.toggleSuperscript();
      let html = editor.getHTML();
      expect(html).toContain('<sup>');

      editor.toggleSuperscript();
      html = editor.getHTML();
      expect(html).not.toContain('<sup>');
    });
  });

  describe('5. Line Height', () => {
    it('sets and unsets line height on paragraphs and headings', () => {
      editor.setLineHeight('1.75');
      let html = editor.getHTML();
      expect(html).toContain('line-height: 1.75');

      editor.unsetLineHeight();
      html = editor.getHTML();
      expect(html).not.toContain('line-height: 1.75');
    });
  });

  describe('6. Indentation (Indent & Outdent)', () => {
    it('indents block nodes with margin levels', () => {
      editor.focus('all');
      editor.indent();
      let html = editor.getHTML();
      expect(html).toContain('margin-left: 24px');

      editor.indent();
      html = editor.getHTML();
      expect(html).toContain('margin-left: 48px');

      editor.outdent();
      html = editor.getHTML();
      expect(html).toContain('margin-left: 24px');

      editor.outdent();
      html = editor.getHTML();
      expect(html).not.toContain('margin-left');
    });
  });

  describe('7. Text Direction & RTL Support (dir="rtl", dir="ltr")', () => {
    it('sets RTL direction on block elements', () => {
      editor.setRtl();
      let html = editor.getHTML();
      expect(html).toContain('dir="rtl"');

      editor.setLtr();
      html = editor.getHTML();
      expect(html).toContain('dir="ltr"');
    });

    it('toggles text direction between LTR and RTL', () => {
      editor.setLtr();
      editor.toggleTextDirection();
      let html = editor.getHTML();
      expect(html).toContain('dir="rtl"');

      editor.toggleTextDirection();
      html = editor.getHTML();
      expect(html).toContain('dir="ltr"');
    });
  });

  describe('8. Multilingual Unicode Content Support', () => {
    it('preserves Bengali (Bangla) Unicode content and typography', () => {
      const banglaContent = '<p>আমাদের মাতৃভাষা বাংলা — সমৃদ্ধ সাহিত্য ও সংস্কৃতি।</p>';
      editor.setContent(banglaContent);
      expect(editor.getText()).toContain('আমাদের মাতৃভাষা বাংলা');
      expect(editor.getHTML()).toContain('আমাদের মাতৃভাষা বাংলা');
    });

    it('preserves Arabic and Urdu with RTL text direction', () => {
      const arabicContent = '<p dir="rtl">مرحبا بكم في محرر النصوص العالمي</p>';
      editor.setContent(arabicContent);
      expect(editor.getHTML()).toContain('dir="rtl"');
      expect(editor.getText()).toContain('مرحبا بكم في محرر النصوص العالمي');
    });

    it('preserves Hindi (Devanagari) script', () => {
      const hindiContent = '<p>नमस्ते दुनिया, यूनिवर्सल एडिटर में आपका स्वागत है।</p>';
      editor.setContent(hindiContent);
      expect(editor.getText()).toContain('नमस्ते दुनिया');
    });
  });
});
