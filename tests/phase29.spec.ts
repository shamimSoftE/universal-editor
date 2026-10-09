import { describe, it, expect, beforeEach } from 'vitest';
import { ContentSanitizer } from '@universal-editor/core';

describe('Phase 29: Security Audit & Penetration Testing Matrix', () => {
  let sanitizer: ContentSanitizer;

  beforeEach(() => {
    ContentSanitizer.clearCache();
    sanitizer = new ContentSanitizer();
  });

  describe('1. SVG Vectors & Malicious Tag Neutralization', () => {
    it('strips <script> tags embedded inside SVG content', () => {
      const maliciousSvg = '<svg><script>alert("xss")</script><circle cx="5" cy="5" r="5"/></svg>';
      const sanitized = ContentSanitizer.sanitizeSvg(maliciousSvg);

      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<circle');
    });

    it('neutralizes <animate> and <set> event triggers in SVG', () => {
      const svgWithAnimate = '<svg><animate onbegin="alert(1)" attributeName="x" dur="1s"/><circle cx="10" cy="10" r="5"/></svg>';
      const sanitized = ContentSanitizer.sanitizeSvg(svgWithAnimate);

      expect(sanitized).not.toContain('<animate');
      expect(sanitized).not.toContain('onbegin');
      expect(sanitized).toContain('<circle');
    });

    it('purges <foreignObject> smuggling vectors in SVG', () => {
      const svgWithForeign = '<svg><foreignObject width="100" height="100"><iframe src="https://evil.com"></iframe></foreignObject><rect width="10" height="10"/></svg>';
      const sanitized = ContentSanitizer.sanitizeSvg(svgWithForeign);

      expect(sanitized).not.toContain('<foreignObject');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).toContain('<rect');
    });

    it('strips javascript: pseudo-protocols from SVG href and xlink:href', () => {
      const svgLinks = '<svg><a href="javascript:alert(1)"><text>Link</text></a><image xlink:href="javascript:evil()"/></svg>';
      const sanitized = ContentSanitizer.sanitizeSvg(svgLinks);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<text>Link</text>');
    });
  });

  describe('2. Base64 Data URL & Image Smuggling Defense', () => {
    it('detects and rejects base64 SVG data URLs smuggling <script> tags', () => {
      const payload = base64Encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const maliciousUrl = `data:image/svg+xml;base64,${payload}`;

      expect(sanitizer.isSafeUrl(maliciousUrl)).toBe(false);

      const html = `<p><img src="${maliciousUrl}" alt="Test"></p>`;
      const cleanHtml = sanitizer.sanitize(html);
      expect(cleanHtml).not.toContain(maliciousUrl);
    });

    it('detects and rejects base64 SVG data URLs smuggling inline event handlers', () => {
      const payload = base64Encode('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle cx="5" cy="5" r="5"/></svg>');
      const maliciousUrl = `data:image/svg+xml;base64,${payload}`;

      expect(sanitizer.isSafeUrl(maliciousUrl)).toBe(false);
    });

    it('detects and rejects base64 SVG data URLs with <foreignObject> injections', () => {
      const payload = base64Encode('<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject></svg>');
      const maliciousUrl = `data:image/svg+xml;base64,${payload}`;

      expect(sanitizer.isSafeUrl(maliciousUrl)).toBe(false);
    });

    it('allows clean, scriptless base64 SVG data URLs', () => {
      const payload = base64Encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="green"/></svg>');
      const safeUrl = `data:image/svg+xml;base64,${payload}`;

      expect(sanitizer.isSafeUrl(safeUrl)).toBe(true);

      const html = `<p><img src="${safeUrl}" alt="Vector Art"></p>`;
      const cleanHtml = sanitizer.sanitize(html);
      expect(cleanHtml).toContain(safeUrl);
    });

    it('allows safe raster image data URLs (JPEG, PNG, WebP, GIF)', () => {
      const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(sanitizer.isSafeUrl(pngData)).toBe(true);

      const webpData = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
      expect(sanitizer.isSafeUrl(webpData)).toBe(true);
    });
  });

  describe('3. Obfuscated Protocol & Entity Bypass Defense', () => {
    it('neutralizes hex entity encoded javascript: pseudo-protocols', () => {
      const hexPayload = '&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)';
      expect(sanitizer.isSafeUrl(hexPayload)).toBe(false);

      const html = `<a href="${hexPayload}">Click</a>`;
      expect(sanitizer.sanitize(html)).not.toContain('href');
    });

    it('neutralizes decimal entity encoded javascript: pseudo-protocols', () => {
      const decPayload = '&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(2)';
      expect(sanitizer.isSafeUrl(decPayload)).toBe(false);

      const html = `<a href="${decPayload}">Click</a>`;
      expect(sanitizer.sanitize(html)).not.toContain('href');
    });

    it('neutralizes named entity colon (javascript&colon;) pseudo-protocols', () => {
      const colonPayload = 'javascript&colon;alert(3)';
      expect(sanitizer.isSafeUrl(colonPayload)).toBe(false);

      const html = `<a href="${colonPayload}">Click</a>`;
      expect(sanitizer.sanitize(html)).not.toContain('href');
    });

    it('neutralizes whitespace and control-character obfuscated protocols', () => {
      const tabbed = 'jav\tascript:alert(4)';
      const newlined = 'java\r\nscript:alert(5)';
      const spaced = 'j a v a s c r i p t : alert(6)';

      expect(sanitizer.isSafeUrl(tabbed)).toBe(false);
      expect(sanitizer.isSafeUrl(newlined)).toBe(false);
      expect(sanitizer.isSafeUrl(spaced)).toBe(false);
    });

    it('blocks vbscript: and non-whitelisted protocol schemes', () => {
      expect(sanitizer.isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(sanitizer.isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(sanitizer.isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('4. Event Handlers & Disallowed HTML Tag Neutralization', () => {
    it('strips all inline on* event handlers from all elements', () => {
      const vectors = [
        '<img src="valid.jpg" onerror="alert(1)">',
        '<div onmouseover="alert(2)">hover</div>',
        '<p onclick="alert(3)">text</p>',
        '<input type="checkbox" onfocus="alert(4)">',
        '<span onload="alert(5)">label</span>',
      ];

      for (const vector of vectors) {
        const clean = sanitizer.sanitize(vector);
        expect(clean).not.toMatch(/on\w+\s*=/i);
        expect(clean).not.toContain('alert');
      }
    });

    it('purges unauthorized tags (<script>, <object>, <embed>, <applet>, <math>)', () => {
      const html = `
        <script>alert("dangerous")</script>
        <object data="bad.swf"></object>
        <embed src="bad.swf">
        <applet code="Malware.class"></applet>
        <math><mtext><table><mglyph><style><!-- comment --></style><img src=x onerror=alert(1)></math>
        <p>Safe content</p>
      `;

      const clean = sanitizer.sanitize(html);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('<object');
      expect(clean).not.toContain('<embed');
      expect(clean).not.toContain('<applet');
      expect(clean).not.toContain('<math');
      expect(clean).toContain('<p>Safe content</p>');
    });

    it('restricts <input> elements strictly to type="checkbox"', () => {
      const buttonInput = '<input type="button" value="Attack" onclick="alert(1)">';
      const textInput = '<input type="text" autofocus onfocus="alert(2)">';
      const checkboxInput = '<input type="checkbox" checked disabled>';

      const cleanButton = sanitizer.sanitize(buttonInput);
      const cleanText = sanitizer.sanitize(textInput);
      const cleanCheckbox = sanitizer.sanitize(checkboxInput);

      expect(cleanButton).not.toContain('type="button"');
      expect(cleanText).not.toContain('type="text"');
      expect(cleanCheckbox).toContain('type="checkbox"');
    });

    it('sanitizes URL attributes inside custom data- attributes', () => {
      const html = '<div data-type="embed" data-url="javascript:alert(1)" data-name="test">Content</div>';
      const clean = sanitizer.sanitize(html);

      expect(clean).not.toContain('data-url="javascript:alert(1)"');
      expect(clean).toContain('data-type="embed"');
      expect(clean).toContain('data-name="test"');
    });
  });

  describe('5. CSS Injection Attacks & Unsafe Style Attributes', () => {
    it('blocks CSS expression() execution in style attribute', () => {
      const html = '<p style="color: red; width: expression(alert(1));">Text</p>';
      const clean = sanitizer.sanitize(html);

      expect(clean).not.toContain('expression');
      expect(clean).not.toContain('style="');
    });

    it('blocks CSS behavior: url() attacks', () => {
      const html = '<div style="behavior: url(exploit.htc);">Block</div>';
      const clean = sanitizer.sanitize(html);

      expect(clean).not.toContain('behavior');
      expect(clean).not.toContain('style="');
    });

    it('blocks CSS javascript: and data: URLs in background-image styles', () => {
      const jsUrlHtml = '<div style="background-image: url(\'javascript:alert(1)\');">Box</div>';
      const dataUrlHtml = '<div style="background-image: url(\'data:image/svg+xml;base64,PHN2Zy8+\');">Box</div>';

      expect(sanitizer.sanitize(jsUrlHtml)).not.toContain('style="');
      expect(sanitizer.sanitize(dataUrlHtml)).not.toContain('style="');
    });

    it('blocks CSS @import and -moz-binding injection', () => {
      const importHtml = '<div style="@import url(\'https://evil.com/xss.css\');">Box</div>';
      const mozBindingHtml = '<div style="-moz-binding: url(\'https://evil.com/xss.xml#test\');">Box</div>';

      expect(sanitizer.sanitize(importHtml)).not.toContain('style="');
      expect(sanitizer.sanitize(mozBindingHtml)).not.toContain('style="');
    });

    it('preserves legitimate safe inline styles', () => {
      const html = '<p style="color: #3b82f6; font-size: 16px; text-align: center;">Styled Text</p>';
      const clean = sanitizer.sanitize(html);

      expect(clean).toContain('style="color: #3b82f6; font-size: 16px; text-align: center;"');
    });
  });

  describe('6. Prototype Pollution Defense in AST & JSON Parsing', () => {
    it('strips __proto__, constructor, and prototype in safeJsonParse', () => {
      const pollutedJson = '{"title":"Safe","__proto__":{"isAdmin":true},"constructor":{"prototype":{"hacked":true}}}';
      const parsed = ContentSanitizer.safeJsonParse(pollutedJson);

      expect(parsed.title).toBe('Safe');
      expect(parsed.__proto__).toBeUndefined();
      expect(parsed.constructor).toBeUndefined();
      // Ensure global Object prototype is untainted
      expect((({} as any).isAdmin)).toBeUndefined();
      expect((({} as any).hacked)).toBeUndefined();
    });

    it('sanitizes ProseMirror AST recursively against prototype pollution and dangerous attrs', () => {
      const rawAst = {
        type: 'doc',
        __proto__: { polluted: true },
        content: [
          {
            type: 'paragraph',
            attrs: {
              href: 'javascript:alert(1)',
              safeHref: 'https://example.com',
              __proto__: { bad: true },
            },
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };

      const cleanAst = ContentSanitizer.sanitizeJsonAST(rawAst);

      expect(cleanAst.__proto__).toBeUndefined();
      expect(cleanAst.content[0].attrs.href).toBeUndefined(); // Dangerous JS URL stripped
      expect(cleanAst.content[0].attrs.safeHref).toBe('https://example.com');
      expect(cleanAst.content[0].attrs.__proto__).toBeUndefined();
      expect(cleanAst.content[0].content[0].text).toBe('Hello World');
    });
  });

  describe('7. Content Security Policy (CSP) Generation & Auditing', () => {
    it('generates enterprise compliant CSP directives', () => {
      const directives = ContentSanitizer.generateCSPDirectives({
        scriptNonces: ['randomNonce123'],
        allowedEmbedDomains: ['youtube.com', 'player.vimeo.com'],
        reportUri: '/api/csp-report',
      });

      expect(directives['default-src']).toEqual(["'self'"]);
      expect(directives['script-src']).toContain("'nonce-randomNonce123'");
      expect(directives['frame-src']).toContain('https://youtube.com');
      expect(directives['frame-src']).toContain('https://player.vimeo.com');
      expect(directives['object-src']).toEqual(["'none'"]);
      expect(directives['report-uri']).toEqual(['/api/csp-report']);
    });

    it('formats CSP directives into a valid HTTP header string', () => {
      const directives = ContentSanitizer.generateCSPDirectives();
      const header = ContentSanitizer.formatCSPHeader(directives);

      expect(header).toContain("default-src 'self'");
      expect(header).toContain("object-src 'none'");
      expect(header).toContain("base-uri 'self'");
    });

    it('validates compliant CSP header and detects unsafe configurations', () => {
      const validHeader = ContentSanitizer.formatCSPHeader(ContentSanitizer.generateCSPDirectives());
      const auditResult = ContentSanitizer.validateCSPHeader(validHeader);

      expect(auditResult.valid).toBe(true);
      expect(auditResult.issues.length).toBe(0);

      // Insecure header with wildcard and unsafe-eval
      const insecureHeader = "script-src * 'unsafe-eval'; style-src *;";
      const failedAudit = ContentSanitizer.validateCSPHeader(insecureHeader);

      expect(failedAudit.valid).toBe(false);
      expect(failedAudit.issues.length).toBeGreaterThanOrEqual(2);
      expect(failedAudit.issues.some((i) => i.includes('unsafe-eval'))).toBe(true);
      expect(failedAudit.issues.some((i) => i.includes('*'))).toBe(true);
      expect(failedAudit.warnings.some((w) => w.includes('object-src'))).toBe(true);
    });
  });
});

function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}
