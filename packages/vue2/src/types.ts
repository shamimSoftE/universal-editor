import type {
  UniversalEditor,
  EditorStatistics,
  StatisticsConfig,
  AutosaveConfig,
  UploaderOptions,
  UploaderInterface,
  SlashCommandsConfig,
  MentionConfig,
  SanitizerConfig,
} from '@universal-editor/core';

export interface Vue2EditorProps {
  value?: string | Record<string, any>;
  modelValue?: string | Record<string, any>;
  readonly?: boolean;
  placeholder?: string;
  autofocus?: boolean | 'start' | 'end' | 'all' | number;
  toolbar?: boolean | string[];
  bubbleMenu?: boolean | string[];
  outputFormat?: 'html' | 'json' | 'text';
  minHeight?: string;
  maxHeight?: string;
  darkMode?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  slashCommands?: boolean | SlashCommandsConfig;
  mentions?: boolean | MentionConfig;
  autosave?: boolean | AutosaveConfig;
  wordLimit?: number;
  characterLimit?: number;
  hardLimit?: boolean;
  showWordCount?: boolean;
  showCharacterCount?: boolean;
  showCharactersNoSpaces?: boolean;
  showParagraphCount?: boolean;
  showReadingTime?: boolean;
  uploader?: UploaderOptions | UploaderInterface;
}

export interface Vue2ViewerProps {
  content: string | Record<string, any>;
  darkMode?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  sanitize?: boolean;
  sanitizerConfig?: SanitizerConfig;
  enableCopyCode?: boolean;
  enableImageLightbox?: boolean;
  responsiveEmbeds?: boolean;
  printOptimized?: boolean;
  wrapperClass?: string;
}

export interface Vue2EditorInstance {
  editor: UniversalEditor | null;
  getHTML(): string;
  getJSON(): Record<string, any>;
  getText(): string;
  getSanitizedHTML(): string;
  setContent(content: string | Record<string, any>, emitUpdate?: boolean): void;
  clearContent(emitUpdate?: boolean): void;
  focus(position?: 'start' | 'end' | 'all' | number): void;
  blur(): void;
  undo(): boolean;
  redo(): boolean;
  setEditable(editable: boolean): void;
  insertImage(attrs: Record<string, any>): void;
  insertFile(attrs: Record<string, any>): void;
  insertEmbed(attrs: Record<string, any>): void;
  insertMention(user: Record<string, any>): void;
  saveDraft(force?: boolean): void;
  restoreDraft(): boolean;
  clearDraft(): void;
  getWordCount(): number;
  getCharacterCount(excludeSpaces?: boolean): number;
  getParagraphCount(): number;
  getStatistics(): EditorStatistics;
  setLimits(limits: Partial<StatisticsConfig>): void;
  getEditorInstance(): UniversalEditor | null;
}
