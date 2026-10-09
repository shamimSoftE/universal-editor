import type { EmbedDetectionResult, EmbedConfig } from './types';
import { DEFAULT_ALLOWED_EMBED_DOMAINS } from './types';

export function detectEmbedProvider(
  rawUrl: string,
  config?: EmbedConfig
): EmbedDetectionResult {
  let url = (rawUrl || '').trim();
  if (!url) {
    return {
      valid: false,
      provider: 'iframe',
      embedUrl: '',
      originalUrl: '',
      error: 'URL is required',
    };
  }

  // Support raw iframe embed snippets: <iframe ... src="..." ...></iframe>
  const iframeMatch = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    url = iframeMatch[1].trim();
  }

  // Basic protocol check
  if (!/^https?:\/\//i.test(url)) {
    return {
      valid: false,
      provider: 'iframe',
      embedUrl: '',
      originalUrl: url,
      error: 'URL must start with http:// or https://',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      valid: false,
      provider: 'iframe',
      embedUrl: '',
      originalUrl: url,
      error: 'Invalid URL format',
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const allowedDomains = config?.allowedDomains || DEFAULT_ALLOWED_EMBED_DOMAINS;

  // 1. YouTube Detection
  if (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'youtu.be' ||
    hostname === 'youtube-nocookie.com' ||
    hostname === 'www.youtube-nocookie.com'
  ) {
    let videoId = '';
    let timeParam = parsedUrl.searchParams.get('t') || parsedUrl.searchParams.get('start') || '';

    if (hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1).split('/')[0];
    } else if (parsedUrl.pathname.startsWith('/embed/')) {
      videoId = parsedUrl.pathname.replace('/embed/', '').split('/')[0];
    } else if (parsedUrl.pathname.startsWith('/shorts/')) {
      videoId = parsedUrl.pathname.replace('/shorts/', '').split('/')[0];
    } else {
      videoId = parsedUrl.searchParams.get('v') || '';
    }

    if (videoId) {
      // Clean video ID
      videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
      const startQuery = timeParam ? `?start=${parseInt(timeParam, 10)}` : '';
      return {
        valid: true,
        provider: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}${startQuery}`,
        originalUrl: url,
        title: 'YouTube Video',
      };
    }
  }

  // 2. Vimeo Detection
  if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com' || hostname === 'player.vimeo.com') {
    let videoId = '';
    if (hostname === 'player.vimeo.com') {
      videoId = parsedUrl.pathname.replace('/video/', '').split('/')[0];
    } else {
      const match = /\/(\d+)/.exec(parsedUrl.pathname);
      if (match) videoId = match[1];
    }

    if (videoId) {
      return {
        valid: true,
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        originalUrl: url,
        title: 'Vimeo Video',
      };
    }
  }

  // 3. Google Maps Detection
  if (
    (hostname.includes('google.') && parsedUrl.pathname.includes('/maps')) ||
    hostname === 'maps.google.com' ||
    hostname === 'maps.app.goo.gl'
  ) {
    let embedUrl = url;
    if (!parsedUrl.pathname.includes('/embed')) {
      // If it's a standard google maps link, convert to embed search query or keep as embed
      const q = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query');
      if (q) {
        embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14602!2m1!1s${encodeURIComponent(q)}!5e0!3m2!1sen!2s`;
      } else {
        embedUrl = `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(parsedUrl.pathname)}`;
      }
    }
    return {
      valid: true,
      provider: 'google-maps',
      embedUrl,
      originalUrl: url,
      title: 'Google Maps',
    };
  }

  // 4. Direct HTML5 Video File Detection (.mp4, .webm, .ogg)
  const isVideoExt = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(parsedUrl.pathname);
  if (isVideoExt) {
    return {
      valid: true,
      provider: 'video',
      embedUrl: url,
      originalUrl: url,
      title: 'HTML5 Video',
    };
  }

  // 5. Generic Iframe / Configurable Whitelist Check
  const isDomainAllowed = allowedDomains.some(
    d => hostname === d || hostname.endsWith(`.${d}`)
  );

  if (isDomainAllowed || config?.allowGenericIframe) {
    return {
      valid: true,
      provider: 'iframe',
      embedUrl: url,
      originalUrl: url,
      title: parsedUrl.hostname,
    };
  }

  return {
    valid: false,
    provider: 'iframe',
    embedUrl: '',
    originalUrl: url,
    error: `Domain "${hostname}" is not in the trusted embed whitelist.`,
  };
}
