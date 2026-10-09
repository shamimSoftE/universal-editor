import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContentSanitizer, createEditor, UniversalEditor } from '@universal-editor/core';

describe('Phase 6 — ContentSanitizer & Security Engine', () => {
  let sanitizer: ContentSanitizer;

  beforeEach(() => {
    sanitizer = new ContentSanitizer();
  });

  describe('1. Script Tag Elimination', () => {
    it('strips standard <script> tags and inner code', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
      expect(output).toContain('<p>Hello</p>');
      expect(output).toContain('<p>World</p>');
    });

    it('strips case-insensitive and whitespace-manipulated script tags', () => {
      const input = '<ScRiPt type="text/javascript">window.location="evil.com"</sCrIpt><p>Safe</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('evil.com');
      expect(output).toContain('<p>Safe</p>');
    });

    it('strips self-closing or unclosed script tags', () => {
      const input = '<p>Test</p><script src="https://evil.com/payload.js" /><p>After</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('evil.com/payload.js');
    });
  });

  describe('2. Inline Event Handler Removal', () => {
    it('removes onerror handler from image tags', () => {
      const input = '<img src="invalid.jpg" onerror="alert(document.cookie)">';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('alert');
      expect(output).toContain('<img');
    });

    it('removes onclick, onmouseover, onload handlers from various elements', () => {
      const input = '<div onclick="hack()" onmouseover="steal()"><p onload="exec()">Click me</p></div>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('onclick');
      expect(output).not.toContain('onmouseover');
      expect(output).not.toContain('onload');
      expect(output).not.toContain('hack');
      expect(output).toContain('Click me');
    });
  });

  describe('3. Pseudo-protocol URL Attacks (javascript:, vbscript:, data:)', () => {
    it('removes javascript: protocol from anchor href', () => {
      const input = '<a href="javascript:alert(\'pwned\')">Click Here</a>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('pwned');
      expect(output).toContain('Click Here');
    });

    it('removes entity-encoded javascript: protocol in links', () => {
      const input = '<a href="jav&#x00061;script:alert(1)">Steal</a>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('alert');
    });

    it('removes vbscript: protocol from links', () => {
      const input = '<a href="vbscript:msgbox(1)">Visual Basic</a>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('vbscript:');
    });

    it('allows safe http, https, mailto, and tel protocols', () => {
      expect(sanitizer.isSafeUrl('https://example.com/page')).toBe(true);
      expect(sanitizer.isSafeUrl('http://example.com')).toBe(true);
      expect(sanitizer.isSafeUrl('mailto:user@example.com')).toBe(true);
      expect(sanitizer.isSafeUrl('tel:+1234567890')).toBe(true);
      expect(sanitizer.isSafeUrl('/relative/path/image.png')).toBe(true);
      expect(sanitizer.isSafeUrl('#anchor-target')).toBe(true);
    });

    it('allows valid base64 data images when enabled', () => {
      const safeDataImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      expect(sanitizer.isSafeUrl(safeDataImg)).toBe(true);

      const dangerousDataHtml = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
      expect(sanitizer.isSafeUrl(dangerousDataHtml)).toBe(false);
    });
  });

  describe('4. Dangerous Embedding Tags (iframe, object, embed)', () => {
    it('removes <iframe> tags completely', () => {
      const input = '<p>Pre</p><iframe src="https://attacker.com/cookie-stealer"></iframe><p>Post</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('<iframe');
      expect(output).not.toContain('attacker.com');
      expect(output).toContain('<p>Pre</p>');
      expect(output).toContain('<p>Post</p>');
    });

    it('removes <object> and <embed> tags completely', () => {
      const input = '<object data="evil.swf"></object><embed src="evil.swf"></embed><p>Content</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('<object');
      expect(output).not.toContain('<embed');
      expect(output).not.toContain('evil.swf');
      expect(output).toContain('<p>Content</p>');
    });
  });

  describe('5. Unsafe CSS & Style Injections', () => {
    it('strips CSS expression() and behavior from inline styles', () => {
      const input = '<p style="color: red; width: expression(alert(1));">Text</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('expression');
      expect(output).not.toContain('alert');
    });

    it('strips javascript: urls inside CSS background property', () => {
      const input = '<div style="background-image: url(\'javascript:alert(1)\')">Box</div>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('alert');
    });

    it('preserves safe inline styles like text-align or font-weight', () => {
      const input = '<p style="text-align: center;">Centered</p>';
      const output = ContentSanitizer.sanitize(input);
      expect(output).toContain('style="text-align: center;"');
    });
  });

  describe('6. SVG Sanitization (sanitizeSvg)', () => {
    it('removes <script> and onload attributes from SVG content', () => {
      const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert('xss')">
        <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
        <script>alert(document.cookie);</script>
      </svg>`;
      const cleanSvg = ContentSanitizer.sanitizeSvg(rawSvg);
      expect(cleanSvg).not.toContain('<script>');
      expect(cleanSvg).not.toContain('onload');
      expect(cleanSvg).not.toContain('document.cookie');
      expect(cleanSvg).toContain('<circle cx="50" cy="50" r="40"');
    });

    it('removes foreignObject and javascript xlink href from SVG', () => {
      const rawSvg = `<svg><a xlink:href="javascript:alert(1)"><circle r="10"/></a><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(2)</script></body></foreignObject></svg>`;
      const cleanSvg = ContentSanitizer.sanitizeSvg(rawSvg);
      expect(cleanSvg).not.toContain('javascript:');
      expect(cleanSvg).not.toContain('foreignObject');
      expect(cleanSvg).not.toContain('<script>');
    });
  });

  describe('7. Editor Integration: editor.getSanitizedHTML()', () => {
    let editor: UniversalEditor;
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      editor = createEditor({
        element: container,
        content: '<p>Initial clean text</p>',
      });
    });

    afterEach(() => {
      editor.destroy();
      container.remove();
    });

    it('returns sanitized HTML directly from editor instance', () => {
      const sanitized = editor.getSanitizedHTML();
      expect(sanitized).toContain('<p>Initial clean text</p>');
    });

    it('filters out injected tags via getSanitizedHTML()', () => {
      // Intentionally insert content that includes script-like elements
      editor.setContent('<p>Normal text</p><img src="x" onerror="alert(1)">');
      const sanitized = editor.getSanitizedHTML();
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Normal text</p>');
    });
  });

  describe('8. Custom Configuration Override', () => {
    it('supports custom allowed tags', () => {
      const customSanitizer = new ContentSanitizer({
        allowedTags: ['p', 'strong'],
      });
      const input = '<p>Allowed</p><h1>Heading removed</h1><strong>Bold allowed</strong>';
      const output = customSanitizer.sanitize(input);
      expect(output).toContain('<p>Allowed</p>');
      expect(output).toContain('<strong>Bold allowed</strong>');
      expect(output).not.toContain('<h1>Heading removed</h1>');
    });
  });
});
