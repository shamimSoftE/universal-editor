import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  ThemeManager,
  tokenToCssVariable,
  generateCSSVariables,
  darkTheme,
  lightTheme,
  sepiaTheme,
  cyberpunkTheme,
  minimalTheme,
  highContrastTheme,
  DEFAULT_THEMES,
  createEditor,
  UniversalEditor,
} from '@universal-editor/core';
import { ThemeSwitcher, RichTextEditor } from '@universal-editor/vue3';

describe('Phase 22: Theming Engine & Customization', () => {
  describe('1. Theme Presets and CSS Variable Converters', () => {
    it('provides all 6 standard theme presets in DEFAULT_THEMES', () => {
      expect(DEFAULT_THEMES).toHaveLength(6);
      const themeIds = DEFAULT_THEMES.map((t) => t.id);
      expect(themeIds).toContain('dark');
      expect(themeIds).toContain('light');
      expect(themeIds).toContain('sepia');
      expect(themeIds).toContain('cyberpunk');
      expect(themeIds).toContain('minimal');
      expect(themeIds).toContain('high-contrast');
    });

    it('verifies standard token definitions for darkTheme and lightTheme', () => {
      expect(darkTheme.mode).toBe('dark');
      expect(darkTheme.tokens.editorBg).toBe('#0f172a');
      expect(darkTheme.tokens.editorText).toBe('#f8fafc');
      expect(darkTheme.tokens.editorBorder).toBe('rgba(255, 255, 255, 0.12)');
      expect(darkTheme.tokens.editorToolbarHeight).toBe('44px');
      expect(darkTheme.tokens.editorRadius).toBe('10px');
      expect(darkTheme.tokens.editorActiveColor).toBe('#818cf8');

      expect(lightTheme.mode).toBe('light');
      expect(lightTheme.tokens.editorBg).toBe('#ffffff');
      expect(lightTheme.tokens.editorText).toBe('#0f172a');
      expect(lightTheme.tokens.editorBorder).toBe('#e2e8f0');
    });

    it('verifies sepiaTheme, cyberpunkTheme, minimalTheme, highContrastTheme tokens', () => {
      expect(sepiaTheme.mode).toBe('light');
      expect(sepiaTheme.tokens.editorBg).toBe('#fbf0d9');
      expect(sepiaTheme.tokens.editorText).toBe('#433422');

      expect(cyberpunkTheme.mode).toBe('dark');
      expect(cyberpunkTheme.tokens.editorBg).toBe('#090a0f');
      expect(cyberpunkTheme.tokens.editorActiveColor).toBe('#ff0055');
      expect(cyberpunkTheme.tokens.editorAccentColor).toBe('#ffe600');

      expect(minimalTheme.mode).toBe('light');
      expect(minimalTheme.tokens.editorBg).toBe('#fafafa');
      expect(minimalTheme.tokens.editorRadius).toBe('6px');

      expect(highContrastTheme.mode).toBe('dark');
      expect(highContrastTheme.tokens.editorBg).toBe('#000000');
      expect(highContrastTheme.tokens.editorText).toBe('#ffffff');
      expect(highContrastTheme.tokens.editorActiveColor).toBe('#ffff00');
    });

    it('converts camelCase token names to kebab-case CSS variables', () => {
      expect(tokenToCssVariable('editorBg')).toBe('--editor-bg');
      expect(tokenToCssVariable('editorText')).toBe('--editor-text');
      expect(tokenToCssVariable('editorToolbarBg')).toBe('--editor-toolbar-bg');
      expect(tokenToCssVariable('editorToolbarHeight')).toBe('--editor-toolbar-height');
      expect(tokenToCssVariable('editorButtonHover')).toBe('--editor-button-hover');
      expect(tokenToCssVariable('editorRadius')).toBe('--editor-radius');
      expect(tokenToCssVariable('editorFontFamily')).toBe('--editor-font-family');
      expect(tokenToCssVariable('editorFontSize')).toBe('--editor-font-size');
      expect(tokenToCssVariable('editorButtonSize')).toBe('--editor-button-size');
    });

    it('generates a full dictionary of CSS variables from tokens', () => {
      const vars = generateCSSVariables({
        editorBg: '#123456',
        editorText: '#ffffff',
        editorRadius: '12px',
      });
      expect(vars['--editor-bg']).toBe('#123456');
      expect(vars['--editor-text']).toBe('#ffffff');
      expect(vars['--editor-radius']).toBe('12px');
    });
  });

  describe('2. ThemeManager Unit Tests', () => {
    let container: HTMLElement;
    let themeManager: ThemeManager;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      themeManager = new ThemeManager({ targetElement: container });
    });

    it('initializes with default dark theme and applies CSS variables to container', () => {
      expect(themeManager.getTheme().id).toBe('dark');
      expect(container.style.getPropertyValue('--editor-bg')).toBe('#0f172a');
      expect(container.style.getPropertyValue('--editor-text')).toBe('#f8fafc');
      expect(container.getAttribute('data-editor-theme')).toBe('dark');
      expect(container.getAttribute('data-editor-mode')).toBe('dark');
    });

    it('applies a preset theme by ID (e.g. sepia)', () => {
      const applied = themeManager.applyTheme('sepia');
      expect(applied.id).toBe('sepia');
      expect(themeManager.getTheme().id).toBe('sepia');
      expect(container.style.getPropertyValue('--editor-bg')).toBe('#fbf0d9');
      expect(container.style.getPropertyValue('--editor-text')).toBe('#433422');
      expect(container.getAttribute('data-editor-theme')).toBe('sepia');
      expect(container.getAttribute('data-editor-mode')).toBe('light');
    });

    it('applies cyberpunk theme with vibrant accent colors', () => {
      themeManager.applyTheme('cyberpunk');
      expect(container.style.getPropertyValue('--editor-bg')).toBe('#090a0f');
      expect(container.style.getPropertyValue('--editor-active-color')).toBe('#ff0055');
      expect(container.style.getPropertyValue('--editor-accent-color')).toBe('#ffe600');
    });

    it('allows registering and unregistering custom themes', () => {
      themeManager.registerTheme({
        id: 'forest',
        name: 'Forest Emerald',
        mode: 'dark',
        tokens: {
          editorBg: '#064e3b',
          editorText: '#ecfdf5',
          editorActiveColor: '#10b981',
        },
      });

      expect(themeManager.getTheme('forest').id).toBe('forest');
      themeManager.applyTheme('forest');
      expect(container.style.getPropertyValue('--editor-bg')).toBe('#064e3b');

      // Unregister custom theme
      const unregistered = themeManager.unregisterTheme('forest');
      expect(unregistered).toBe(true);

      // Core fallbacks cannot be unregistered
      expect(themeManager.unregisterTheme('dark')).toBe(false);
      expect(themeManager.unregisterTheme('light')).toBe(false);
    });

    it('supports custom token overrides on top of active theme', () => {
      themeManager.applyTheme('dark');
      themeManager.setCustomTokens({
        editorRadius: '24px',
        editorFontSize: '18px',
      });

      expect(container.style.getPropertyValue('--editor-radius')).toBe('24px');
      expect(container.style.getPropertyValue('--editor-font-size')).toBe('18px');
      // Original tokens still preserved
      expect(container.style.getPropertyValue('--editor-bg')).toBe('#0f172a');

      // Reset custom tokens
      themeManager.resetCustomTokens();
      expect(container.style.getPropertyValue('--editor-radius')).toBe('10px');
    });

    it('creates custom themes via createCustomTheme()', () => {
      const custom = themeManager.createCustomTheme(
        'oceanic',
        'Oceanic Blue',
        'dark',
        {
          editorBg: '#0f172a',
          editorActiveColor: '#38bdf8',
        },
        'A calm oceanic deep theme'
      );

      expect(custom.id).toBe('oceanic');
      expect(custom.tokens.editorActiveColor).toBe('#38bdf8');
      expect(themeManager.getTheme('oceanic').name).toBe('Oceanic Blue');
    });

    it('emits theme change events to subscribers', () => {
      const callback = vi.fn();
      const unsubscribe = themeManager.onThemeChange(callback);

      themeManager.applyTheme('high-contrast');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'high-contrast' }));

      unsubscribe();
      themeManager.applyTheme('light');
      expect(callback).toHaveBeenCalledTimes(1); // Not called again after unsubscribing
    });

    it('supports localStorage persistence when persistKey is configured', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const manager = new ThemeManager({
        targetElement: container,
        persistKey: 'test-editor-theme',
      });

      manager.applyTheme('cyberpunk');
      expect(setItemSpy).toHaveBeenCalledWith('test-editor-theme', 'cyberpunk');
      setItemSpy.mockRestore();
    });
  });

  describe('3. UniversalEditor Theme Integration', () => {
    let editorContainer: HTMLElement;
    let editor: UniversalEditor;

    beforeEach(() => {
      editorContainer = document.createElement('div');
      document.body.appendChild(editorContainer);
      editor = createEditor({
        element: editorContainer,
        theme: 'sepia',
      });
    });

    it('initializes editor with specified theme prop', () => {
      expect(editor.getTheme().id).toBe('sepia');
      expect(editor.themeManager).toBeDefined();
      expect(editor.getThemes()).toHaveLength(6);
    });

    it('switches themes dynamically via editor.setTheme()', () => {
      const changed = editor.setTheme('cyberpunk');
      expect(changed.id).toBe('cyberpunk');
      expect(editor.getTheme().id).toBe('cyberpunk');
    });

    it('emits theme:change event on UniversalEditor instance', () => {
      const listener = vi.fn();
      editor.on('theme:change', listener);

      editor.setTheme('minimal');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'minimal' }));
    });

    it('sets custom tokens via editor.setCustomTokens()', () => {
      editor.setCustomTokens({
        editorToolbarHeight: '56px',
      });
      expect(editorContainer.style.getPropertyValue('--editor-toolbar-height')).toBe('56px');
    });

    it('cleans up ThemeManager on destroy', () => {
      const destroySpy = vi.spyOn(editor.themeManager!, 'destroy');
      editor.destroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('4. ThemeSwitcher.vue Component', () => {
    it('renders dropdown trigger with active theme name and swatch', () => {
      const wrapper = mount(ThemeSwitcher, {
        props: {
          modelValue: 'dark',
        },
      });

      expect(wrapper.find('.ue-theme-trigger-label').text()).toBe('Dark Enterprise');
      expect(wrapper.find('.ue-theme-swatch').exists()).toBe(true);
    });

    it('opens dropdown menu on click and lists all 6 preset themes', async () => {
      const wrapper = mount(ThemeSwitcher, {
        props: {
          modelValue: 'dark',
        },
      });

      await wrapper.find('.ue-theme-trigger').trigger('click');
      expect(wrapper.find('.ue-theme-menu').exists()).toBe(true);

      const items = wrapper.findAll('.ue-theme-item');
      expect(items).toHaveLength(6);
      expect(wrapper.text()).toContain('Warm Sepia');
      expect(wrapper.text()).toContain('Cyberpunk Neon');
      expect(wrapper.text()).toContain('High Contrast');
    });

    it('emits update:modelValue and select on choosing a theme', async () => {
      const wrapper = mount(ThemeSwitcher, {
        props: {
          modelValue: 'dark',
        },
      });

      await wrapper.find('.ue-theme-trigger').trigger('click');
      const sepiaBtn = wrapper.findAll('.ue-theme-item').find((btn) => btn.text().includes('Sepia'));
      expect(sepiaBtn).toBeDefined();

      await sepiaBtn!.trigger('click');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['sepia']);
      expect(wrapper.emitted('select')).toBeTruthy();
      expect((wrapper.emitted('select')![0][0] as any).id).toBe('sepia');
    });

    it('supports pills layout mode', () => {
      const wrapper = mount(ThemeSwitcher, {
        props: {
          modelValue: 'cyberpunk',
          layout: 'pills',
        },
      });

      expect(wrapper.find('.ue-theme-pills').exists()).toBe(true);
      const pills = wrapper.findAll('.ue-theme-pill');
      expect(pills).toHaveLength(6);

      const activePill = wrapper.find('.ue-theme-pill.is-active');
      expect(activePill.text()).toContain('Cyberpunk Neon');
    });

    it('toggles mode between dark and light with toggle button', async () => {
      const wrapper = mount(ThemeSwitcher, {
        props: {
          modelValue: 'dark',
          showModeToggle: true,
        },
      });

      const modeBtn = wrapper.find('.ue-theme-mode-btn');
      expect(modeBtn.exists()).toBe(true);

      await modeBtn.trigger('click');
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['light']);
    });
  });

  describe('5. RichTextEditor.vue Theming Integration', () => {
    it('accepts theme prop and passes to internal themeManager', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          theme: 'sepia',
        },
      });

      expect(wrapper.find('.ue-editor-card').exists()).toBe(true);
      const exposed = wrapper.vm as any;
      expect(exposed.getTheme().id).toBe('sepia');
      expect(exposed.getThemes()).toHaveLength(6);
    });

    it('exposes setTheme, getTheme, getThemes, setCustomTokens methods', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          theme: 'dark',
        },
      });

      const exposed = wrapper.vm as any;
      expect(typeof exposed.setTheme).toBe('function');
      expect(typeof exposed.getTheme).toBe('function');
      expect(typeof exposed.getThemes).toBe('function');
      expect(typeof exposed.setCustomTokens).toBe('function');

      exposed.setTheme('cyberpunk');
      expect(exposed.getTheme().id).toBe('cyberpunk');
    });

    it('applies custom tokens dynamically', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          theme: 'dark',
          customTokens: {
            editorRadius: '16px',
          },
        },
      });

      const exposed = wrapper.vm as any;
      exposed.setCustomTokens({ editorButtonSize: '40px' });
      const rootCard = wrapper.find('.ue-editor-card').element as HTMLElement;
      expect(rootCard.style.getPropertyValue('--editor-button-size')).toBe('40px');
    });
  });
});
