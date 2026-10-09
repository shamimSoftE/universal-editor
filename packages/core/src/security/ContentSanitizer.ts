import type { SanitizerConfig, SanitizerInterface } from './types';
import { DEFAULT_ALLOWED_EMBED_DOMAINS } from '../embed/types';

export const DEFAULT_ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'code', 'pre', 'blockquote', 'ul', 'ol', 'li',
  'hr', 'br', 'a', 'img', 'figure', 'figcaption',
  'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'label', 'input', // Used in task lists
  'iframe', 'video', 'source',
];

export const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  '*': ['class', 'id', 'dir', 'style', 'title'],
  'a': ['href', 'target', 'rel', 'download'],
  'img': ['src', 'alt', 'title', 'width', 'height', 'data-alignment', 'data-width', 'data-caption'],
  'figure': ['class', 'style', 'data-alignment', 'data-width'],
  'div': ['class', 'style', 'data-type', 'data-url', 'data-name', 'data-size', 'data-file-type', 'data-language', 'data-provider', 'data-src', 'data-original-url', 'data-title', 'data-alignment'],
  'span': ['class', 'style', 'data-type', 'data-id', 'data-label', 'data-username', 'data-avatar', 'data-role'],
  'pre': ['class', 'data-language'],
  'code': ['class'],
  'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'class', 'style'],
  'video': ['src', 'controls', 'autoplay', 'muted', 'loop', 'poster', 'width', 'height', 'class', 'style'],
  'source': ['src', 'type'],
  'ul': ['data-type', 'class'],
  'li': ['data-type', 'data-checked', 'class'],
  'input': ['type', 'checked', 'disabled'],
  'th': ['colspan', 'rowspan', 'colwidth', 'style'],
  'td': ['colspan', 'rowspan', 'colwidth', 'style'],
};

export const DEFAULT_ALLOWED_PROTOCOLS = [
  'https:', 'http:', 'mailto:', 'tel:'
];

export class ContentSanitizer implements SanitizerInterface {
  private config: Required<SanitizerConfig>;
  private isDefaultConfig: boolean;
  private static cache = new Map<string, string>();
  private static MAX_CACHE_ENTRIES = 250;

  constructor(config: SanitizerConfig = {}) {
    this.isDefaultConfig = Object.keys(config).length === 0;
    this.config = {
      allowedTags: config.allowedTags || DEFAULT_ALLOWED_TAGS,
      allowedAttributes: config.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES,
      allowedProtocols: config.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS,
      allowedIframeDomains: config.allowedIframeDomains || DEFAULT_ALLOWED_EMBED_DOMAINS,
      allowIframes: config.allowIframes ?? true,
      allowDataImages: config.allowDataImages ?? true,
      stripUnsafeStyles: config.stripUnsafeStyles ?? true,
    };
  }

  public static clearCache(): void {
    ContentSanitizer.cache.clear();
  }

  public static getCacheSize(): number {
    return ContentSanitizer.cache.size;
  }

  /**
   * Static helper for direct sanitization
   */
  public static sanitize(html: string, config?: SanitizerConfig): string {
    const instance = new ContentSanitizer(config);
    return instance.sanitize(html);
  }

  /**
   * Static helper to check if a URL is safe
   */
  public static isSafeUrlStatic(url: string, config?: SanitizerConfig): boolean {
    const instance = new ContentSanitizer(config);
    return instance.isSafeUrl(url);
  }

