/**
 * Content Security & Sanitizer Types
 */

export interface SanitizerConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedProtocols?: string[];
  allowedIframeDomains?: string[];
  allowIframes?: boolean;
  allowDataImages?: boolean;
  stripUnsafeStyles?: boolean;
}

export interface SanitizerInterface {
  sanitize(html: string, options?: SanitizerConfig): string;
  isSafeUrl(url: string): boolean;
}
