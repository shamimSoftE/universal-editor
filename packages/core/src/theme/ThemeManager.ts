import {
  EditorTheme,
  EditorThemeTokens,
  ThemeManagerOptions,
} from './types';
import { DEFAULT_THEMES, darkTheme, lightTheme } from './presets';

/**
 * Convert camelCase token name to kebab-case CSS variable name.
 */
export function tokenToCssVariable(tokenKey: string): string {
  const kebab = tokenKey.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `--${kebab}`;
}

/**
 * Generate a key-value dictionary of CSS variables from theme tokens.
 */
export function generateCSSVariables(
  tokens: Partial<EditorThemeTokens>
): Record<string, string> {
  const cssVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value !== undefined && value !== null && value !== '') {
      cssVars[tokenToCssVariable(key)] = String(value);
    }
  }
  return cssVars;
}

/**
 * ThemeManager
 *
 * Central engine responsible for managing theme registration, token resolution,
 * applying dynamic CSS variables, and listening for theme changes.
 */
export class ThemeManager {
  protected themes: Map<string, EditorTheme> = new Map();
  protected currentTheme: EditorTheme;
  protected targetElement: HTMLElement | null = null;
  protected persistKey?: string;
  protected listeners: Set<(theme: EditorTheme) => void> = new Set();
  protected customOverrides: Partial<EditorThemeTokens> = {};

  constructor(options: ThemeManagerOptions = {}) {
    // Register default presets
    for (const theme of DEFAULT_THEMES) {
      this.themes.set(theme.id, theme);
    }

    // Register any custom themes supplied via options
    if (options.themes) {
      for (const theme of options.themes) {
        this.themes.set(theme.id, theme);
      }
    }

    this.persistKey = options.persistKey;
    this.targetElement = options.targetElement || null;

    // Resolve initial theme (from storage or option)
    let initialThemeId = options.defaultTheme || 'dark';
    if (this.persistKey && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.persistKey);
        if (saved && this.themes.has(saved)) {
          initialThemeId = saved;
        }
      } catch {
        // Storage access might fail in sandboxed iframes
      }
    }

    this.currentTheme = this.themes.get(initialThemeId) || darkTheme;
    if (this.targetElement) {
      this.applyTheme(this.currentTheme, this.targetElement);
    }
  }

  /**
   * Set target HTML element on which CSS variables should be applied.
   */
  public setTargetElement(element: HTMLElement | null): void {
    this.targetElement = element;
    if (element) {
      this.applyTheme(this.currentTheme, element);
    }
  }

  /**
   * Register a new or custom theme.
   */
  public registerTheme(theme: EditorTheme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Remove a registered theme by ID.
   */
  public unregisterTheme(id: string): boolean {
    if (id === 'dark' || id === 'light') {
      return false; // Prevent removing core fallbacks
    }
    return this.themes.delete(id);
  }

  /**
   * Retrieve a theme by its identifier.
   */
  public getTheme(id?: string): EditorTheme {
    if (!id) return this.currentTheme;
    return this.themes.get(id) || this.currentTheme;
  }

  /**
   * Retrieve list of all available themes.
   */
  public getThemes(): EditorTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Apply a theme by ID or direct theme object.
   */
  public applyTheme(
    themeOrId: string | EditorTheme,
    target?: HTMLElement | null
  ): EditorTheme {
    let resolvedTheme: EditorTheme;

    if (typeof themeOrId === 'string') {
      const found = this.themes.get(themeOrId);
      if (!found) {
        console.warn(`[ThemeManager] Theme '${themeOrId}' not found. Falling back to default.`);
        resolvedTheme = this.currentTheme || darkTheme;
      } else {
        resolvedTheme = found;
      }
    } else {
      resolvedTheme = themeOrId;
      this.themes.set(resolvedTheme.id, resolvedTheme);
    }

    this.currentTheme = resolvedTheme;

    const el = target !== undefined ? target : this.targetElement;
    if (el) {
      const mergedTokens: Partial<EditorThemeTokens> = {
        ...resolvedTheme.tokens,
        ...this.customOverrides,
      };

      const cssVars = generateCSSVariables(mergedTokens);
      for (const [varName, varVal] of Object.entries(cssVars)) {
        el.style.setProperty(varName, varVal);
      }

      el.setAttribute('data-editor-theme', resolvedTheme.id);
      el.setAttribute('data-editor-mode', resolvedTheme.mode);
    }

    if (this.persistKey && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.persistKey, resolvedTheme.id);
      } catch {
        // Ignore storage exceptions
      }
    }

    this.notifyListeners(resolvedTheme);
    return resolvedTheme;
  }

  /**
   * Apply individual custom token overrides on top of the active theme.
   */
  public setCustomTokens(
    tokens: Partial<EditorThemeTokens>,
    target?: HTMLElement | null
  ): void {
    this.customOverrides = { ...this.customOverrides, ...tokens };
    this.applyTheme(this.currentTheme, target);
  }

  /**
   * Clear any custom token overrides.
   */
  public resetCustomTokens(target?: HTMLElement | null): void {
    this.customOverrides = {};
    this.applyTheme(this.currentTheme, target);
  }

  /**
   * Create and register a custom user-defined theme.
   */
  public createCustomTheme(
    id: string,
    name: string,
    mode: 'light' | 'dark',
    tokens: Partial<EditorThemeTokens>,
    description?: string
  ): EditorTheme {
    const baseTokens = mode === 'dark' ? darkTheme.tokens : lightTheme.tokens;
    const customTheme: EditorTheme = {
      id,
      name,
      mode,
      tokens: { ...baseTokens, ...tokens },
      description: description || `Custom user-defined ${mode} theme`,
    };

    this.registerTheme(customTheme);
    return customTheme;
  }

  /**
   * Listen for theme change events.
   */
  public onThemeChange(callback: (theme: EditorTheme) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Alias for onThemeChange.
   */
  public subscribe(callback: (theme: EditorTheme) => void): () => void {
    return this.onThemeChange(callback);
  }

  /**
   * Notify all subscribers of theme modification.
   */
  protected notifyListeners(theme: EditorTheme): void {
    for (const listener of this.listeners) {
      listener(theme);
    }
  }

  /**
   * Clean up listeners.
   */
  public destroy(): void {
    this.listeners.clear();
    this.customOverrides = {};
  }
}
