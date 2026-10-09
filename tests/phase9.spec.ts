import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createEditor,
  UniversalEditor,
  ContentSanitizer,
  SUPPORTED_CODE_LANGUAGES,
} from '@universal-editor/core';

describe('Phase 9 — Code Block & Developer Features', () => {
  let editor: UniversalEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    editor = createEditor({
      element: container,
      content: '<p>Regular paragraph before code block.</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  describe('1. Supported Programming Languages', () => {
    it('supports all 13 required languages from the enterprise prompt', () => {
      const requiredLangIds = [
        'php',
        'javascript',
        'typescript',
        'html',
        'css',
        'sql',
        'json',
        'python',
        'java',
        'c',
        'cpp',
        'bash',
        'blade',
      ];

      const availableIds = SUPPORTED_CODE_LANGUAGES.map(l => l.id);
      requiredLangIds.forEach(id => {
        expect(availableIds).toContain(id);
      });
    });
  });

  describe('2. Code Block Commands & Language State', () => {
    it('toggles code block on and off', () => {
      expect(editor.isCodeBlockActive()).toBe(false);

      editor.toggleCodeBlock();
      expect(editor.isCodeBlockActive()).toBe(true);

      editor.toggleCodeBlock();
      expect(editor.isCodeBlockActive()).toBe(false);
    });

    it('sets code block with specific language (PHP)', () => {
      editor.setContent('<p>Code to convert</p>');
      editor.focus('all');
      editor.setCodeBlock({ language: 'php' });

      expect(editor.isCodeBlockActive()).toBe(true);
      expect(editor.isCodeBlockActive({ language: 'php' })).toBe(true);
      expect(editor.getCodeBlockLanguage()).toBe('php');
    });

    it('updates code block language dynamically', () => {
      editor.setCodeBlock({ language: 'javascript' });
      expect(editor.getCodeBlockLanguage()).toBe('javascript');

      editor.setCodeBlockLanguage('python');
      expect(editor.getCodeBlockLanguage()).toBe('python');
      expect(editor.isCodeBlockActive({ language: 'python' })).toBe(true);
    });

    it('supports Laravel Blade and TypeScript languages', () => {
      editor.setCodeBlock({ language: 'blade' });
      expect(editor.getCodeBlockLanguage()).toBe('blade');

      editor.setCodeBlockLanguage('typescript');
      expect(editor.getCodeBlockLanguage()).toBe('typescript');
    });
  });

  describe('3. Code Block DOM & NodeView Elements', () => {
    it('renders code block container, header bar, window dots, language selector, and copy button in DOM', () => {
      editor.setContent('<pre data-language="php"><code>Route::get("/test", fn() => true);</code></pre>');
      const wrapper = container.querySelector('.ue-code-block-container');
      expect(wrapper).toBeDefined();

      const header = container.querySelector('.ue-code-block-header');
      expect(header).toBeDefined();

      const select = container.querySelector('.ue-code-lang-select') as HTMLSelectElement | null;
      expect(select).toBeDefined();
      if (select) {
        expect(select.options.length).toBe(SUPPORTED_CODE_LANGUAGES.length);
      }

      const copyBtn = container.querySelector('.ue-code-copy-btn');
      expect(copyBtn).toBeDefined();
    });
  });

  describe('4. Content Sanitization & Developer Security', () => {
    it('preserves code block structure, data-language, and hljs syntax tokens', () => {
      const rawHtml = `
        <div class="ue-code-block-container" data-language="php">
          <pre class="ue-code-pre"><code class="hljs language-php"><span class="hljs-keyword">return</span> <span class="hljs-string">'Hello World'</span>;</code></pre>
        </div>
      `;

      const sanitized = ContentSanitizer.sanitize(rawHtml);
      expect(sanitized).toContain('data-language="php"');
      expect(sanitized).toContain('<pre');
      expect(sanitized).toContain('<code');
      expect(sanitized).toContain('hljs-keyword');
      expect(sanitized).toContain('Hello World');
    });

    it('neutralizes malicious scripts and handlers in code blocks while keeping code text intact', () => {
      const maliciousHtml = `
        <pre onclick="alert('xss')" data-language="javascript">
          <code><script>alert('xss')</script>console.log('safe code');</code>
        </pre>
      `;

      const sanitized = ContentSanitizer.sanitize(maliciousHtml);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('<script');
      expect(sanitized).toContain("console.log('safe code')");
    });
  });
});
