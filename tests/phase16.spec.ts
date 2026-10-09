import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RichTextEditor,
  richTextEditor,
  RichTextViewer,
  richTextViewer,
  UniversalEditorVue2Plugin,
} from '@universal-editor/vue2';
import { DEFAULT_TOOLBAR } from '@universal-editor/core';

describe('Phase 16: Vue 2 Adapter (@universal-editor/vue2)', () => {
  describe('Plugin Installation and Component Exports', () => {
    it('exports PascalCase and kebab-case component aliases', () => {
      expect(RichTextEditor).toBeDefined();
      expect(richTextEditor).toBe(RichTextEditor);
      expect(RichTextViewer).toBeDefined();
      expect(richTextViewer).toBe(RichTextViewer);
    });

    it('exports UniversalEditorVue2Plugin with install method', () => {
      expect(UniversalEditorVue2Plugin).toBeDefined();
      expect(typeof UniversalEditorVue2Plugin.install).toBe('function');
    });

    it('registers both PascalCase and kebab-case components on Vue instance', () => {
      const registeredComponents: Record<string, any> = {};
      const mockVue = {
        component: vi.fn((name: string, comp: any) => {
          registeredComponents[name] = comp;
        }),
      };

      UniversalEditorVue2Plugin.install(mockVue);

      expect(mockVue.component).toHaveBeenCalledWith('RichTextEditor', RichTextEditor);
      expect(mockVue.component).toHaveBeenCalledWith('rich-text-editor', RichTextEditor);
      expect(mockVue.component).toHaveBeenCalledWith('RichTextViewer', RichTextViewer);
      expect(mockVue.component).toHaveBeenCalledWith('rich-text-viewer', RichTextViewer);
      expect(registeredComponents['RichTextEditor']).toBe(RichTextEditor);
      expect(registeredComponents['rich-text-editor']).toBe(RichTextEditor);
      expect(registeredComponents['RichTextViewer']).toBe(RichTextViewer);
      expect(registeredComponents['rich-text-viewer']).toBe(RichTextViewer);
    });
  });

  describe('RichTextEditor Component Definition', () => {
    it('has the correct component name and model configuration for Vue 2 v-model', () => {
      expect(RichTextEditor.name).toBe('RichTextEditor');
      expect(RichTextEditor.model).toEqual({
        prop: 'value',
        event: 'input',
      });
    });

    it('defines standard props with proper defaults', () => {
      const props = RichTextEditor.props;
      expect(props.value).toBeDefined();
      expect(props.value.default).toBe('');

      expect(props.modelValue).toBeDefined();
      expect(props.modelValue.default).toBeUndefined();

      expect(props.readonly.default).toBe(false);
      expect(props.placeholder.default).toBe('Start typing...');
      expect(props.outputFormat.default).toBe('html');
      expect(props.minHeight.default).toBe('300px');
      expect(props.darkMode.default).toBe(false);
      expect(props.theme.default).toBe('auto');
      expect(props.slashCommands.default).toBe(true);
      expect(props.mentions.default).toBe(true);
      expect(props.hardLimit.default).toBe(false);
      expect(props.showWordCount.default).toBe(true);
      expect(props.showCharacterCount.default).toBe(true);

      const toolbarDefault = typeof props.toolbar.default === 'function'
        ? props.toolbar.default()
        : props.toolbar.default;
      expect(toolbarDefault).toEqual(DEFAULT_TOOLBAR);
    });

    it('initializes component data state with correct defaults', () => {
      const dataFn = RichTextEditor.data;
      expect(typeof dataFn).toBe('function');

      const data = dataFn();
      expect(data.editor).toBeNull();
      expect(data.internalValue).toBe('');
      expect(data.statistics).toEqual({
        words: 0,
        characters: 0,
        charactersExcludingSpaces: 0,
        paragraphs: 0,
        readingTime: 0,
        readingTimeMinutes: 0,
        readingTimeString: '< 1 min read',
      });
    });
  });

  describe('RichTextEditor Computed Properties', () => {
    it('computes currentValue preferring modelValue over value for Vue 2 / 3 bridging', () => {
      const getter = RichTextEditor.computed.currentValue;

      // When modelValue is provided
      const contextWithModelValue = {
        modelValue: '<p>Vue 3 style</p>',
        value: '<p>Vue 2 style</p>',
      };
      expect(getter.call(contextWithModelValue)).toBe('<p>Vue 3 style</p>');

      // When only value is provided
      const contextWithValue = {
        modelValue: undefined,
        value: '<p>Vue 2 style</p>',
      };
      expect(getter.call(contextWithValue)).toBe('<p>Vue 2 style</p>');
    });

    it('computes themeClass based on darkMode and theme props', () => {
      const getter = RichTextEditor.computed.themeClass;

      expect(getter.call({ darkMode: true, theme: 'auto' })).toBe('ue-dark');
      expect(getter.call({ darkMode: false, theme: 'dark' })).toBe('ue-dark');
      expect(getter.call({ darkMode: false, theme: 'light' })).toBe('ue-light');
      expect(getter.call({ darkMode: false, theme: 'auto' })).toBe('');
    });
  });

  describe('RichTextEditor Public Methods and Event Parity', () => {
    let mockInstance: any;
    let mockEditor: any;

    beforeEach(() => {
      mockEditor = {
        isDestroyed: false,
        getHTML: vi.fn(() => '<p>Test HTML</p>'),
        getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
        getText: vi.fn(() => 'Test text'),
        getSanitizedHTML: vi.fn(() => '<p>Sanitized HTML</p>'),
        setContent: vi.fn(),
        clearContent: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        undo: vi.fn(() => true),
        redo: vi.fn(() => true),
        setEditable: vi.fn(),
        insertImage: vi.fn(),
        insertFile: vi.fn(),
        insertEmbed: vi.fn(),
        insertMention: vi.fn(),
        saveDraft: vi.fn(),
        restoreDraft: vi.fn(() => true),
        clearDraft: vi.fn(),
        getWordCount: vi.fn(() => 42),
        getCharacterCount: vi.fn(() => 210),
        getParagraphCount: vi.fn(() => 3),
        getStatistics: vi.fn(() => ({
          words: 42,
          characters: 210,
          charactersExcludingSpaces: 175,
          paragraphs: 3,
          readingTime: 0.2,
          readingTimeMinutes: 1,
          readingTimeString: '1 min read',
        })),
        setLimits: vi.fn(),
        destroy: vi.fn(),
      };

      mockInstance = {
        editor: mockEditor,
        internalValue: '',
        outputFormat: 'html',
        $emit: vi.fn(),
        ...RichTextEditor.methods,
      };
    });

    it('implements content retrieval methods', () => {
      expect(mockInstance.getHTML()).toBe('<p>Test HTML</p>');
      expect(mockEditor.getHTML).toHaveBeenCalled();

      expect(mockInstance.getJSON()).toEqual({ type: 'doc', content: [] });
      expect(mockEditor.getJSON).toHaveBeenCalled();

      expect(mockInstance.getText()).toBe('Test text');
      expect(mockEditor.getText).toHaveBeenCalled();

      expect(mockInstance.getSanitizedHTML()).toBe('<p>Sanitized HTML</p>');
      expect(mockEditor.getSanitizedHTML).toHaveBeenCalled();
    });

    it('implements setContent and clearContent with dual event emission (input and update:modelValue)', () => {
      mockInstance.setContent('<p>New content</p>', true);

      expect(mockEditor.setContent).toHaveBeenCalledWith('<p>New content</p>', true);
      expect(mockInstance.internalValue).toBe('<p>New content</p>');
      expect(mockInstance.$emit).toHaveBeenCalledWith('input', '<p>New content</p>');
      expect(mockInstance.$emit).toHaveBeenCalledWith('update:modelValue', '<p>New content</p>');
      expect(mockInstance.$emit).toHaveBeenCalledWith('change', '<p>New content</p>');

      mockInstance.clearContent(true);
      expect(mockEditor.clearContent).toHaveBeenCalledWith(true);
      expect(mockInstance.internalValue).toBe('');
      expect(mockInstance.$emit).toHaveBeenCalledWith('input', '');
      expect(mockInstance.$emit).toHaveBeenCalledWith('update:modelValue', '');
    });

    it('implements focus, blur, undo, redo, and setEditable', () => {
      mockInstance.focus('end');
      expect(mockEditor.focus).toHaveBeenCalledWith('end');

      mockInstance.blur();
      expect(mockEditor.blur).toHaveBeenCalled();

      expect(mockInstance.undo()).toBe(true);
      expect(mockEditor.undo).toHaveBeenCalled();

      expect(mockInstance.redo()).toBe(true);
      expect(mockEditor.redo).toHaveBeenCalled();

      mockInstance.setEditable(false);
      expect(mockEditor.setEditable).toHaveBeenCalledWith(false);
    });

    it('implements media insertion and mention insertion delegates', () => {
      const imgAttrs = { src: 'https://example.com/pic.jpg', alt: 'Test' };
      mockInstance.insertImage(imgAttrs);
      expect(mockEditor.insertImage).toHaveBeenCalledWith(imgAttrs);

      const fileAttrs = { url: 'https://example.com/doc.pdf', title: 'Doc' };
      mockInstance.insertFile(fileAttrs);
      expect(mockEditor.insertFile).toHaveBeenCalledWith(fileAttrs);

      const embedAttrs = { url: 'https://youtube.com/watch?v=123', type: 'youtube' };
      mockInstance.insertEmbed(embedAttrs);
      expect(mockEditor.insertEmbed).toHaveBeenCalledWith(embedAttrs);

      const mentionUser = { id: 'u1', label: 'Jane Doe', email: 'jane@example.com' };
      mockInstance.insertMention(mentionUser);
      expect(mockEditor.insertMention).toHaveBeenCalledWith(mentionUser);
    });

    it('implements autosave draft methods', () => {
      mockInstance.saveDraft(true);
      expect(mockEditor.saveDraft).toHaveBeenCalledWith(true);

      expect(mockInstance.restoreDraft()).toBe(true);
      expect(mockEditor.restoreDraft).toHaveBeenCalled();

      mockInstance.clearDraft();
      expect(mockEditor.clearDraft).toHaveBeenCalled();
    });

    it('implements statistics and limit methods', () => {
      expect(mockInstance.getWordCount()).toBe(42);
      expect(mockEditor.getWordCount).toHaveBeenCalled();

      expect(mockInstance.getCharacterCount(true)).toBe(210);
      expect(mockEditor.getCharacterCount).toHaveBeenCalledWith(true);

      expect(mockInstance.getParagraphCount()).toBe(3);
      expect(mockEditor.getParagraphCount).toHaveBeenCalled();

      const stats = mockInstance.getStatistics();
      expect(stats.words).toBe(42);
      expect(stats.readingTimeString).toBe('1 min read');

      const limits = { wordLimit: 500, hardLimit: true };
      mockInstance.setLimits(limits);
      expect(mockEditor.setLimits).toHaveBeenCalledWith(limits);
    });

    it('returns the underlying UniversalEditor instance with getEditorInstance', () => {
      expect(mockInstance.getEditorInstance()).toBe(mockEditor);
    });
  });

  describe('RichTextEditor Watchers and Lifecycle', () => {
    it('watcher on value updates content when different from internalValue', () => {
      const setContentMock = vi.fn();
      const context = {
        editor: { isDestroyed: false },
        internalValue: '<p>Old</p>',
        setContent: setContentMock,
      };

      RichTextEditor.watch.value.call(context, '<p>New</p>');
      expect(setContentMock).toHaveBeenCalledWith('<p>New</p>', false);

      // Does not set when same
      setContentMock.mockClear();
      RichTextEditor.watch.value.call(context, '<p>Old</p>');
      expect(setContentMock).not.toHaveBeenCalled();
    });

    it('watcher on readonly toggles editor editable state', () => {
      const setEditableMock = vi.fn();
      const context = {
        setEditable: setEditableMock,
      };

      RichTextEditor.watch.readonly.call(context, true);
      expect(setEditableMock).toHaveBeenCalledWith(false);

      RichTextEditor.watch.readonly.call(context, false);
      expect(setEditableMock).toHaveBeenCalledWith(true);
    });

    it('beforeDestroy cleans up editor instance safely', () => {
      const destroyMock = vi.fn();
      const context = {
        editor: {
          isDestroyed: false,
          destroy: destroyMock,
        },
      };

      RichTextEditor.beforeDestroy.call(context);
      expect(destroyMock).toHaveBeenCalled();
      expect(context.editor).toBeNull();
    });
  });

  describe('RichTextViewer Component Definition', () => {
    it('has the correct component name and props for Vue 2 viewer', () => {
      expect(RichTextViewer.name).toBe('RichTextViewer');
      const props = RichTextViewer.props;

      expect(props.content.default).toBe('');
      expect(props.darkMode.default).toBe(false);
      expect(props.theme.default).toBe('auto');
      expect(props.sanitize.default).toBe(true);
      expect(props.enableCopyCode.default).toBe(true);
      expect(props.enableImageLightbox.default).toBe(true);
      expect(props.responsiveEmbeds.default).toBe(true);
      expect(props.printOptimized.default).toBe(true);
      expect(props.wrapperClass.default).toBe('');
    });

    it('initializes viewer data with lightbox closed', () => {
      const data = RichTextViewer.data();
      expect(data.lightbox).toEqual({
        open: false,
        src: '',
        alt: '',
        caption: '',
      });
    });

    it('computes renderedHtml via renderViewerHTML for HTML and JSON content', () => {
      const getter = RichTextViewer.computed.renderedHtml;

      const htmlContext = {
        content: '<p>Hello <strong>World</strong></p>',
        sanitize: true,
        sanitizerConfig: undefined,
        enableCopyCode: true,
        enableImageLightbox: true,
        responsiveEmbeds: true,
        printOptimized: true,
      };
      const rendered = getter.call(htmlContext);
      expect(rendered).toContain('<p>Hello <strong>World</strong></p>');

      const jsonContext = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Rendered from TipTap JSON' }],
            },
          ],
        },
        sanitize: true,
        sanitizerConfig: undefined,
        enableCopyCode: true,
        enableImageLightbox: true,
        responsiveEmbeds: true,
        printOptimized: true,
      };
      const renderedJson = getter.call(jsonContext);
      expect(renderedJson).toContain('Rendered from TipTap JSON');
    });

    it('computes viewer themeClass properly', () => {
      const getter = RichTextViewer.computed.themeClass;
      expect(getter.call({ darkMode: true, theme: 'auto' })).toBe('ue-viewer-dark');
      expect(getter.call({ darkMode: false, theme: 'dark' })).toBe('ue-viewer-dark');
      expect(getter.call({ darkMode: false, theme: 'light' })).toBe('ue-viewer-light');
      expect(getter.call({ darkMode: false, theme: 'auto' })).toBe('ue-viewer-auto');
    });

    it('manages lightbox opening and closing with events', () => {
      const context = {
        lightbox: { open: false, src: '', alt: '', caption: '' },
        $emit: vi.fn(),
        ...RichTextViewer.methods,
      };

      context.openLightbox('https://example.com/full.jpg', 'Full Photo', 'Photo Caption');
      expect(context.lightbox.open).toBe(true);
      expect(context.lightbox.src).toBe('https://example.com/full.jpg');
      expect(context.lightbox.alt).toBe('Full Photo');
      expect(context.lightbox.caption).toBe('Photo Caption');
      expect(context.$emit).toHaveBeenCalledWith('lightbox-open', {
        src: 'https://example.com/full.jpg',
        alt: 'Full Photo',
        caption: 'Photo Caption',
      });

      context.closeLightbox();
      expect(context.lightbox.open).toBe(false);
      expect(context.lightbox.src).toBe('');
      expect(context.$emit).toHaveBeenCalledWith('lightbox-close');
    });
  });
});
