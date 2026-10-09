import { Editor as TiptapEditor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';

import { EventEmitter } from '@universal-editor/utils';
import type {
  Content,
  EditorOptions,
  FocusPosition,
  HeadingLevel,
  LinkAttributes,
  ImageAttributes,
  FileAttachmentAttributes,
  TextAlignment,
  UniversalEditorInterface,
  UploaderInterface,
  InsertTableOptions,
} from './types';
import { DefaultUploader } from './upload/Uploader';
import { CustomImage } from './extensions/CustomImage';
import { FileAttachment } from './extensions/FileAttachment';
import { DropPasteHandler } from './extensions/DropPasteHandler';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { TextIndent } from './extensions/TextIndent';
import { TextDirection } from './extensions/TextDirection';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { CustomCodeBlock } from './extensions/CodeBlockExtension';
import { EmbedExtension } from './extensions/EmbedExtension';
import { detectEmbedProvider } from './embed/detectEmbed';
import type { EmbedDetectionResult, EmbedConfig } from './embed/types';
import { SlashCommandsExtension } from './slash-commands/SlashCommandsExtension';
import { DEFAULT_SLASH_COMMANDS } from './slash-commands/defaultCommands';
import type { SlashCommandItem } from './slash-commands/types';
import { MentionExtension } from './mentions/MentionExtension';
import { DEFAULT_MENTION_USERS } from './mentions/defaultUsers';
import type { MentionUser } from './mentions/types';
import { ContentSanitizer } from './security/ContentSanitizer';
import type { SanitizerConfig } from './security/types';
import type { CodeBlockOptions } from './types';
import { Toolbar } from './ui/Toolbar';
import { BubbleMenu } from './ui/BubbleMenu';
import { TableToolbar } from './ui/TableToolbar';
import { TableContextMenu } from './ui/TableContextMenu';
import { AutosaveManager } from './autosave/AutosaveManager';
import { AutosaveIndicator } from './autosave/AutosaveIndicator';
import type { AutosaveStatus, DraftData } from './autosave/types';
import {
  WordCounterExtension,
  countWords,
  countCharacters,
  countParagraphs,
  calculateReadingTime,
} from './statistics/WordCounterExtension';
import type { EditorStatistics, StatisticsConfig, LimitEventPayload } from './statistics/types';
import { ThemeManager } from './theme/ThemeManager';
import type { EditorTheme, EditorThemeTokens } from './theme/types';
import { Announcer } from './accessibility/Announcer';
import { MobileManager } from './mobile/MobileManager';

export class UniversalEditor extends EventEmitter implements UniversalEditorInterface {
  private _tiptap: TiptapEditor;
  private _options: EditorOptions;
  private _isDestroyed = false;
  private _uploader: UploaderInterface;
  private _themeManager: ThemeManager;
  public toolbar?: Toolbar;
  public bubbleMenu?: BubbleMenu;
  public tableToolbar?: TableToolbar;
  public tableContextMenu?: TableContextMenu;
  public autosaveManager?: AutosaveManager;
  public autosaveIndicator?: AutosaveIndicator;
  public announcer?: Announcer;
  public mobileManager?: MobileManager;

  constructor(options: EditorOptions = {}) {
    super();
    this._options = {
      editable: true,
      content: '',
      ...options,
    };

    // Initialize uploader
    if (this._options.uploader && 'uploadImage' in this._options.uploader) {
      this._uploader = this._options.uploader as UploaderInterface;
    } else {
      this._uploader = new DefaultUploader(this._options.uploader);
    }

    const targetElement =
      typeof this._options.element === 'string'
        ? typeof document !== 'undefined'
          ? (document.querySelector(this._options.element) as HTMLElement)
          : null
        : this._options.element;

    // Default extensions for Phase 2 & Phase 4 Rich Text & Media editing
    const defaultExtensions = [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false,
      }),
      CustomCodeBlock,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          rel: 'noopener noreferrer',
        },
      }),
      CustomImage,
      FileAttachment,
      DropPasteHandler.configure({
        editorInstance: this,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      FontFamily,
      FontSize,
      LineHeight,
      TextIndent,
      TextDirection,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'ue-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      EmbedExtension,
      SlashCommandsExtension.configure({
        enabled:
          ((this._options as any).enableSlashCommands !== undefined
            ? (this._options as any).enableSlashCommands
            : this._options.slashCommands) !== false,
        commands:
          typeof this._options.slashCommands === 'object' && this._options.slashCommands.commands
            ? this._options.slashCommands.commands
            : DEFAULT_SLASH_COMMANDS,
        suggestionChar:
          typeof this._options.slashCommands === 'object' && this._options.slashCommands.suggestionChar
            ? this._options.slashCommands.suggestionChar
            : '/',
        coreEditor: this,
      }),
      MentionExtension.configure({
        enabled:
          ((this._options as any).enableMentions !== undefined
            ? (this._options as any).enableMentions
            : this._options.mentions) !== false,
        triggerChar:
          typeof this._options.mentions === 'object' && this._options.mentions.triggerChar
            ? this._options.mentions.triggerChar
            : '@',
        provider:
          typeof this._options.mentions === 'object' && this._options.mentions.provider
            ? this._options.mentions.provider
            : undefined,
        defaultUsers:
          typeof this._options.mentions === 'object' && this._options.mentions.defaultUsers
            ? this._options.mentions.defaultUsers
            : DEFAULT_MENTION_USERS,
        maxSuggestions:
          typeof this._options.mentions === 'object' && this._options.mentions.maxSuggestions
            ? this._options.mentions.maxSuggestions
            : 10,
        coreEditor: this,
      }),
      WordCounterExtension.configure({
        ...(typeof this._options.statistics === 'object'
          ? this._options.statistics
          : typeof this._options.wordCounter === 'object'
            ? this._options.wordCounter
            : {}),
        onUpdate: (stats: EditorStatistics) => {
          this.emit('statistics:update', stats);
        },
        onLimitWarning: (payload: LimitEventPayload) => {
          this.emit('limit:warning', payload);
        },
        onLimitExceeded: (payload: LimitEventPayload) => {
          this.emit('limit:exceeded', payload);
        },
      }),
    ];

    const extensions =
      options.extensions && options.extensions.length > 0 ? options.extensions : defaultExtensions;

    // Initialize Tiptap core instance
    const customLabel =
      typeof this._options.accessibility === 'object' && this._options.accessibility.editorLabel
        ? this._options.accessibility.editorLabel
        : 'Rich Text Editor content area';

    this._tiptap = new TiptapEditor({
      element: targetElement ?? undefined,
      content: this._options.content ?? '',
      editable: this._options.editable ?? true,
      autofocus: this._options.autofocus ?? false,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': customLabel,
        },
      },
      extensions,
      onUpdate: ({ transaction }) => {
        this.emit('update', { editor: this, transaction });
        this.emit('change', { editor: this, transaction });
      },
      onFocus: ({ event }) => {
        this.emit('focus', { editor: this, event });
      },
      onBlur: ({ event }) => {
        this.emit('blur', { editor: this, event });
      },
      onSelectionUpdate: ({ transaction }) => {
        this.emit('selectionUpdate', { editor: this, transaction });
      },
      onTransaction: ({ transaction }) => {
        this.emit('transaction', { editor: this, transaction });
      },
      onDestroy: () => {
        this._isDestroyed = true;
        this.emit('destroy');
      },
    });

    // Wire up initial event callbacks into event bus
    if (this._options.onUpdate) this.on('update', this._options.onUpdate);
    if (this._options.onFocus) this.on('focus', this._options.onFocus);
    if (this._options.onBlur) this.on('blur', this._options.onBlur);
    if (this._options.onSelectionUpdate)
      this.on('selectionUpdate', this._options.onSelectionUpdate);
    if (this._options.onTransaction) this.on('transaction', this._options.onTransaction);
    if (this._options.onDestroy) this.on('destroy', this._options.onDestroy);

    // Optional Toolbar attachment
    const toolbarOption =
      (this._options as any).enableToolbar !== undefined
        ? (this._options as any).enableToolbar
        : this._options.toolbar;
    if (toolbarOption && targetElement && targetElement.parentElement) {
      const config = Array.isArray(toolbarOption) ? toolbarOption : undefined;
      this.toolbar = new Toolbar(this, config);
      targetElement.parentElement.insertBefore(this.toolbar.element, targetElement);
    }

    // Optional BubbleMenu attachment
    const bubbleOption =
      (this._options as any).enableBubbleMenu !== undefined
        ? (this._options as any).enableBubbleMenu
        : this._options.bubbleMenu;
    if (bubbleOption !== false && typeof document !== 'undefined') {
      const linkDialog = this.toolbar?.linkDialog || (this.toolbar = new Toolbar(this)).linkDialog;
      this.bubbleMenu = new BubbleMenu(this, linkDialog);
    }

    // Attach contextual Table Toolbar and Context Menu
    if (typeof document !== 'undefined') {
      this.tableToolbar = new TableToolbar(this);
      this.tableContextMenu = new TableContextMenu(this);
    }

    // Initialize Autosave & Draft System (Phase 13)
    const isAutosaveEnabled =
      this._options.autosave !== false &&
      (typeof this._options.autosave !== 'object' || this._options.autosave.enabled !== false);
    if (isAutosaveEnabled) {
      this.autosaveManager = new AutosaveManager(this, this._options.autosave);
    }

    // Initialize Theming Engine (Phase 22)
    const initialTheme = this._options.theme || 'dark';
    this._themeManager = new ThemeManager({
      targetElement: targetElement ?? undefined,
      defaultTheme: typeof initialTheme === 'string' ? initialTheme : initialTheme.id,
      themes: typeof initialTheme === 'object' ? [initialTheme] : undefined,
    });
    if (this._options.customTokens) {
      this._themeManager.setCustomTokens(this._options.customTokens);
    }

    // Apply active theme to toolbar and wrapper if present
    const activeTheme = this._themeManager.getTheme();
    if (this.toolbar?.element) {
      this._themeManager.applyTheme(activeTheme, this.toolbar.element);
    }
    if (targetElement?.parentElement && targetElement.parentElement !== document.body) {
      this._themeManager.applyTheme(activeTheme, targetElement.parentElement);
    }

    this._themeManager.subscribe((theme) => {
      if (this.toolbar?.element) {
        this._themeManager.applyTheme(theme, this.toolbar.element);
      }
      if (targetElement?.parentElement && targetElement.parentElement !== document.body) {
        this._themeManager.applyTheme(theme, targetElement.parentElement);
      }
      this.emit('theme:change', theme);
    });

    // Initialize Screen Reader Announcer (Phase 23)
    if (this._options.accessibility !== false) {
      const a11yConfig =
        typeof this._options.accessibility === 'object'
          ? this._options.accessibility
          : {};
      this.announcer = new Announcer(a11yConfig);

      if (a11yConfig.autoAnnounceFormatting !== false) {
        this.on('selectionUpdate', () => {
          if (!this.announcer) return;
          const marks: string[] = [];
          if (this.isActive('bold')) marks.push('Bold');
          if (this.isActive('italic')) marks.push('Italic');
          if (this.isActive('underline')) marks.push('Underline');
          if (this.isActive('strike')) marks.push('Strikethrough');
          if (this.isActive('code')) marks.push('Inline Code');
          if (this.isActive('link')) marks.push('Link');
          if (marks.length > 0) {
            this.announcer.announce(`Formatting active: ${marks.join(', ')}`);
          }
        });
      }
    }

    // Initialize Mobile & Touch Manager (Phase 23)
    if (this._options.mobile !== false && targetElement) {
      const mobileContainer = (targetElement.parentElement || targetElement) as HTMLElement;
      const mobileConfig =
        typeof this._options.mobile === 'object' ? this._options.mobile : {};
      this.mobileManager = new MobileManager(mobileContainer, mobileConfig);
    }
  }

  /**
   * Underlying Tiptap instance
   */
  public get tiptap(): TiptapEditor {
    return this._tiptap;
  }

  /**
   * Check if editor is destroyed
   */
  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Whether the editor is currently editable
   */
  public get isEditable(): boolean {
    return this._tiptap.isEditable;
  }

  /**
   * Toggle editable state
   */
  public setEditable(editable: boolean): void {
    this._tiptap.setEditable(editable);
  }

  /**
   * Uploader instance
   */
  public get uploader(): UploaderInterface {
    return this._uploader;
  }

  /**
   * Set custom uploader
   */
  public setUploader(uploader: UploaderInterface): void {
    this._uploader = uploader;
  }

  /**
   * Get HTML content from the editor
   */
  public getHTML(): string {
    return this._tiptap.getHTML();
  }

  /**
   * Get sanitized HTML content from the editor, safely protected against XSS
   */
  public getSanitizedHTML(config?: SanitizerConfig): string {
    const rawHtml = this.getHTML();
    const effectiveConfig = config || this._options.sanitizer;
    return ContentSanitizer.sanitize(rawHtml, effectiveConfig);
  }

  /**
   * Get JSON content representation
   */
  public getJSON(): Record<string, any> {
    return this._tiptap.getJSON();
  }

  /**
   * Get plain text content
   */
  public getText(): string {
    return this._tiptap.getText();
  }

  /**
   * Set editor content
   */
  public setContent(content: Content, emitUpdate = false): void {
    this._tiptap.commands.setContent(content ?? '', emitUpdate);
  }

  /**
   * Clear all content
   */
  public clearContent(emitUpdate = false): void {
    this._tiptap.commands.clearContent(emitUpdate);
  }

  /**
   * Focus editor
   */
  public focus(position: FocusPosition = 'end'): void {
    this._tiptap.commands.focus(position ?? 'end');
  }

  /**
   * Blur editor
   */
  public blur(): void {
    this._tiptap.commands.blur();
  }

  /**
   * Undo last action
   */
  public undo(): boolean {
    return this._tiptap.commands.undo();
  }

  /**
   * Redo last action
   */
  public redo(): boolean {
    return this._tiptap.commands.redo();
  }

  // --- Phase 2 Formatting Commands ---

  public toggleBold(): boolean {
    return this._tiptap.chain().focus().toggleBold().run();
  }

  public toggleItalic(): boolean {
    return this._tiptap.chain().focus().toggleItalic().run();
  }

  public toggleUnderline(): boolean {
    return this._tiptap.chain().focus().toggleUnderline().run();
  }

  public toggleStrike(): boolean {
    return this._tiptap.chain().focus().toggleStrike().run();
  }

  public toggleCode(): boolean {
    return this._tiptap.chain().focus().toggleCode().run();
  }

  public setParagraph(): boolean {
    return this._tiptap.chain().focus().setParagraph().run();
  }

  public toggleHeading(level: HeadingLevel): boolean {
    return this._tiptap.chain().focus().toggleHeading({ level }).run();
  }

  public toggleBulletList(): boolean {
    return this._tiptap.chain().focus().toggleBulletList().run();
  }

  public toggleOrderedList(): boolean {
    return this._tiptap.chain().focus().toggleOrderedList().run();
  }

  public toggleTaskList(): boolean {
    return this._tiptap.chain().focus().toggleTaskList().run();
  }

  public setTextAlign(alignment: TextAlignment): boolean {
    return this._tiptap.chain().focus().setTextAlign(alignment).run();
  }

  public toggleBlockquote(): boolean {
    return this._tiptap.chain().focus().toggleBlockquote().run();
  }

  public setHorizontalRule(): boolean {
    return this._tiptap.chain().focus().setHorizontalRule().run();
  }

  public clearFormatting(): boolean {
    return this._tiptap.chain().focus().unsetAllMarks().clearNodes().run();
  }

  public setLink(attributes: LinkAttributes): boolean {
    return this._tiptap
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: attributes.href,
        target: attributes.target,
        rel: attributes.rel ?? (attributes.target === '_blank' ? 'noopener noreferrer' : undefined),
      })
      .run();
  }

  public unsetLink(): boolean {
    return this._tiptap.chain().focus().extendMarkRange('link').unsetLink().run();
  }

  public getLinkAttributes(): Record<string, any> {
    return this._tiptap.getAttributes('link');
  }

  public isActive(name: string | Record<string, any>, attributes?: Record<string, any>): boolean {
    if (typeof name === 'object') {
      return this._tiptap.isActive(name);
    }
    return this._tiptap.isActive(name, attributes);
  }

  // --- Phase 4 Media & File Management Commands ---

  public insertImage(options: ImageAttributes): boolean {
    return this._tiptap.chain().focus().setImage(options).run();
  }

  public async uploadAndInsertImage(file: File): Promise<string> {
    this.emit('imageUpload', { file, editor: this });
    const res = await this._uploader.uploadImage(file);
    const src = typeof res === 'string' ? res : res.url;
    this.insertImage({
      src,
      alt: file.name,
      title: file.name,
    });
    return src;
  }

  public insertFile(options: FileAttachmentAttributes): boolean {
    return this._tiptap.chain().focus().insertFileAttachment(options).run();
  }

  public async uploadAndInsertFile(file: File): Promise<any> {
    this.emit('fileUpload', { file, editor: this });
    const res = await this._uploader.uploadFile(file);
    this.insertFile({
      url: res.url,
      name: res.name || file.name,
      size: res.size || file.size,
      type: res.type || file.type,
    });
    return res;
  }

  // --- Phase 7 Advanced Formatting Commands ---

  public setColor(color: string): boolean {
    return this._tiptap.chain().focus().setColor(color).run();
  }

  public unsetColor(): boolean {
    return this._tiptap.chain().focus().unsetColor().run();
  }

  public setHighlight(color?: string): boolean {
    return color
      ? this._tiptap.chain().focus().setHighlight({ color }).run()
      : this._tiptap.chain().focus().setHighlight().run();
  }

  public toggleHighlight(attributes?: { color?: string }): boolean {
    return attributes?.color
      ? this._tiptap.chain().focus().toggleHighlight({ color: attributes.color }).run()
      : this._tiptap.chain().focus().toggleHighlight().run();
  }

  public unsetHighlight(): boolean {
    return this._tiptap.chain().focus().unsetHighlight().run();
  }

  public setFontSize(size: string): boolean {
    return (this._tiptap.chain().focus() as any).setFontSize(size).run();
  }

  public unsetFontSize(): boolean {
    return (this._tiptap.chain().focus() as any).unsetFontSize().run();
  }

  public setFontFamily(font: string): boolean {
    return this._tiptap.chain().focus().setFontFamily(font).run();
  }

  public unsetFontFamily(): boolean {
    return this._tiptap.chain().focus().unsetFontFamily().run();
  }

  public toggleSubscript(): boolean {
    return this._tiptap.chain().focus().toggleSubscript().run();
  }

  public toggleSuperscript(): boolean {
    return this._tiptap.chain().focus().toggleSuperscript().run();
  }

  public setLineHeight(lineHeight: string): boolean {
    return (this._tiptap.chain().focus() as any).setLineHeight(lineHeight).run();
  }

  public unsetLineHeight(): boolean {
    return (this._tiptap.chain().focus() as any).unsetLineHeight().run();
  }

  public indent(): boolean {
    return (this._tiptap.chain().focus() as any).indent().run();
  }

  public outdent(): boolean {
    return (this._tiptap.chain().focus() as any).outdent().run();
  }

  public setTextDirection(direction: 'ltr' | 'rtl' | 'auto'): boolean {
    return (this._tiptap.chain().focus() as any).setTextDirection(direction).run();
  }

  public setRtl(): boolean {
    return (this._tiptap.chain().focus() as any).setRtl().run();
  }

  public setLtr(): boolean {
    return (this._tiptap.chain().focus() as any).setLtr().run();
  }

  public toggleTextDirection(): boolean {
    return (this._tiptap.chain().focus() as any).toggleTextDirection().run();
  }

  // --- Phase 8 Tables Commands ---

  public insertTable(options?: InsertTableOptions): boolean {
    return this._tiptap
      .chain()
      .focus()
      .insertTable({
        rows: options?.rows ?? 3,
        cols: options?.cols ?? 3,
        withHeaderRow: options?.withHeaderRow ?? true,
      })
      .run();
  }

  public addColumnBefore(): boolean {
    return this._tiptap.chain().focus().addColumnBefore().run();
  }

  public addColumnAfter(): boolean {
    return this._tiptap.chain().focus().addColumnAfter().run();
  }

  public deleteColumn(): boolean {
    return this._tiptap.chain().focus().deleteColumn().run();
  }

  public addRowBefore(): boolean {
    return this._tiptap.chain().focus().addRowBefore().run();
  }

  public addRowAfter(): boolean {
    return this._tiptap.chain().focus().addRowAfter().run();
  }

  public deleteRow(): boolean {
    return this._tiptap.chain().focus().deleteRow().run();
  }

  public deleteTable(): boolean {
    return this._tiptap.chain().focus().deleteTable().run();
  }

  public mergeCells(): boolean {
    return this._tiptap.chain().focus().mergeCells().run();
  }

  public splitCell(): boolean {
    return this._tiptap.chain().focus().splitCell().run();
  }

  public toggleHeaderColumn(): boolean {
    return this._tiptap.chain().focus().toggleHeaderColumn().run();
  }

  public toggleHeaderRow(): boolean {
    return this._tiptap.chain().focus().toggleHeaderRow().run();
  }

  public toggleHeaderCell(): boolean {
    return this._tiptap.chain().focus().toggleHeaderCell().run();
  }

  public mergeOrSplit(): boolean {
    return this._tiptap.chain().focus().mergeOrSplit().run();
  }

  public setCellAttribute(name: string, value: any): boolean {
    return this._tiptap.chain().focus().setCellAttribute(name, value).run();
  }

  public fixTables(): boolean {
    return this._tiptap.chain().focus().fixTables().run();
  }

  public isTableActive(): boolean {
    return this._tiptap.isActive('table');
  }

  // --- Phase 9 Code Block & Developer Features ---

  public toggleCodeBlock(options?: CodeBlockOptions): boolean {
    return this._tiptap
      .chain()
      .focus()
      .toggleCodeBlock(options?.language ? { language: options.language } : undefined)
      .run();
  }

  public setCodeBlock(options?: CodeBlockOptions): boolean {
    return this._tiptap
      .chain()
      .focus()
      .setCodeBlock(options?.language ? { language: options.language } : undefined)
      .run();
  }

  public isCodeBlockActive(options?: CodeBlockOptions): boolean {
    return this._tiptap.isActive(
      'codeBlock',
      options?.language ? { language: options.language } : undefined
    );
  }

  public getCodeBlockLanguage(): string | null {
    if (!this.isCodeBlockActive()) return null;
    return this._tiptap.getAttributes('codeBlock').language || null;
  }

  public setCodeBlockLanguage(language: string): boolean {
    return this._tiptap
      .chain()
      .focus()
      .updateAttributes('codeBlock', { language })
      .run();
  }

  // --- Phase 10 Embeds API ---

  public insertEmbed(options: {
    url: string;
    width?: string;
    height?: string;
    alignment?: 'left' | 'center' | 'right';
    title?: string;
  }): boolean {
    const embedConfig: EmbedConfig | undefined = (this._options as any).embed;
    const detected = detectEmbedProvider(options.url, embedConfig);
    if (!detected.valid) {
      return false;
    }

    return this._tiptap
      .chain()
      .focus()
      .setEmbed({
        src: detected.embedUrl,
        provider: detected.provider,
        originalUrl: options.url,
        width: options.width || '100%',
        height: options.height || (detected.provider === 'video' ? 'auto' : '420px'),
        title: options.title || detected.title || '',
        alignment: options.alignment || 'center',
      })
      .run();
  }

  public detectEmbed(url: string): EmbedDetectionResult {
    const embedConfig: EmbedConfig | undefined = (this._options as any).embed;
    return detectEmbedProvider(url, embedConfig);
  }

  // Phase 11: Slash Commands API
  public getSlashCommands(): SlashCommandItem[] {
    const ext = this._tiptap.extensionManager.extensions.find(
      e => e.name === 'slashCommands'
    );
    return ext?.options?.commands || DEFAULT_SLASH_COMMANDS;
  }

  public registerSlashCommand(item: SlashCommandItem): void {
    const ext = this._tiptap.extensionManager.extensions.find(
      e => e.name === 'slashCommands'
    );
    if (ext) {
      if (!ext.options.commands) {
        ext.options.commands = [...DEFAULT_SLASH_COMMANDS];
      }
      ext.options.commands.push(item);
    }
  }

  public openImageDialog(): void {
    this.toolbar?.imageDialog?.open();
    this.emit('open-image-dialog');
  }

  public openFileDialog(): void {
    this.toolbar?.fileDialog?.open();
    this.emit('open-file-dialog');
  }

  public openEmbedDialog(): void {
    this.toolbar?.embedDialog?.open();
    this.emit('open-embed-dialog');
  }

  // Phase 12: Mentions API
  public insertMention(user: MentionUser): boolean {
    if (this._isDestroyed) return false;
    const label = user.label || user.name || user.username;
    return this._tiptap
      .chain()
      .focus()
      .insertContent([
        {
          type: 'mention',
          attrs: {
            id: user.id,
            label,
            username: user.username,
            avatar: user.avatar,
            role: user.role,
          },
        },
        {
          type: 'text',
          text: ' ',
        },
      ])
      .run();
  }

  public getMentions(): MentionUser[] {
    if (this._isDestroyed) return [];
    const mentions: MentionUser[] = [];
    this._tiptap.state.doc.descendants(node => {
      if (node.type.name === 'mention') {
        mentions.push({
          id: node.attrs.id,
          name: node.attrs.label,
          username: node.attrs.username,
          avatar: node.attrs.avatar,
          role: node.attrs.role,
        });
      }
    });
    return mentions;
  }

  // --- Phase 13 Autosave & Draft System API ---

  public async saveDraft(manual = true): Promise<boolean> {
    if (!this.autosaveManager) return false;
    return this.autosaveManager.saveDraft(manual);
  }

  public restoreDraft(draft?: DraftData): boolean {
    if (!this.autosaveManager) return false;
    return this.autosaveManager.restoreDraft(draft);
  }

  public getDraft(): DraftData | null {
    return this.autosaveManager?.getDraft() || null;
  }

  public clearDraft(): boolean {
    return this.autosaveManager?.clearDraft() || false;
  }

  public getAutosaveStatus(): AutosaveStatus {
    return this.autosaveManager?.getStatus() || 'saved';
  }

  public getLastSavedTime(): Date | null {
    return this.autosaveManager?.getLastSavedTime() || null;
  }

  public hasDraft(): boolean {
    return this.autosaveManager?.hasDraft() || false;
  }

  /**
   * Phase 14: Word & Character Counter API
   */
  public getWordCount(): number {
    return this._tiptap.storage.wordCounter?.words() ?? countWords(this.getText());
  }

  public getCharacterCount(excludeSpaces = false): number {
    return (
      this._tiptap.storage.wordCounter?.characters(excludeSpaces) ??
      countCharacters(this.getText(), excludeSpaces)
    );
  }

  public getParagraphCount(): number {
    return (
      this._tiptap.storage.wordCounter?.paragraphs() ??
      countParagraphs(this._tiptap.state.doc)
    );
  }

  public getStatistics(): EditorStatistics {
    if (this._tiptap.storage.wordCounter?.getStatistics) {
      return this._tiptap.storage.wordCounter.getStatistics();
    }
    const text = this.getText();
    const words = countWords(text);
    const characters = countCharacters(text, false);
    const charactersExcludingSpaces = countCharacters(text, true);
    const paragraphs = countParagraphs(this._tiptap.state.doc);
    const reading = calculateReadingTime(words);
    return {
      words,
      characters,
      charactersExcludingSpaces,
      paragraphs,
      readingTime: reading.minutes,
      readingTimeString: reading.text,
    };
  }

  public setLimits(limits: StatisticsConfig): void {
    this._tiptap.storage.wordCounter?.setLimits(limits);
  }

  // Phase 22 Theming Engine API
  public get themeManager(): ThemeManager {
    return this._themeManager;
  }

  public setTheme(theme: string | EditorTheme): EditorTheme {
    return this._themeManager.applyTheme(theme);
  }

  public getTheme(): EditorTheme {
    return this._themeManager.getTheme();
  }

  public getThemes(): EditorTheme[] {
    return this._themeManager.getThemes();
  }

  public setCustomTokens(tokens: Partial<EditorThemeTokens>): void {
    this._themeManager.setCustomTokens(tokens);
  }

  /**
   * Destroy editor and unbind event listeners
   */
  public destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    if (this._themeManager) {
      this._themeManager.destroy();
    }
    if (this.autosaveManager) {
      this.autosaveManager.destroy();
    }
    if (this.autosaveIndicator) {
      this.autosaveIndicator.destroy();
    }
    if (this.toolbar) {
      this.toolbar.destroy();
    }
    if (this.bubbleMenu) {
      this.bubbleMenu.destroy();
    }
    if (this.tableToolbar) {
      this.tableToolbar.destroy();
    }
    if (this.tableContextMenu) {
      this.tableContextMenu.destroy();
    }
    if (this.announcer) {
      this.announcer.destroy();
    }
    if (this.mobileManager) {
      this.mobileManager.destroy();
    }

    this._tiptap.destroy();
    this.removeAllListeners();
  }
}
