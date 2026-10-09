import type { Editor as TiptapEditor, Extension, Mark, Node } from '@tiptap/core';
import type {
  ImageAttributes,
  FileAttachmentAttributes,
  UploaderInterface,
  UploaderOptions,
} from './upload/types';

import type { SanitizerConfig } from './security/types';
import type { SlashCommandItem, SlashCommandsConfig } from './slash-commands/types';
import type { MentionUser, MentionConfig } from './mentions/types';
import type { AutosaveConfig, AutosaveStatus, DraftData } from './autosave/types';
import type { AutosaveManager } from './autosave/AutosaveManager';
import type { EditorStatistics, StatisticsConfig, LimitEventPayload } from './statistics/types';

export * from './upload/types';
export * from './security/types';
export * from './embed/types';
export * from './embed/detectEmbed';
export * from './slash-commands/types';
export * from './slash-commands/defaultCommands';
export * from './mentions/types';
export * from './mentions/defaultUsers';
export * from './autosave/types';
export * from './autosave/AutosaveStorage';
export * from './autosave/AutosaveManager';
export * from './statistics/types';
export * from './statistics/WordCounterExtension';
export * from './autosave/AutosaveIndicator';
export * from './theme/types';
export * from './theme/presets';
export * from './theme/ThemeManager';
export * from './accessibility/types';
export * from './mobile/types';

import type { EditorTheme, EditorThemeTokens } from './theme/types';
import type { ThemeManager } from './theme/ThemeManager';
import type { AccessibilityConfig } from './accessibility/types';
import type { MobileConfig } from './mobile/types';

export type Content = string | Record<string, any> | null;

export type FocusPosition = 'start' | 'end' | 'all' | number | boolean | null;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface LinkAttributes {
  href: string;
  target?: string;
  rel?: string;
}

export type ToolbarItemName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'align'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'blockquote'
  | 'hr'
  | 'clearFormatting'
  | 'link'
  | 'image'
  | 'file'
  | 'table'
  | 'codeBlock'
  | 'embed'
  | 'color'
  | 'highlight'
  | 'fontFamily'
  | 'fontSize'
  | 'subscript'
  | 'superscript'
  | 'lineHeight'
  | 'indent'
  | 'outdent'
  | 'textDirection'
  | 'rtl'
  | 'ltr'
  | 'undo'
  | 'redo'
  | '|';

export interface InsertTableOptions {
  rows?: number;
  cols?: number;
  withHeaderRow?: boolean;
}

export interface CodeBlockOptions {
  language?: string;
}

export interface CodeLanguage {
  id: string;
  name: string;
  alias?: string[];
}

export type ToolbarConfig = (ToolbarItemName | string)[];

export interface EditorEventPayloads {
  update: { editor: any; transaction: any };
  focus: { editor: any; event: FocusEvent };
  blur: { editor: any; event: FocusEvent };
  selectionUpdate: { editor: any; transaction: any };
  transaction: { editor: any; transaction: any };
  imageUpload: { file: File; editor: any };
  fileUpload: { file: File; editor: any };
  mention: { user: MentionUser; editor?: any };
  slashCommand: { item: SlashCommandItem };
  'autosave:status': { status: AutosaveStatus; lastSavedTime: Date | null; formattedTime?: string };
  'autosave:saved': { draft: DraftData; manual: boolean };
  'autosave:error': { error: any };
  'autosave:restored': { draft: DraftData };
  'autosave:draft-detected': { draft: DraftData };
  'statistics:update': EditorStatistics;
  'limit:warning': LimitEventPayload;
  'limit:exceeded': LimitEventPayload;
  'theme:change': EditorTheme;
  destroy: void;
}

export type EditorEventName = keyof EditorEventPayloads;

export interface EditorOptions {
  element?: HTMLElement | string | null;
  content?: Content;
  editable?: boolean;
  autofocus?: FocusPosition;
  extensions?: (Extension | Mark | Node | any)[];
  placeholder?: string;
  toolbar?: boolean | ToolbarConfig;
  enableToolbar?: boolean | ToolbarConfig;
  bubbleMenu?: boolean | (ToolbarItemName | string)[];
  enableBubbleMenu?: boolean | (ToolbarItemName | string)[];
  uploader?: UploaderOptions | UploaderInterface;
  sanitizer?: SanitizerConfig;
  slashCommands?: boolean | SlashCommandsConfig;
  enableSlashCommands?: boolean | SlashCommandsConfig;
  mentions?: boolean | MentionConfig;
  enableMentions?: boolean | MentionConfig;
  autosave?: boolean | AutosaveConfig;
  statistics?: boolean | StatisticsConfig;
  wordCounter?: boolean | StatisticsConfig;
  theme?: string | EditorTheme;
  customTokens?: Partial<EditorThemeTokens>;
  accessibility?: boolean | AccessibilityConfig;
  mobile?: boolean | MobileConfig;
  onUpdate?: (props: { editor: any; transaction: any }) => void;
  onFocus?: (props: { editor: any; event: FocusEvent }) => void;
  onBlur?: (props: { editor: any; event: FocusEvent }) => void;
  onSelectionUpdate?: (props: { editor: any; transaction: any }) => void;
  onTransaction?: (props: { editor: any; transaction: any }) => void;
  onDestroy?: () => void;
}

