import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { renderViewerHTML, processViewerContent, getViewerExtensions } from '@universal-editor/core';
import { RichTextViewer } from '@universal-editor/vue3';

describe('Phase 15: Read-Only & Viewer Mode', () => {
  describe('Core Viewer Pipeline (renderViewerHTML)', () => {
    it('renders basic semantic HTML content correctly', () => {
      const input = '<h1>Title</h1><p>This is a <strong>test</strong> paragraph.</p>';
      const html = renderViewerHTML(input);

      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<p>This is a <strong>test</strong> paragraph.</p>');
    });

    it('enhances code blocks with terminal header, dots, and copy button', () => {
      const input = '<pre data-language="typescript"><code>const x: number = 42;</code></pre>';
      const html = renderViewerHTML(input, { enableCopyCode: true });

      expect(html).toContain('class="ue-code-block-viewer"');
      expect(html).toContain('data-language="typescript"');
      expect(html).toContain('class="ue-code-header"');
      expect(html).toContain('class="ue-dot ue-dot-red"');
      expect(html).toContain('class="ue-dot ue-dot-yellow"');
      expect(html).toContain('class="ue-dot ue-dot-green"');
      expect(html).toContain('class="ue-code-lang"');
      expect(html).toContain('typescript');
      expect(html).toContain('class="ue-code-copy-btn"');
      expect(html).toContain('const x: number = 42;');
    });

    it('skips code block enhancement when enableCopyCode is false', () => {
      const input = '<pre data-language="javascript"><code>console.log("hello");</code></pre>';
      const html = renderViewerHTML(input, { enableCopyCode: false });

      expect(html).not.toContain('class="ue-code-block-viewer"');
      expect(html).not.toContain('class="ue-code-copy-btn"');
      expect(html).toContain('<pre data-language="javascript"><code>console.log("hello");</code></pre>');
    });

    it('renders tables with proper structure and classes', () => {
      const input = `
        <table class="ue-table">
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>
      `;
      const html = renderViewerHTML(input);

      expect(html).toContain('<table class="ue-table">');
      expect(html).toContain('<th>Header 1</th>');
      expect(html).toContain('<td>Cell 1</td>');
    });

    it('renders media embeds safely with responsive wrapper', () => {
      const input = `
        <div data-type="embed" data-provider="youtube" data-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" class="ue-embed-wrapper ue-embed-align-center">
          <div class="ue-embed-responsive">
            <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" class="ue-embed-iframe"></iframe>
          </div>
        </div>
      `;
      const html = renderViewerHTML(input);

      expect(html).toContain('data-provider="youtube"');
      expect(html).toContain('class="ue-embed-responsive"');
      expect(html).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    });

    it('renders image figures with alignment, captions, and attributes', () => {
      const input = `
        <figure class="ue-image-figure ue-image-align-center" data-alignment="center" data-width="80%">
          <img src="https://example.com/photo.jpg" alt="Nature photo" title="Nature" />
          <figcaption class="ue-image-caption">Scenic mountain landscape</figcaption>
        </figure>
      `;
      const html = renderViewerHTML(input);

      expect(html).toContain('class="ue-image-figure ue-image-align-center"');
      expect(html).toContain('src="https://example.com/photo.jpg"');
      expect(html).toContain('alt="Nature photo"');
      expect(html).toContain('Scenic mountain landscape');
    });

    it('renders mentions with avatar and role chips', () => {
      const input = '<p>Assigned to <span data-type="mention" data-id="1" data-label="Shamim" data-role="Architect" class="ue-mention">@Shamim</span></p>';
      const html = renderViewerHTML(input);

      expect(html).toContain('data-type="mention"');
      expect(html).toContain('class="ue-mention"');
      expect(html).toContain('@Shamim');
    });

    it('renders task lists with readonly disabled inputs', () => {
      const input = `
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked disabled></label><div><span>Done item</span></div></li>
          <li data-type="taskItem" data-checked="false"><label><input type="checkbox" disabled></label><div><span>Pending item</span></div></li>
        </ul>
      `;
      const html = renderViewerHTML(input);

      expect(html).toContain('data-type="taskList"');
      expect(html).toContain('data-checked="true"');
      expect(html).toContain('disabled');
      expect(html).toContain('Done item');
    });

    it('converts ProseMirror JSON document objects into semantic HTML', () => {
      const jsonDoc = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Document from JSON' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This was rendered from ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'structured JSON' },
              { type: 'text', text: '.' },
            ],
          },
        ],
      };

      const result = processViewerContent(jsonDoc);
      expect(result.isJson).toBe(true);
      expect(result.html).toContain('<h2>Document from JSON</h2>');
      expect(result.html).toContain('<strong>structured JSON</strong>');
    });

    it('sanitizes malicious script tags and inline event handlers by default', () => {
      const malicious = `
        <p>Safe content</p>
        <script>alert("XSS")</script>
        <img src="x" onerror="alert('hack')" />
        <a href="javascript:alert(1)">Click me</a>
      `;
      const html = renderViewerHTML(malicious);

      expect(html).toContain('<p>Safe content</p>');
      expect(html).not.toContain('<script');
      expect(html).not.toContain('alert("XSS")');
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('javascript:');
    });

    it('allows bypassing sanitization when explicitly requested', () => {
      const rawHtml = '<p>Custom <span data-custom="value">content</span></p>';
      const html = renderViewerHTML(rawHtml, { sanitize: false });

      expect(html).toContain('<p>Custom <span data-custom="value">content</span></p>');
    });

    it('returns getViewerExtensions array containing all necessary schema nodes', () => {
      const exts = getViewerExtensions();
      expect(Array.isArray(exts)).toBe(true);
      expect(exts.length).toBeGreaterThan(15);
    });
  });

  describe('Vue 3 <RichTextViewer /> Component', () => {
    it('mounts and renders HTML content cleanly without editor controls', () => {
      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<h1>Clean Article</h1><p>Viewer mode has zero editing chrome.</p>',
        },
      });

      const viewer = wrapper.find('.ue-viewer');
      expect(viewer.exists()).toBe(true);
      expect(viewer.html()).toContain('<h1>Clean Article</h1>');
      expect(viewer.html()).toContain('Viewer mode has zero editing chrome.');

      // Asserts zero editor controls exist
      expect(wrapper.find('.ue-toolbar').exists()).toBe(false);
      expect(wrapper.find('.ue-bubble-menu').exists()).toBe(false);
      expect(wrapper.find('.ue-context-menu').exists()).toBe(false);
      expect(wrapper.find('[contenteditable="true"]').exists()).toBe(false);
    });

    it('applies dark mode class when darkMode is true', async () => {
      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<p>Dark theme content</p>',
          darkMode: true,
        },
      });

      expect(wrapper.find('.ue-viewer-dark').exists()).toBe(true);

      await wrapper.setProps({ darkMode: false, theme: 'light' });
      expect(wrapper.find('.ue-viewer-light').exists()).toBe(true);
    });

    it('applies custom wrapperClass', () => {
      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<p>Custom styled</p>',
          wrapperClass: 'my-custom-viewer-container',
        },
      });

      expect(wrapper.find('.my-custom-viewer-container').exists()).toBe(true);
    });

    it('emits image-click and opens lightbox modal when an image is clicked', async () => {
      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<figure><img src="https://example.com/photo.jpg" alt="Test Image" title="Scenic View" /></figure>',
          enableImageLightbox: true,
        },
      });

      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);

      await img.trigger('click');

      expect(wrapper.emitted('image-click')).toBeTruthy();
      expect(wrapper.emitted('image-click')![0][0]).toMatchObject({
        src: 'https://example.com/photo.jpg',
        alt: 'Test Image',
        title: 'Scenic View',
      });
    });

    it('emits link-click when an anchor is clicked', async () => {
      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<p>Read the <a href="https://example.com/docs" target="_blank">documentation</a>.</p>',
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);

      await link.trigger('click');

      expect(wrapper.emitted('link-click')).toBeTruthy();
      expect(wrapper.emitted('link-click')![0][0]).toMatchObject({
        href: 'https://example.com/docs',
        target: '_blank',
      });
    });

    it('exposes print and closeLightbox methods on the component instance', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      const wrapper = mount(RichTextViewer, {
        props: {
          content: '<p>Printable content</p>',
        },
      });

      expect(typeof wrapper.vm.print).toBe('function');
      expect(typeof wrapper.vm.closeLightbox).toBe('function');

      wrapper.vm.print();
      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });
  });
});
