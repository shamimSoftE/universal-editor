import type { SanitizerConfig } from '../security/types';

export interface ViewerOptions {
  /**
   * HTML string or ProseMirror JSON document object
   */
  content: string | Record<string, any>;

  /**
   * Whether to sanitize HTML using ContentSanitizer (default: true)
   */
  sanitize?: boolean;

  /**
   * Optional custom sanitizer configuration
   */
  sanitizerConfig?: SanitizerConfig;

  /**
   * Whether to apply dark mode styling
   */
  darkMode?: boolean;

  /**
   * Color theme: 'dark' | 'light' | 'auto' (default: 'auto')
   */
  theme?: 'dark' | 'light' | 'auto';

  /**
   * Enable one-click copy button on code blocks (default: true)
   */
  enableCopyCode?: boolean;

  /**
   * Enable lightbox modal when clicking images (default: true)
   */
  enableImageLightbox?: boolean;

  /**
   * Enable responsive 16:9 wrappers for iframe embeds (default: true)
   */
  responsiveEmbeds?: boolean;

  /**
   * Enable print-optimized styling rules (default: true)
   */
  printOptimized?: boolean;

  /**
   * Optional custom CSS class name for the viewer container
   */
  className?: string;
}

export interface ViewerRenderResult {
  html: string;
  isJson: boolean;
}

export interface ViewerImageClickPayload {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  event: MouseEvent;
}

export interface ViewerLinkClickPayload {
  href: string;
  target?: string;
  event: MouseEvent;
}