export interface UniversalEditorInterface {
  getHTML(): string;
  getSanitizedHTML(config?: SanitizerConfig): string;
  getJSON(): Record<string, any>;
  getText(): string;
  setContent(content: Content, emitUpdate?: boolean): void;
  clearContent(emitUpdate?: boolean): void;
  focus(position?: FocusPosition): void;
  blur(): void;
  undo(): boolean;
  redo(): boolean;
  getWordCount(): number;
  getCharacterCount(excludeSpaces?: boolean): number;
  getParagraphCount(): number;
  getStatistics(): EditorStatistics;
  setLimits(limits: StatisticsConfig): void;
  destroy(): void;
  on(event: string, callback: Function): any;
  off(event: string, callback: Function): any;
  emit(event: string, ...args: any[]): boolean;
  readonly isEditable: boolean;
  setEditable(editable: boolean): void;
  readonly isDestroyed: boolean;
  readonly tiptap: TiptapEditor;

  // Phase 2 Rich Text Formatting API
  toggleBold(): boolean;
  toggleItalic(): boolean;
  toggleUnderline(): boolean;
  toggleStrike(): boolean;
  toggleCode(): boolean;
  setParagraph(): boolean;
  toggleHeading(level: HeadingLevel): boolean;
  toggleBulletList(): boolean;
  toggleOrderedList(): boolean;
  toggleTaskList(): boolean;
  setTextAlign(alignment: TextAlignment): boolean;
  toggleBlockquote(): boolean;
  setHorizontalRule(): boolean;
  clearFormatting(): boolean;
  setLink(attributes: LinkAttributes): boolean;
  unsetLink(): boolean;
  getLinkAttributes(): Record<string, any>;
  isActive(name: string, attributes?: Record<string, any>): boolean;

  // Phase 4 Media & File Management API
  readonly uploader: UploaderInterface;
  setUploader(uploader: UploaderInterface): void;
  insertImage(options: ImageAttributes): boolean;
  uploadAndInsertImage(file: File): Promise<string>;
  insertFile(options: FileAttachmentAttributes): boolean;
  uploadAndInsertFile(file: File): Promise<any>;

  // Phase 7 Advanced Formatting API
  setColor(color: string): boolean;
  unsetColor(): boolean;
  setHighlight(color?: string): boolean;
  toggleHighlight(attributes?: { color?: string }): boolean;
  unsetHighlight(): boolean;
  setFontSize(size: string): boolean;
  unsetFontSize(): boolean;
  setFontFamily(font: string): boolean;
  unsetFontFamily(): boolean;
  toggleSubscript(): boolean;
  toggleSuperscript(): boolean;
  setLineHeight(lineHeight: string): boolean;
  unsetLineHeight(): boolean;
  indent(): boolean;
  outdent(): boolean;
  setTextDirection(direction: 'ltr' | 'rtl' | 'auto'): boolean;
  setRtl(): boolean;
  setLtr(): boolean;
  toggleTextDirection(): boolean;

  // Phase 8 Tables API
  insertTable(options?: InsertTableOptions): boolean;
  addColumnBefore(): boolean;
  addColumnAfter(): boolean;
  deleteColumn(): boolean;
  addRowBefore(): boolean;
  addRowAfter(): boolean;
  deleteRow(): boolean;
  deleteTable(): boolean;
  mergeCells(): boolean;
  splitCell(): boolean;
  toggleHeaderColumn(): boolean;
  toggleHeaderRow(): boolean;
  toggleHeaderCell(): boolean;
  mergeOrSplit(): boolean;
  setCellAttribute(name: string, value: any): boolean;
  fixTables(): boolean;
  isTableActive(): boolean;

  // Phase 9 Code Block & Developer Features
  toggleCodeBlock(options?: CodeBlockOptions): boolean;
  setCodeBlock(options?: CodeBlockOptions): boolean;
  isCodeBlockActive(options?: CodeBlockOptions): boolean;
  getCodeBlockLanguage(): string | null;
  setCodeBlockLanguage(language: string): boolean;

  // Phase 10 Embeds API
  insertEmbed(options: {
    url: string;
    width?: string;
    height?: string;
    alignment?: 'left' | 'center' | 'right';
    title?: string;
  }): boolean;
  detectEmbed(url: string): any;

  // Phase 11 Slash Commands & Quick Actions API
  getSlashCommands(): SlashCommandItem[];
  registerSlashCommand(item: SlashCommandItem): void;
  openImageDialog(): void;
  openFileDialog(): void;
  openEmbedDialog(): void;

  // Phase 12 Mentions API
  insertMention(user: MentionUser): boolean;
  getMentions(): MentionUser[];

  // Phase 13 Autosave & Draft System API
  readonly autosaveManager?: AutosaveManager;
  saveDraft(manual?: boolean): Promise<boolean>;
  restoreDraft(draft?: DraftData): boolean;
  getDraft(): DraftData | null;
  clearDraft(): boolean;
  getAutosaveStatus(): AutosaveStatus;
  getLastSavedTime(): Date | null;
  hasDraft(): boolean;

  // Phase 22 Theming Engine API
  readonly themeManager?: ThemeManager;
  setTheme(theme: string | EditorTheme): EditorTheme;
  getTheme(): EditorTheme;
  getThemes(): EditorTheme[];
  setCustomTokens(tokens: Partial<EditorThemeTokens>): void;
}