  /**
   * Static helper for SVG sanitization
   */
  public static sanitizeSvg(svg: string): string {
    if (!svg || typeof svg !== 'string') return '';
    return svg
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*\/?\s*>/gi, '')
      .replace(/\s*on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '')
      .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
      .replace(/href\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\1/gi, '')
      .replace(/xlink:href\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\1/gi, '')
      .replace(/<\s*foreignObject[^>]*>[\s\S]*?<\s*\/\s*foreignObject\s*>/gi, '')
      .replace(/<\s*foreignObject[^>]*\/?\s*>/gi, '')
      .replace(/<\s*animate[^>]*>[\s\S]*?<\s*\/\s*animate\s*>/gi, '')
      .replace(/<\s*animate[^>]*\/?\s*>/gi, '')
      .replace(/<\s*set[^>]*>[\s\S]*?<\s*\/\s*set\s*>/gi, '')
      .replace(/<\s*set[^>]*\/?\s*>/gi, '')
      .replace(/<\s*use[^>]*\/?\s*>/gi, '')
      .trim();
  }

  /**
   * Prototype-pollution safe JSON parsing
   */
  public static safeJsonParse<T = any>(jsonString: string): T {
    const raw = JSON.parse(jsonString, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined; // Stripped completely
      }
      return value;
    });

    const purify = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(purify);
      const nullProto: Record<string, any> = Object.create(null);
      for (const k of Object.keys(obj)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        nullProto[k] = purify(obj[k]);
      }
      return nullProto;
    };

    return purify(raw);
  }

  /**
   * Sanitizes a ProseMirror AST tree recursively to prevent prototype pollution and dangerous node attributes
   */
  public static sanitizeJsonAST(node: any): any {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
      return node.map((child) => ContentSanitizer.sanitizeJsonAST(child));
    }

    const clean: Record<string, any> = Object.create(null);
    for (const key of Object.keys(node)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      const val = node[key];
      if (key === 'attrs' && val && typeof val === 'object') {
        const cleanAttrs: Record<string, any> = Object.create(null);
        for (const attrKey of Object.keys(val)) {
          if (attrKey === '__proto__' || attrKey === 'constructor' || attrKey === 'prototype') {
            continue;
          }
          const attrVal = val[attrKey];
          if (
            typeof attrVal === 'string' &&
            (attrKey.includes('url') || attrKey.includes('src') || attrKey.includes('href'))
          ) {
            if (ContentSanitizer.isSafeUrlStatic(attrVal)) {
              cleanAttrs[attrKey] = attrVal;
            }
          } else {
            cleanAttrs[attrKey] = attrVal;
          }
        }
        clean.attrs = cleanAttrs;
      } else if (typeof val === 'object') {
        clean[key] = ContentSanitizer.sanitizeJsonAST(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }

  /**
   * Generates enterprise Content Security Policy header directives tailored for Universal Editor
   */
  public static generateCSPDirectives(
    options: {
      scriptNonces?: string[];
      allowedEmbedDomains?: string[];
      reportUri?: string;
    } = {}
  ): Record<string, string[]> {
    const embedDomains = options.allowedEmbedDomains || DEFAULT_ALLOWED_EMBED_DOMAINS;
    const frameSources = ["'self'", ...embedDomains.map((d) => `https://${d}`)];
    const scriptSources = ["'self'"];
    if (options.scriptNonces?.length) {
      options.scriptNonces.forEach((n) => scriptSources.push(`'nonce-${n}'`));
    }

    const directives: Record<string, string[]> = {
      'default-src': ["'self'"],
      'script-src': scriptSources,
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'frame-src': frameSources,
      'connect-src': ["'self'", 'https:', 'wss:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    };

    if (options.reportUri) {
      directives['report-uri'] = [options.reportUri];
    }

    return directives;
  }

  public static formatCSPHeader(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([k, v]) => `${k} ${v.join(' ')}`)
      .join('; ');
  }

  /**
   * Enterprise CSP validator that audits a CSP header string against security best practices
   */
  public static validateCSPHeader(cspHeader: string): {
    valid: boolean;
    issues: string[];
    warnings: string[];
    parsedDirectives: Record<string, string[]>;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const parsedDirectives: Record<string, string[]> = {};

    if (!cspHeader || typeof cspHeader !== 'string') {
      return { valid: false, issues: ['CSP header is empty or not a string'], warnings, parsedDirectives };
    }

    const tokens = cspHeader.split(';').map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const parts = token.split(/\s+/);
      const directive = parts[0].toLowerCase();
      const sources = parts.slice(1);
      parsedDirectives[directive] = sources;
    }

    // Check 1: Must define default-src or script-src
    if (!parsedDirectives['default-src'] && !parsedDirectives['script-src']) {
      issues.push("Missing 'default-src' and 'script-src' directives; allows arbitrary script loading.");
    }

    // Check 2: script-src security checks
    const scriptSrc = parsedDirectives['script-src'] || parsedDirectives['default-src'] || [];
    if (scriptSrc.includes("'unsafe-eval'")) {
      issues.push("Directive 'script-src' contains ''unsafe-eval'', enabling arbitrary code execution.");
    }
    if (scriptSrc.includes('*')) {
      issues.push("Directive 'script-src' contains wildcard '*' allowing scripts from any host.");
    }
    if (scriptSrc.includes("'unsafe-inline'") && !scriptSrc.some((s) => s.startsWith("'nonce-") || s.startsWith("'sha256-"))) {
      warnings.push("Directive 'script-src' contains ''unsafe-inline'' without nonce or hash protection.");
    }

    // Check 3: object-src must be 'none' or restricted
    const objectSrc = parsedDirectives['object-src'];
    if (!objectSrc) {
      warnings.push("Missing 'object-src' directive. Recommend setting 'object-src \\'none\\'' to prevent Flash/plugin exploits.");
    } else if (!objectSrc.includes("'none'")) {
      warnings.push("'object-src' should be restricted to ''none''.");
    }

    // Check 4: base-uri restriction
    if (!parsedDirectives['base-uri']) {
      warnings.push("Missing 'base-uri' directive. Recommend setting 'base-uri \\'self\\'' to prevent base-tag hijacking.");
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      parsedDirectives,
    };
  }

  /**
   * Validate if a URL uses a safe protocol
   */
  public isSafeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const trimmed = url.trim().replace(/[\x00-\x20\s]+/g, ''); // strip hidden whitespace & control characters

    // Decode HTML entities if any (including full hex and dec numeric character references)
    const decoded = trimmed
      .replace(/&colon;/gi, ':')
      .replace(/&#0*58;?/gi, ':')
      .replace(/&#x0*3a;?/gi, ':')
      .replace(/&#[xX]0*([0-9a-fA-F]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#0*([0-9]+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

    // Re-strip control characters or spaces that might have been unmasked by entity decoding
    const normalized = decoded.replace(/[\x00-\x20\s]+/g, '');

    // Reject dangerous pseudo-protocols
    if (/^(javascript|vbscript|data):/i.test(normalized)) {
      // Allow data:image only for safe raster images or verified scriptless SVGs
      if (this.config.allowDataImages) {
        if (/^data:image\/(jpeg|png|webp|gif);base64,/i.test(normalized)) {
          return true;
        }
        if (/^data:image\/svg\+xml;base64,/i.test(normalized)) {
          try {
            const rawB64 = normalized.split(',')[1] || '';
            const decodedSvg =
              typeof atob !== 'undefined'
                ? atob(rawB64)
                : typeof Buffer !== 'undefined'
                ? Buffer.from(rawB64, 'base64').toString('utf-8')
                : '';
            if (/<script|on\w+\s*=|javascript:|vbscript:|xlink:href|<foreignObject|<animate|<set|<use/i.test(decodedSvg)) {
              return false;
            }
            return true;
          } catch {
            return false;
          }
        }
      }
      return false;
    }

    // Relative URLs and anchor links are safe
    if (decoded.startsWith('/') || decoded.startsWith('#') || decoded.startsWith('./') || decoded.startsWith('../')) {
      return true;
    }

    try {
      const parsed = new URL(decoded, 'http://localhost');
      return this.config.allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if an iframe src belongs to a trusted provider domain
   */
  public isSafeIframeSrc(src: string): boolean {
    if (!this.config.allowIframes || !src || typeof src !== 'string') return false;
    try {
      const parsed = new URL(src);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const hostname = parsed.hostname.toLowerCase();
      const domains = this.config.allowedIframeDomains || DEFAULT_ALLOWED_EMBED_DOMAINS;
      return domains.some(d => hostname === d || hostname.endsWith(`.${d}`));
    } catch {
      return false;
    }
  }

  /**
   * Sanitize an inline CSS style string
   */
  public sanitizeStyle(style: string): string {
    if (!this.config.stripUnsafeStyles || !style) return '';

    // Strip CSS expressions, behavior, javascript in url, data in url, and dangerous imports
    if (
      /expression\s*\(/i.test(style) ||
      /behavior\s*:/i.test(style) ||
      /url\s*\(\s*['"]?\s*javascript:/i.test(style) ||
      /url\s*\(\s*['"]?\s*data:/i.test(style) ||
      /@import/i.test(style) ||
      /-moz-binding/i.test(style)
    ) {
      return '';
    }

    return style;
  }

  /**
   * Sanitize an HTML string, removing all XSS vectors
   */
  public sanitize(html: string): string {
    if (!html || typeof html !== 'string') return '';

    const cacheKey = html;
    if (this.isDefaultConfig && ContentSanitizer.cache.has(cacheKey)) {
      return ContentSanitizer.cache.get(cacheKey)!;
    }

    // Pre-filtering: remove dangerous script, object, embed, applet, math, and style tags before parsing
    let cleaned = html
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*\/?\s*>/gi, '')
      .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
      .replace(/<\s*object[^>]*\/?\s*>/gi, '')
      .replace(/<\s*embed[^>]*>[\s\S]*?<\s*\/\s*embed\s*>/gi, '')
      .replace(/<\s*embed[^>]*\/?\s*>/gi, '')
      .replace(/<\s*applet[^>]*>[\s\S]*?<\s*\/\s*applet\s*>/gi, '')
      .replace(/<\s*applet[^>]*\/?\s*>/gi, '')
      .replace(/<\s*math[^>]*>[\s\S]*?<\s*\/\s*math\s*>/gi, '')
      .replace(/<\s*math[^>]*\/?\s*>/gi, '')
      .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
      .replace(/<\s*style[^>]*\/?\s*>/gi, '');

    if (typeof document === 'undefined') {
      // Regex fallback if run in pure Node without DOM
      const result = this.regexFallbackSanitize(cleaned);
      if (this.isDefaultConfig && html.length < 50000) {
        if (ContentSanitizer.cache.size >= ContentSanitizer.MAX_CACHE_ENTRIES) {
          const firstKey = ContentSanitizer.cache.keys().next().value;
          if (firstKey !== undefined) ContentSanitizer.cache.delete(firstKey);
        }
        ContentSanitizer.cache.set(cacheKey, result);
      }
      return result;
    }

    const template = document.createElement('template');
    template.innerHTML = cleaned;

    const root = template.content || template;
    this.cleanNode(root);

    const result = template.innerHTML;
    if (this.isDefaultConfig && html.length < 50000) {
      if (ContentSanitizer.cache.size >= ContentSanitizer.MAX_CACHE_ENTRIES) {
        const firstKey = ContentSanitizer.cache.keys().next().value;
        if (firstKey !== undefined) ContentSanitizer.cache.delete(firstKey);
      }
      ContentSanitizer.cache.set(cacheKey, result);
    }
    return result;
  }

  private cleanNode(node: Node): void {
    const toRemove: Node[] = [];

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 1. Tag whitelist validation
        if (!this.config.allowedTags.includes(tagName)) {
          toRemove.push(child);
          return;
        }

        // 1b. Strict Iframe Whitelist Validation
        if (tagName === 'iframe') {
          const iframeSrc = el.getAttribute('src') || '';
          if (!this.isSafeIframeSrc(iframeSrc)) {
            toRemove.push(child);
            return;
          }
        }

        // 2. Attribute cleaning
        const attrs = Array.from(el.attributes);
        const globalAllowed = this.config.allowedAttributes['*'] || [];
        const tagAllowed = this.config.allowedAttributes[tagName] || [];
        const allowedForTag = new Set([...globalAllowed, ...tagAllowed]);

        attrs.forEach((attr) => {
          const attrName = attr.name.toLowerCase();

          // Block all on* inline event handlers (onerror, onclick, onload, etc.)
          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
            return;
          }

          // Check attribute whitelist
          if (!allowedForTag.has(attrName)) {
            if (attrName.startsWith('data-')) {
              if (attrName.endsWith('url') || attrName.endsWith('src') || attrName.endsWith('href')) {
                if (!this.isSafeUrl(attr.value)) {
                  el.removeAttribute(attr.name);
                  return;
                }
              }
            } else {
              el.removeAttribute(attr.name);
              return;
            }
          } else {
            if (attrName.startsWith('data-') && (attrName.endsWith('url') || attrName.endsWith('src') || attrName.endsWith('href'))) {
              if (!this.isSafeUrl(attr.value)) {
                el.removeAttribute(attr.name);
                return;
              }
            }
          }

          // Restrict input tag: only checkbox is permitted
          if (tagName === 'input') {
            if (attrName === 'type' && attr.value.toLowerCase() !== 'checkbox') {
              el.removeAttribute(attr.name);
              return;
            }
          }

          // Validate URLs on href and src
          if (attrName === 'href' || attrName === 'src') {
            if (!this.isSafeUrl(attr.value)) {
              el.removeAttribute(attr.name);
              return;
            }
          }

          // Validate style attributes
          if (attrName === 'style') {
            const safeStyle = this.sanitizeStyle(attr.value);
            if (safeStyle) {
              el.setAttribute('style', safeStyle);
            } else {
              el.removeAttribute('style');
            }
          }
        });

        // Recursively clean children
        this.cleanNode(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        toRemove.push(child);
      }
    });

    toRemove.forEach(child => child.parentNode?.removeChild(child));
  }

  private regexFallbackSanitize(html: string): string {
    // Basic regex stripper for environments without any DOM
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*(['"]?)\s*javascript:[^'"]*\1/gi, '')
      .replace(/src\s*=\s*(['"]?)\s*javascript:[^'"]*\1/gi, '');
  }
}
