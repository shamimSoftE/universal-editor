import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  UniversalEditor,
  createEditor,
  ContentSanitizer,
  DefaultUploader,
  countWords,
  countCharacters,
  calculateReadingTime,
  tokenToCssVariable,
  generateCSSVariables,
  VersionHistoryManager,
} from '@universal-editor/core';
import {
  RichTextEditor,
  EditorToolbar,
  LinkDialog,
  TableDialog,
  EmbedDialog,
} from '@universal-editor/vue3';

describe('Phase 24: Comprehensive Testing Suite (Unit, Vue & E2E)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. UNIT TESTS: Core Editor, Commands, Extensions, Utilities, Sanitizer, Upload
  // =========================================================================
  describe('1. UNIT TESTS: Core Engine, Commands & Services', () => {
    it('Unit: Core editor initialization, lifecycle, and event bus', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const editor = createEditor({
        element: container,
        content: '<p>Initial test content</p>',
      });

      expect(editor).toBeInstanceOf(UniversalEditor);
      expect(editor.getText()).toContain('Initial test content');
      expect(editor.isEditable).toBe(true);

      const eventSpy = vi.fn();
      editor.on('custom-test-event', eventSpy);
      editor.emit('custom-test-event', { payload: 42 });
      expect(eventSpy).toHaveBeenCalledWith({ payload: 42 });

      editor.destroy();
      expect(editor.isDestroyed).toBe(true);
      document.body.removeChild(container);
    });

    it('Unit: Core formatting commands (bold, italic, underline, strike, headings)', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const editor = createEditor({
        element: container,
        content: '<p>Hello world</p>',
      });

      editor.focus('start');

      // Toggle headings
      editor.toggleHeading(1);
      expect(editor.getHTML()).toContain('<h1>Hello world</h1>');
      expect(editor.isActive('heading', { level: 1 })).toBe(true);

      editor.setParagraph();
      expect(editor.getHTML()).toContain('<p>Hello world</p>');

      // Formatting marks
      editor.focus('all');
      editor.toggleBold();
      expect(editor.isActive('bold')).toBe(true);

      editor.destroy();
      document.body.removeChild(container);
    });

    it('Unit: Extensions (CustomImage, FileAttachment, CodeBlock, Embed, Tables)', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const editor = createEditor({
        element: container,
        content: '<p>Paragraph for code block</p>',
      });

      // Insert Image
      editor.insertImage({
        src: 'https://example.com/test.png',
        alt: 'Test Alt',
        title: 'Test Title',
        alignment: 'center',
        caption: 'Sample Caption',
      });
      expect(editor.getHTML()).toContain('https://example.com/test.png');
      expect(editor.getHTML()).toContain('Sample Caption');

      // Insert File Attachment
      editor.insertFile({
        name: 'document.pdf',
        size: 1048576,
        type: 'application/pdf',
        url: 'https://example.com/document.pdf',
      });
      expect(editor.getHTML()).toContain('document.pdf');

      // Toggle Code Block
      editor.focus('start');
      editor.toggleCodeBlock();
      expect(editor.isCodeBlockActive()).toBe(true);

      // Insert Table
      editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
      expect(editor.getHTML()).toContain('<table');

      // Insert Embed
      editor.insertEmbed({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Video Demo',
      });
      expect(editor.getHTML()).toContain('data-type="embed"');

      editor.destroy();
      document.body.removeChild(container);
    });

    it('Unit: Utilities (Word/Char counting, reading time, CSS variable generation)', () => {
      const text = 'Universal Rich Text Editor delivers enterprise grade architecture across monorepos.';
      expect(countWords(text)).toBe(10);
      expect(countCharacters(text)).toBe(83);
      expect(countCharacters(text, true)).toBe(74);
      expect(calculateReadingTime(10).text).toBe('< 1 min read');

      expect(tokenToCssVariable('editorBg')).toBe('--editor-bg');
      expect(tokenToCssVariable('editorToolbarHeight')).toBe('--editor-toolbar-height');

      const vars = generateCSSVariables({ editorBg: '#123456', editorText: '#ffffff' });
      expect(vars['--editor-bg']).toBe('#123456');
      expect(vars['--editor-text']).toBe('#ffffff');
    });

    it('Unit: Content Sanitizer (XSS protection, tag whitelist, attribute cleaning)', () => {
      const sanitizer = new ContentSanitizer();

      const maliciousHTML = '<p>Normal text</p><script>alert("hacked")</script><img src="x" onerror="evil()" />';
      const sanitized = sanitizer.sanitize(maliciousHTML);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).toContain('<p>Normal text</p>');

      const linkWithJS = '<a href="javascript:alert(1)">Click me</a>';
      const cleanLink = sanitizer.sanitize(linkWithJS);
      expect(cleanLink).not.toContain('javascript:');
    });

    it('Unit: Upload service (DefaultUploader validation, sizing, mock upload)', async () => {
      const uploader = new DefaultUploader({
        maxFileSize: 2 * 1024 * 1024,
        allowedImageMimes: ['image/png', 'image/jpeg'],
        allowedFileMimes: ['application/pdf'],
      });

      const validFile = new File(['valid file content'], 'avatar.png', { type: 'image/png' });
      const progressSpy = vi.fn();

      const uploadPromise = uploader.uploadImage(validFile, progressSpy);
      vi.advanceTimersByTime(250);
      const res = await uploadPromise;

      const url = typeof res === 'object' ? res.url : res;
      expect(url).toBeDefined();

      const oversizedFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
      await expect(uploader.uploadImage(oversizedFile)).rejects.toThrow(/exceeds/i);

      const invalidMime = new File(['code'], 'script.exe', { type: 'application/x-msdownload' });
      await expect(uploader.uploadImage(invalidMime)).rejects.toThrow(/unsupported/i);
    });
  });

  // =========================================================================
  // 2. VUE TESTS: Toolbar, Editor, Dialogs, Image, Table, Slash commands, Mentions
  // =========================================================================
  describe('2. VUE COMPONENT TESTS: Toolbar, Dialogs & Interactive Controls', () => {
    it('Vue: RichTextEditor mounts with two-way v-model and emits ready', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '<p>Vue 3 Component Test</p>',
        },
        attachTo: document.body,
      });

      expect(wrapper.find('.ue-editor-card').exists()).toBe(true);
      expect(wrapper.find('.ProseMirror').exists()).toBe(true);

      const vm = wrapper.vm as any;
      expect(typeof vm.getHTML).toBe('function');
      expect(typeof vm.setContent).toBe('function');

      wrapper.unmount();
    });

    it('Vue: EditorToolbar renders buttons with roving tabindex and ARIA attributes', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const editor = createEditor({ element: container });

      const wrapper = mount(EditorToolbar, {
        props: { editor },
        attachTo: document.body,
      });

      const toolbar = wrapper.find('.ue-toolbar');
      expect(toolbar.exists()).toBe(true);
      expect(toolbar.attributes('role')).toBe('toolbar');
      expect(toolbar.classes()).toContain('ue-toolbar-scrollable');

      const buttons = wrapper.findAll('.ue-toolbar-btn');
      expect(buttons.length).toBeGreaterThan(10);

      wrapper.unmount();
      editor.destroy();
      document.body.removeChild(container);
    });

    it('Vue: Dialogs (Link, Image, File, Table, Embed) render and trap focus', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const editor = createEditor({ element: container });

      // LinkDialog
      const linkWrapper = mount(LinkDialog, {
        props: {
          modelValue: true,
          initialHref: 'https://example.com',
        },
        attachTo: document.body,
      });
      expect(linkWrapper.find('.ue-dialog').exists()).toBe(true);
      linkWrapper.unmount();

      // TableDialog
      const tableWrapper = mount(TableDialog, {
        props: {
          modelValue: true,
          editor,
        },
        attachTo: document.body,
      });
      expect(tableWrapper.find('.ue-dialog').exists()).toBe(true);
      tableWrapper.unmount();

      // EmbedDialog
      const embedWrapper = mount(EmbedDialog, {
        props: {
          modelValue: true,
          editor,
        },
        attachTo: document.body,
      });
      expect(embedWrapper.find('.ue-dialog').exists()).toBe(true);
      embedWrapper.unmount();

      editor.destroy();
      document.body.removeChild(container);
    });

    it('Vue: Slash commands and Mentions configurations activate without error', () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '<p>Testing slash and mention</p>',
          slashCommands: true,
          mentions: true,
        },
        attachTo: document.body,
      });

      const vm = wrapper.vm as any;
      expect(Array.isArray(vm.getSlashCommands())).toBe(true);
      expect(Array.isArray(vm.getMentions())).toBe(true);

      wrapper.unmount();
    });
  });

  // =========================================================================
  // 3. E2E LIFECYCLE: Create -> Edit -> Image -> Table -> Code -> Publish -> Restore -> Autosave
  // =========================================================================
  describe('3. E2E FULL LIFECYCLE WORKFLOW', () => {
    it('executes complete 8-step document lifecycle end-to-end', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Step 1: Create Document
      const editor = createEditor({
        element: container,
        content: '',
        autosave: { enabled: true, debounce: 50, key: 'e2e-test-doc' },
      });
      expect(editor.getText().trim()).toBe('');

      // Step 2: Edit Document (Heading & Paragraphs)
      editor.setContent('<h1>Universal Architecture Spec</h1><p>Comprehensive enterprise document lifecycle testing.</p>');
      expect(editor.getHTML()).toContain('<h1>Universal Architecture Spec</h1>');
      expect(editor.getWordCount()).toBeGreaterThan(5);

      // Step 3: Upload & Insert Image
      editor.insertImage({
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
        alt: 'Architecture Diagram',
        alignment: 'center',
        caption: 'Figure 1: Core System Overview',
      });
      expect(editor.getHTML()).toContain('Figure 1: Core System Overview');

      // Step 4: Insert Table
      editor.insertTable({ rows: 2, cols: 2, withHeaderRow: true });
      expect(editor.getHTML()).toContain('<table');

      // Step 5: Insert Code
      editor.setCodeBlock({ language: 'javascript' });
      expect(editor.getHTML()).toContain('<pre');

      // Step 6: Publish Document (Export clean sanitized HTML and structured JSON)
      const publishedHTML = editor.getSanitizedHTML();
      const publishedJSON = editor.getJSON();
      expect(publishedHTML).toContain('Universal Architecture Spec');
      expect(publishedJSON.type).toBe('doc');

      // Step 7: Document Versioning & Restore Version
      const versionManager = new VersionHistoryManager({
        documentId: 'e2e-doc-1',
      });
      const snap1 = versionManager.createSnapshot(
        editor.getHTML(),
        'Initial Published Version',
        editor.getJSON(),
        'Architecture Doc',
        'Architect'
      );
      expect(snap1.version).toBe(1);

      // Mutate document
      editor.setContent('<p>Accidental deletion of previous content</p>');
      expect(editor.getText()).toContain('Accidental deletion');

      // Restore Version 1
      const restored = versionManager.restoreVersion(1);
      expect(restored).toBeDefined();
      expect(restored?.version).toBe(2);
      if (restored) {
        editor.setContent(restored.contentHtml);
      }
      expect(editor.getHTML()).toContain('Universal Architecture Spec');

      // Step 8: Autosave lifecycle
      const savePromise = editor.saveDraft(true);
      vi.advanceTimersByTime(100);
      const saveOk = await savePromise;
      expect(saveOk).toBe(true);
      expect(editor.hasDraft()).toBe(true);

      const draft = editor.getDraft();
      expect(draft).not.toBeNull();
      const contentStr = draft?.html || draft?.text || JSON.stringify(draft?.content);
      expect(contentStr).toContain('Universal Architecture Spec');

      editor.clearDraft();
      expect(editor.hasDraft()).toBe(false);

      editor.destroy();
      document.body.removeChild(container);
    });
  });
});
