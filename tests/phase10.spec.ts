import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UniversalEditor,
  detectEmbedProvider,
  ContentSanitizer,
  EmbedDialog,
} from '../packages/core/src';

describe('Phase 10: Media Embeds Suite', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('detectEmbedProvider', () => {
    it('detects standard YouTube watch URLs and converts to privacy-enhanced embed URL', () => {
      const result = detectEmbedProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('youtube');
      expect(result.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(result.title).toBe('YouTube Video');
    });

    it('detects youtu.be short URLs with timestamp', () => {
      const result = detectEmbedProvider('https://youtu.be/dQw4w9WgXcQ?t=120');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('youtube');
      expect(result.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=120');
    });

    it('detects standard Vimeo URLs and converts to player URL', () => {
      const result = detectEmbedProvider('https://vimeo.com/76979871');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('vimeo');
      expect(result.embedUrl).toBe('https://player.vimeo.com/video/76979871');
      expect(result.title).toBe('Vimeo Video');
    });

    it('detects Google Maps URLs', () => {
      const mapsUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1!2d-73.98!3d40.75';
      const result = detectEmbedProvider(mapsUrl);
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('google-maps');
      expect(result.embedUrl).toBe(mapsUrl);
    });

    it('detects direct HTML5 video files (.mp4, .webm, .ogg)', () => {
      const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const result = detectEmbedProvider(videoUrl);
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('video');
      expect(result.embedUrl).toBe(videoUrl);
      expect(result.title).toBe('HTML5 Video');
    });

    it('extracts iframe src from raw embed snippet', () => {
      const snippet = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0"></iframe>';
      const result = detectEmbedProvider(snippet);
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('youtube');
      expect(result.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });

    it('rejects untrusted domains for generic iframes by default', () => {
      const result = detectEmbedProvider('https://suspicious-malware-site.xyz/exploit');
      expect(result.valid).toBe(false);
      expect(result.error?.toLowerCase()).toContain('not in the trusted embed whitelist');
    });

    it('allows custom whitelist domains', () => {
      const result = detectEmbedProvider('https://my-internal-stream.company.org/player/1', {
        allowedDomains: ['company.org'],
      });
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('iframe');
    });

    it('rejects completely invalid inputs', () => {
      const result = detectEmbedProvider('not-a-valid-url-at-all');
      expect(result.valid).toBe(false);
    });
  });

  describe('UniversalEditor insertEmbed & Extension', () => {
    it('inserts a YouTube embed node into the document', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Before embed</p>',
      });

      const success = editor.insertEmbed({
        url: 'https://youtu.be/dQw4w9WgXcQ',
        alignment: 'center',
        width: '85%',
      });

      expect(success).toBe(true);
      const html = editor.getHTML();
      expect(html).toContain('data-type="embed"');
      expect(html).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(html).toContain('ue-embed-align-center');

      editor.destroy();
    });

    it('inserts an HTML5 video embed node into the document', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Video demo</p>',
      });

      const success = editor.insertEmbed({
        url: 'https://test-server.org/sample.mp4',
        width: '100%',
        alignment: 'left',
      });

      expect(success).toBe(true);
      const html = editor.getHTML();
      expect(html).toContain('data-type="embed"');
      expect(html).toContain('<video');
      expect(html).toContain('sample.mp4');
      expect(html).toContain('ue-embed-align-left');

      editor.destroy();
    });
  });

  describe('Security & ContentSanitizer Embed Rules', () => {
    const sanitizer = new ContentSanitizer();

    it('preserves trusted YouTube embed iframes', () => {
      const input = '<div data-type="embed"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="100%" height="420px"></iframe></div>';
      const output = sanitizer.sanitize(input);
      expect(output).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(output).toContain('<iframe');
    });

    it('preserves trusted Vimeo embed iframes', () => {
      const input = '<div data-type="embed"><iframe src="https://player.vimeo.com/video/76979871" allowfullscreen="true"></iframe></div>';
      const output = sanitizer.sanitize(input);
      expect(output).toContain('player.vimeo.com/video/76979871');
      expect(output).toContain('<iframe');
    });

    it('blocks and purges untrusted domain iframes', () => {
      const input = '<p>Intro</p><iframe src="https://attacker.evil.com/phish"></iframe><p>Outro</p>';
      const output = sanitizer.sanitize(input);
      expect(output).not.toContain('attacker.evil.com');
      expect(output).not.toContain('<iframe');
      expect(output).toContain('<p>Intro</p>');
      expect(output).toContain('<p>Outro</p>');
    });

    it('strips dangerous event handlers from iframes', () => {
      const input = '<iframe src="https://www.youtube-nocookie.com/embed/xyz" onload="alert(1)" onerror="alert(2)"></iframe>';
      const output = sanitizer.sanitize(input);
      expect(output).not.toContain('onload');
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('alert');
      expect(output).toContain('youtube-nocookie.com/embed/xyz');
    });

    it('preserves HTML5 video elements while stripping unsafe scripts', () => {
      const input = '<video src="https://cdn.example.com/movie.mp4" controls=""><track src="sub.vtt" /></video>';
      const output = sanitizer.sanitize(input);
      expect(output).toContain('<video');
      expect(output).toContain('movie.mp4');
    });
  });

  describe('EmbedDialog UI Component', () => {
    it('initializes and manages open / close lifecycle', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Testing Dialog</p>',
      });

      const dialog = new EmbedDialog(editor);
      expect(dialog.overlay).toBeDefined();

      dialog.open();
      expect(dialog.overlay.classList.contains('active')).toBe(true);

      dialog.close();
      expect(dialog.overlay.classList.contains('active')).toBe(false);

      dialog.destroy();
      editor.destroy();
    });
  });
});
