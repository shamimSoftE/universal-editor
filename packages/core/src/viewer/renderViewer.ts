import { generateHTML } from '@tiptap/core';
import { ContentSanitizer } from '../security/ContentSanitizer';
import { getViewerExtensions } from './viewerExtensions';
import type { ViewerOptions, ViewerRenderResult } from './types';

/**
 * Converts rich text content (HTML string or JSON document object)
 * into sanitized, secure, production-ready HTML for the viewer.
 */
export function renderViewerHTML(
  content: string | Record<string, any>,
  options: Partial<ViewerOptions> = {}
): string {
  const result = processViewerContent(content, options);
  return result.html;
}

/**
 * Core rendering pipeline returning HTML string and metadata.
 */
export function processViewerContent(
  content: string | Record<string, any>,
  options: Partial<ViewerOptions> = {}
): ViewerRenderResult {
  let rawHtml = '';
  let isJson = false;

  if (content && typeof content === 'object') {
    isJson = true;
    try {
      const extensions = getViewerExtensions();
      rawHtml = generateHTML(content as any, extensions);
    } catch (err) {
      console.error('[UniversalEditor] Failed to generate HTML from JSON doc:', err);
      rawHtml = '<p class="ue-viewer-error">Error rendering document content.</p>';
    }
  } else if (typeof content === 'string') {
    rawHtml = content;
  }

  // Sanitize content by default
  const shouldSanitize = options.sanitize !== false;
  let cleanHtml = shouldSanitize
    ? ContentSanitizer.sanitize(rawHtml, options.sanitizerConfig)
    : rawHtml;

  // Enhance code blocks with copy-button container if enabled
  if (options.enableCopyCode !== false && cleanHtml.includes('<pre')) {
    cleanHtml = enhanceCodeBlocks(cleanHtml);
  }

  return {
    html: cleanHtml,
    isJson,
  };
}

/**
 * Injects copy button and language badge into <pre><code ...> blocks
 * for the viewer if not already structured as a terminal code block.
 */
function enhanceCodeBlocks(html: string): string {
  // Matches <pre data-language="..." or <pre><code class="language-..."
  return html.replace(
    /<pre(?:\s+data-language="([^"]*)")?(?:\s+class="([^"]*)")*>([\s\S]*?)<\/pre>/gi,
    (match, dataLang, preClass, inner) => {
      // If already enhanced with a copy button or terminal header, preserve as is
      if (match.includes('ue-code-copy-btn') || match.includes('ue-code-header')) {
        return match;
      }

      // Detect language from data-language or code class
      let lang = dataLang || '';
      if (!lang) {
        const langMatch = inner.match(/class="(?:[^"]*\s+)?language-([^\s"]+)/i);
        if (langMatch) {
          lang = langMatch[1];
        }
      }

      const displayLang = lang || 'plaintext';
      const cleanPreClass = preClass ? ` ${preClass}` : '';

      return `
<div class="ue-code-block-viewer" data-language="${displayLang}">
  <div class="ue-code-header">
    <div class="ue-code-dots">
      <span class="ue-dot ue-dot-red"></span>
      <span class="ue-dot ue-dot-yellow"></span>
      <span class="ue-dot ue-dot-green"></span>
    </div>
    <span class="ue-code-lang">${displayLang}</span>
    <button type="button" class="ue-code-copy-btn" data-action="copy-code" title="Copy code snippet">
      <svg class="ue-copy-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="ue-copy-text">Copy</span>
    </button>
  </div>
  <pre${cleanPreClass} data-language="${displayLang}">${inner}</pre>
</div>`.trim();
    }
  );
}
