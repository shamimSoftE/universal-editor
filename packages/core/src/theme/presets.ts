import { EditorTheme } from './types';

/**
 * Modern Dark Theme (Default)
 */
export const darkTheme: EditorTheme = {
  id: 'dark',
  name: 'Dark Enterprise',
  mode: 'dark',
  description: 'Deep navy enterprise dark mode with subtle glowing accents',
  tokens: {
    editorBg: '#0f172a',
    editorText: '#f8fafc',
    editorBorder: 'rgba(255, 255, 255, 0.12)',
    editorToolbarBg: '#1e293b',
    editorToolbarHeight: '44px',
    editorButtonHover: 'rgba(255, 255, 255, 0.08)',
    editorButtonActive: 'rgba(99, 102, 241, 0.25)',
    editorPlaceholder: '#64748b',
    editorRadius: '10px',
    editorFontFamily: 'var(--font-sans, "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif)',
    editorFontSize: '15px',
    editorButtonSize: '32px',
    editorActiveColor: '#818cf8',
    editorAccentColor: '#a855f7',
    editorShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    editorTableBorder: 'rgba(255, 255, 255, 0.15)',
    editorCodeBg: '#020617',
  },
};

/**
 * Modern Clean Light Theme
 */
export const lightTheme: EditorTheme = {
  id: 'light',
  name: 'Clean Light',
  mode: 'light',
  description: 'Ultra-crisp light theme with high legibility and soft gray boundaries',
  tokens: {
    editorBg: '#ffffff',
    editorText: '#0f172a',
    editorBorder: '#e2e8f0',
    editorToolbarBg: '#f8fafc',
    editorToolbarHeight: '44px',
    editorButtonHover: '#f1f5f9',
    editorButtonActive: '#e0e7ff',
    editorPlaceholder: '#94a3b8',
    editorRadius: '10px',
    editorFontFamily: 'var(--font-sans, "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif)',
    editorFontSize: '15px',
    editorButtonSize: '32px',
    editorActiveColor: '#4f46e5',
    editorAccentColor: '#7c3aed',
    editorShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    editorTableBorder: '#cbd5e1',
    editorCodeBg: '#f1f5f9',
  },
};

/**
 * Warm Sepia / Editorial Theme
 */
export const sepiaTheme: EditorTheme = {
  id: 'sepia',
  name: 'Warm Sepia',
  mode: 'light',
  description: 'Warm parchment tones tailored for distraction-free novel and long-form writing',
  tokens: {
    editorBg: '#fbf0d9',
    editorText: '#433422',
    editorBorder: '#e6d5b8',
    editorToolbarBg: '#f4e5c8',
    editorToolbarHeight: '46px',
    editorButtonHover: '#ecd8b5',
    editorButtonActive: '#dec59b',
    editorPlaceholder: '#9c8b74',
    editorRadius: '8px',
    editorFontFamily: 'Georgia, Cambria, "Times New Roman", serif',
    editorFontSize: '16px',
    editorButtonSize: '34px',
    editorActiveColor: '#b45309',
    editorAccentColor: '#d97706',
    editorShadow: '0 6px 12px rgba(67, 52, 34, 0.08)',
    editorTableBorder: '#d6c4a5',
    editorCodeBg: '#efe2c5',
  },
};

/**
 * Cyberpunk / Synthwave Theme
 */
export const cyberpunkTheme: EditorTheme = {
  id: 'cyberpunk',
  name: 'Cyberpunk Neon',
  mode: 'dark',
  description: 'High-energy futuristic synthwave dark mode with cyan and neon pink glows',
  tokens: {
    editorBg: '#090a0f',
    editorText: '#00f0ff',
    editorBorder: 'rgba(0, 240, 255, 0.3)',
    editorToolbarBg: '#12131c',
    editorToolbarHeight: '48px',
    editorButtonHover: 'rgba(0, 240, 255, 0.15)',
    editorButtonActive: 'rgba(255, 0, 85, 0.35)',
    editorPlaceholder: '#007a82',
    editorRadius: '4px',
    editorFontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
    editorFontSize: '14px',
    editorButtonSize: '34px',
    editorActiveColor: '#ff0055',
    editorAccentColor: '#ffe600',
    editorShadow: '0 0 20px rgba(0, 240, 255, 0.15), 0 0 40px rgba(255, 0, 85, 0.1)',
    editorTableBorder: 'rgba(0, 240, 255, 0.35)',
    editorCodeBg: '#030407',
  },
};

/**
 * Minimal Monochromatic Theme
 */
export const minimalTheme: EditorTheme = {
  id: 'minimal',
  name: 'Nordic Minimal',
  mode: 'light',
  description: 'Pure, distraction-free Scandinavian minimalism with subtle micro-borders',
  tokens: {
    editorBg: '#fafafa',
    editorText: '#18181b',
    editorBorder: '#f4f4f5',
    editorToolbarBg: '#ffffff',
    editorToolbarHeight: '40px',
    editorButtonHover: '#f4f4f5',
    editorButtonActive: '#e4e4e7',
    editorPlaceholder: '#a1a1aa',
    editorRadius: '6px',
    editorFontFamily: 'system-ui, -apple-system, sans-serif',
    editorFontSize: '15px',
    editorButtonSize: '30px',
    editorActiveColor: '#18181b',
    editorAccentColor: '#71717a',
    editorShadow: 'none',
    editorTableBorder: '#e4e4e7',
    editorCodeBg: '#f4f4f5',
  },
};

/**
 * High Contrast Accessibility Theme (WCAG AAA)
 */
export const highContrastTheme: EditorTheme = {
  id: 'high-contrast',
  name: 'High Contrast (WCAG AAA)',
  mode: 'dark',
  description: 'Pure black surface with brilliant yellow focus states for maximum visual accessibility',
  tokens: {
    editorBg: '#000000',
    editorText: '#ffffff',
    editorBorder: '#ffffff',
    editorToolbarBg: '#000000',
    editorToolbarHeight: '48px',
    editorButtonHover: '#262626',
    editorButtonActive: '#ffff00',
    editorPlaceholder: '#a3a3a3',
    editorRadius: '0px',
    editorFontFamily: 'sans-serif',
    editorFontSize: '16px',
    editorButtonSize: '36px',
    editorActiveColor: '#ffff00',
    editorAccentColor: '#00ffff',
    editorShadow: 'none',
    editorTableBorder: '#ffffff',
    editorCodeBg: '#171717',
  },
};

export const DEFAULT_THEMES: EditorTheme[] = [
  darkTheme,
  lightTheme,
  sepiaTheme,
  cyberpunkTheme,
  minimalTheme,
  highContrastTheme,
];
