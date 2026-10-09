import {
  createEditor,
  UniversalEditor,
  DEFAULT_TOOLBAR,
} from '@universal-editor/core';
import type { EditorStatistics, StatisticsConfig } from '@universal-editor/core';

export const RichTextEditor = {
  name: 'RichTextEditor',
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    value: {
      type: [String, Object],
      default: '',
    },
    modelValue: {
      type: [String, Object],
      default: undefined,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: 'Start typing...',
    },
    autofocus: {
      type: [Boolean, String, Number],
      default: false,
    },
    toolbar: {
      type: [Array, Boolean],
      default: () => DEFAULT_TOOLBAR,
    },
    bubbleMenu: {
      type: [Array, Boolean],
      default: true,
    },
    outputFormat: {
      type: String,
      default: 'html',
    },
    minHeight: {
      type: String,
      default: '300px',
    },
    maxHeight: {
      type: String,
      default: undefined,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'auto',
    },
    slashCommands: {
      type: [Boolean, Object],
      default: true,
    },
    mentions: {
      type: [Boolean, Object],
      default: true,
    },
    autosave: {
      type: [Boolean, Object],
      default: undefined,
    },
    wordLimit: {
      type: Number,
      default: undefined,
    },
    characterLimit: {
      type: Number,
      default: undefined,
    },
    hardLimit: {
      type: Boolean,
      default: false,
    },
    showWordCount: {
      type: Boolean,
      default: true,
    },
    showCharacterCount: {
      type: Boolean,
      default: true,
    },
    showCharactersNoSpaces: {
      type: Boolean,
      default: false,
    },
    showParagraphCount: {
      type: Boolean,
      default: false,
    },
    showReadingTime: {
      type: Boolean,
      default: false,
    },
    uploader: {
      type: [Object, Function],
      default: undefined,
    },
  },
  data() {
    return {
      editor: null as UniversalEditor | null,
      internalValue: '' as string | Record<string, any>,
      statistics: {
        words: 0,
        characters: 0,
        charactersExcludingSpaces: 0,
        paragraphs: 0,
        readingTime: 0,
        readingTimeMinutes: 0,
        readingTimeString: '< 1 min read',
      } as EditorStatistics,
    };
  },
  computed: {
    currentValue(): string | Record<string, any> {
      return (this as any).modelValue !== undefined
        ? (this as any).modelValue
        : (this as any).value;
    },
    themeClass(): string {
      const self = this as any;
      if (self.darkMode || self.theme === 'dark') return 'ue-dark';
      if (self.theme === 'light') return 'ue-light';
      return '';
    },
  },
  watch: {
    value(val: any) {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed && val !== self.internalValue) {
        self.setContent(val, false);
      }
    },
    modelValue(val: any) {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed && val !== self.internalValue) {
        self.setContent(val, false);
      }
    },
    readonly(isReadonly: boolean) {
      const self = this as any;
      if (typeof self.setEditable === 'function') {
        self.setEditable(!isReadonly);
      } else if (self.editor && !self.editor.isDestroyed) {
        self.editor.setEditable(!isReadonly);
      }
    },
    wordLimit() {
      (this as any).syncLimits();
    },
    characterLimit() {
      (this as any).syncLimits();
    },
    hardLimit() {
      (this as any).syncLimits();
    },
  },
  mounted() {
    (this as any).initEditor();
  },
  beforeDestroy() {
    const self = this as any;
    if (typeof self.destroyEditor === 'function') {
      self.destroyEditor();
    } else if (self.editor && !self.editor.isDestroyed) {
      self.editor.destroy();
      self.editor = null;
    }
  },
  methods: {
    initEditor() {
      const self = this as any;
      const containerEl = self.$refs.editorContainer as HTMLElement;
      if (!containerEl) return;

      const editor = createEditor({
        element: containerEl,
        content: self.currentValue,
        editable: !self.readonly,
        autofocus: self.autofocus,
        toolbar: self.toolbar === true ? DEFAULT_TOOLBAR : (self.toolbar || false),
        bubbleMenu: self.bubbleMenu,
        placeholder: self.placeholder,
        uploader: self.uploader,
        slashCommands: self.slashCommands,
        mentions: self.mentions,
        autosave: self.autosave,
        statistics: {
          maxWords: self.wordLimit,
          maxCharacters: self.characterLimit,
          hardLimit: self.hardLimit,
        },
        onUpdate: () => {
          const output = self.getOutput();
          self.internalValue = output;
          self.$emit('input', output);
          self.$emit('update:modelValue', output);
          self.$emit('change', output);
        },
        onFocus: () => {
          self.$emit('focus');
        },
        onBlur: () => {
          self.$emit('blur');
        },
        onSelectionUpdate: () => {
          self.$emit('selection-update');
        },
        onTransaction: () => {
          self.$emit('transaction');
        },
        onDestroy: () => {
          self.$emit('destroy');
        },
      });

      // Forward Core Events
      editor.on('slash-command', (item: any) => self.$emit('slash-command', item));
      editor.on('mention', (user: any) => self.$emit('mention', user));
      editor.on('autosave:status', (payload: any) => self.$emit('autosave:status', payload));
      editor.on('autosave:saved', (payload: any) => self.$emit('autosave:saved', payload));
      editor.on('autosave:restored', (payload: any) => self.$emit('autosave:restored', payload));
      editor.on('statistics:update', (stats: any) => {
        self.statistics = stats;
        self.$emit('statistics:update', stats);
      });
      editor.on('limit:warning', (payload: any) => self.$emit('limit:warning', payload));
      editor.on('limit:exceeded', (payload: any) => self.$emit('limit:exceeded', payload));

      self.editor = editor;
      self.statistics = editor.getStatistics();
      self.$emit('ready', { editor });
    },
    destroyEditor() {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed) {
        self.editor.destroy();
        self.editor = null;
      }
    },
    syncLimits() {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed) {
        self.editor.setLimits({
          maxWords: self.wordLimit,
          maxCharacters: self.characterLimit,
          hardLimit: self.hardLimit,
        });
      }
    },
    getOutput(): string | Record<string, any> {
      const self = this as any;
      if (!self.editor || self.editor.isDestroyed) return '';
      if (self.outputFormat === 'json') return self.editor.getJSON();
      if (self.outputFormat === 'text') return self.editor.getText();
      return self.editor.getHTML();
    },
    getHTML(): string {
      return (this as any).editor?.getHTML() || '';
    },
    getJSON(): Record<string, any> {
      return (this as any).editor?.getJSON() || {};
    },
    getText(): string {
      return (this as any).editor?.getText() || '';
    },
    getSanitizedHTML(): string {
      return (this as any).editor?.getSanitizedHTML() || '';
    },
    setContent(content: string | Record<string, any>, emitUpdate = false) {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed) {
        self.editor.setContent(content, emitUpdate);
      }
      if (emitUpdate) {
        self.internalValue = content;
        self.$emit('input', content);
        self.$emit('update:modelValue', content);
        self.$emit('change', content);
      }
    },
    clearContent(emitUpdate = false) {
      const self = this as any;
      if (self.editor && !self.editor.isDestroyed) {
        self.editor.clearContent(emitUpdate);
      }
      if (emitUpdate) {
        self.internalValue = '';
        self.$emit('input', '');
        self.$emit('update:modelValue', '');
        self.$emit('change', '');
      }
    },
    focus(position?: 'start' | 'end' | 'all' | number) {
      (this as any).editor?.focus(position);
    },
    blur() {
      (this as any).editor?.blur();
    },
    undo(): boolean {
      return (this as any).editor?.undo() || false;
    },
    redo(): boolean {
      return (this as any).editor?.redo() || false;
    },
    setEditable(editable: boolean) {
      (this as any).editor?.setEditable(editable);
    },
    insertImage(attrs: Record<string, any>) {
      (this as any).editor?.insertImage(attrs);
    },
    insertFile(attrs: Record<string, any>) {
      (this as any).editor?.insertFile(attrs);
    },
    insertEmbed(attrs: Record<string, any>) {
      (this as any).editor?.insertEmbed(attrs);
    },
    insertMention(user: Record<string, any>) {
      (this as any).editor?.insertMention(user);
    },
    saveDraft(force = false) {
      (this as any).editor?.saveDraft(force);
    },
    restoreDraft(): boolean {
      return (this as any).editor?.restoreDraft() || false;
    },
    clearDraft() {
      (this as any).editor?.clearDraft();
    },
    getWordCount(): number {
      return (this as any).editor?.getWordCount() || 0;
    },
    getCharacterCount(excludeSpaces = false): number {
      return (this as any).editor?.getCharacterCount(excludeSpaces) || 0;
    },
    getParagraphCount(): number {
      return (this as any).editor?.getParagraphCount() || 0;
    },
    getStatistics(): EditorStatistics {
      return (this as any).editor?.getStatistics() || (this as any).statistics;
    },
    setLimits(limits: Partial<StatisticsConfig>) {
      (this as any).editor?.setLimits(limits);
    },
    getEditorInstance(): UniversalEditor | null {
      return (this as any).editor;
    },
  },
  render(h: any) {
    const self = this as any;

    const editorMountNode = h('div', {
      ref: 'editorContainer',
      class: 'ue-editor-mount',
      style: {
        minHeight: self.minHeight,
        maxHeight: self.maxHeight,
      },
    });

    const isWordApproaching =
      self.wordLimit &&
      self.statistics.words >= self.wordLimit * 0.9 &&
      self.statistics.words <= self.wordLimit;
    const isWordExceeded = self.wordLimit && self.statistics.words > self.wordLimit;

    const isCharApproaching =
      self.characterLimit &&
      self.statistics.characters >= self.characterLimit * 0.9 &&
      self.statistics.characters <= self.characterLimit;
    const isCharExceeded =
      self.characterLimit && self.statistics.characters > self.characterLimit;

    // Stat item chips
    const statItems: any[] = [];

    if (self.showWordCount) {
      statItems.push(
        h(
          'span',
          {
            class: {
              'ue-stat-item': true,
              'ue-stat-words': true,
              'is-warning': isWordApproaching,
              'is-danger': isWordExceeded,
              'ue-stat-warning': isWordApproaching,
              'ue-stat-danger': isWordExceeded,
            },
            attrs: {
              title: self.wordLimit
                ? `Words: ${self.statistics.words} / ${self.wordLimit}`
                : `Words: ${self.statistics.words}`,
            },
          },
          [
            h(
              'span',
              { class: 'ue-stat-value' },
              `${self.statistics.words} ${self.statistics.words === 1 ? 'word' : 'words'}`
            ),
            self.wordLimit
              ? h('span', { class: 'ue-stat-limit' }, ` / ${self.wordLimit}`)
              : null,
          ]
        )
      );
    }

    if (
      self.showWordCount &&
      (self.showCharacterCount ||
        self.showCharactersNoSpaces ||
        self.showParagraphCount ||
        self.showReadingTime)
    ) {
      statItems.push(h('span', { class: 'ue-stat-divider' }, '•'));
    }

    if (self.showCharacterCount) {
      statItems.push(
        h(
          'span',
          {
            class: {
              'ue-stat-item': true,
              'ue-stat-characters': true,
              'is-warning': isCharApproaching,
              'is-danger': isCharExceeded,
              'ue-stat-warning': isCharApproaching,
              'ue-stat-danger': isCharExceeded,
            },
            attrs: {
              title: self.characterLimit
                ? `Characters: ${self.statistics.characters} / ${self.characterLimit}`
                : `Characters: ${self.statistics.characters}`,
            },
          },
          [
            h(
              'span',
              { class: 'ue-stat-value' },
              `${self.statistics.characters} ${
                self.statistics.characters === 1 ? 'character' : 'characters'
              }`
            ),
            self.characterLimit
              ? h('span', { class: 'ue-stat-limit' }, ` / ${self.characterLimit}`)
              : null,
          ]
        )
      );
    }

    if (self.showCharactersNoSpaces) {
      statItems.push(h('span', { class: 'ue-stat-divider' }, '•'));
      statItems.push(
        h(
          'span',
          {
            class: 'ue-stat-item ue-stat-no-spaces ue-stat-characters-no-spaces',
            attrs: { title: 'Characters excluding whitespace' },
          },
          [
            h('span', { class: 'ue-stat-label' }, 'No spaces:'),
            h(
              'span',
              { class: 'ue-stat-value' },
              String(self.statistics.charactersExcludingSpaces)
            ),
          ]
        )
      );
    }

    if (self.showParagraphCount) {
      statItems.push(h('span', { class: 'ue-stat-divider' }, '•'));
      statItems.push(
        h(
          'span',
          {
            class: 'ue-stat-item ue-stat-paragraphs',
            attrs: { title: 'Paragraphs and block nodes' },
          },
          [
            h('span', { class: 'ue-stat-label' }, 'Paragraphs:'),
            h('span', { class: 'ue-stat-value' }, String(self.statistics.paragraphs)),
          ]
        )
      );
    }

    if (self.showReadingTime) {
      statItems.push(h('span', { class: 'ue-stat-divider' }, '•'));
      statItems.push(
        h(
          'span',
          {
            class: 'ue-stat-item ue-stat-reading-time',
            attrs: { title: 'Estimated reading time' },
          },
          [h('span', { class: 'ue-stat-value' }, self.statistics.readingTimeString)]
        )
      );
    }

    const footerNode = h('div', { class: 'ue-footer ue-editor-footer' }, [
      h(
        'div',
        { class: 'ue-footer-status' },
        self.$slots.status || []
      ),
      h(
        'div',
        { class: 'ue-footer-stats' },
        self.$slots.stats || statItems
      ),
    ]);

    return h(
      'div',
      {
        class: {
          'ue-wrapper': true,
          [self.themeClass]: !!self.themeClass,
        },
      },
      [editorMountNode, footerNode]
    );
  },
};
