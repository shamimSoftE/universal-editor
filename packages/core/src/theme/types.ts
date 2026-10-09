/**
 * Theming & Customization Types (Phase 22)
 *
 * Comprehensive design token definitions and theming contracts for
 * Universal Rich Text Editor.
 */

export type ThemeMode = 'light' | 'dark';

export interface EditorThemeTokens {
  /** Background color for the editor surface */
  editorBg: string;
  /** Primary text color */
  editorText: string;
  /** Border color around the editor and components */
  editorBorder: string;
  /** Toolbar background color */
  editorToolbarBg: string;
  /** Height of the toolbar */
  editorToolbarHeight: string;
  /** Hover state background for buttons */
  editorButtonHover: string;
  /** Active state background for buttons */
  editorButtonActive: string;
  /** Placeholder text color */
  editorPlaceholder: string;
  /** Border radius for editor container, cards, and buttons */
  editorRadius: string;
  /** Primary typography font family */
  editorFontFamily: string;
  /** Base typography font size */
  editorFontSize: string;
  /** Size of toolbar icon buttons */
  editorButtonSize: string;
  /** Brand active / selection accent color */
  editorActiveColor: string;
  /** Secondary accent / badge color */
  editorAccentColor: string;
  /** Editor surface shadow */
  editorShadow?: string;
  /** Color of table borders and headers */
  editorTableBorder?: string;
  /** Background for code blocks */
  editorCodeBg?: string;
}

export interface EditorTheme {
  id: string;
  name: string;
  mode: ThemeMode;
  tokens: Partial<EditorThemeTokens>;
  description?: string;
}

export interface ThemeManagerOptions {
  defaultTheme?: string;
  themes?: EditorTheme[];
  targetElement?: HTMLElement | null;
  persistKey?: string;
}
