export type EmbedProvider = 'youtube' | 'vimeo' | 'google-maps' | 'video' | 'iframe';

export interface EmbedDetectionResult {
  valid: boolean;
  provider: EmbedProvider;
  embedUrl: string;
  originalUrl: string;
  title?: string;
  error?: string;
}

export interface EmbedAttributes {
  src: string;
  provider: EmbedProvider;
  originalUrl: string;
  width?: string;
  height?: string;
  title?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface EmbedConfig {
  allowedProviders?: EmbedProvider[];
  allowedDomains?: string[];
  allowGenericIframe?: boolean;
  defaultWidth?: string;
  defaultHeight?: string;
}

export const DEFAULT_ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
];
