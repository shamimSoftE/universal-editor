import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export interface ColorPickerOptions {
  name: 'color' | 'highlight';
  title: string;
  defaultColor?: string;
  presetColors?: string[];
}

export const DEFAULT_PRESET_COLORS = [
  '#000000', '#1f2937', '#4b5563', '#9ca3af',
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#ffffff', 'transparent',
];

export class ColorPicker {
  public element: HTMLElement;
  private button: HTMLButtonElement;
  private menu: HTMLElement;
  private editor: UniversalEditor;
  private options: ColorPickerOptions;
  private colorIndicator: HTMLElement;

  constructor(editor: UniversalEditor, options: ColorPickerOptions) {
    this.editor = editor;
    this.options = {
      presetColors: DEFAULT_PRESET_COLORS,
      ...options,
    };

    this.element = document.createElement('div');
    this.element.className = `ue-dropdown ue-color-picker ue-dropdown-${options.name}`;

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'ue-toolbar-btn ue-color-btn';
    this.button.title = options.title;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'ue-btn-icon';
    iconSpan.innerHTML = options.name === 'highlight' ? icons.highlight : icons.color;

    this.colorIndicator = document.createElement('span');
    this.colorIndicator.className = 'ue-color-indicator';
    this.colorIndicator.style.backgroundColor =
      options.name === 'highlight' ? '#fef08a' : '#3b82f6';

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.innerHTML = icons.chevronDown;

    this.button.appendChild(iconSpan);
    this.button.appendChild(this.colorIndicator);
    this.button.appendChild(chevron);

    // Popup container
    this.menu = document.createElement('div');
    this.menu.className = 'ue-dropdown-menu ue-color-menu';

    this.renderMenu();

    this.element.appendChild(this.button);
    this.element.appendChild(this.menu);

    this.button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', (e: MouseEvent) => {
      if (!this.element.contains(e.target as Node)) {
        this.close();
      }
    });

    this.updateState();
  }

  private renderMenu(): void {
    this.menu.innerHTML = '';

    // 1. Swatches grid
    const grid = document.createElement('div');
    grid.className = 'ue-color-grid';

    (this.options.presetColors || DEFAULT_PRESET_COLORS).forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'ue-color-swatch';
      swatch.style.backgroundColor = color;
      swatch.title = color;

      swatch.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.applyColor(color);
        this.close();
      });

      grid.appendChild(swatch);
    });

    this.menu.appendChild(grid);

    // 2. Custom color input & clear action row
    const footer = document.createElement('div');
    footer.className = 'ue-color-footer';

    const customLabel = document.createElement('label');
    customLabel.className = 'ue-custom-color-label';
    customLabel.textContent = 'Custom:';

    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.className = 'ue-custom-color-input';
    customInput.value = '#3b82f6';

    customInput.addEventListener('input', e => {
      const val = (e.target as HTMLInputElement).value;
      this.applyColor(val);
    });

    customInput.addEventListener('change', () => {
      this.close();
    });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ue-color-clear-btn';
    clearBtn.textContent = 'Reset';

    clearBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.clearColor();
      this.close();
    });

    customLabel.appendChild(customInput);
    footer.appendChild(customLabel);
    footer.appendChild(clearBtn);

    this.menu.appendChild(footer);
  }

  private applyColor(color: string): void {
    if (this.options.name === 'highlight') {
      this.editor.setHighlight(color === 'transparent' ? undefined : color);
      this.colorIndicator.style.backgroundColor = color;
    } else {
      this.editor.setColor(color);
      this.colorIndicator.style.backgroundColor = color;
    }
  }

  private clearColor(): void {
    if (this.options.name === 'highlight') {
      this.editor.unsetHighlight();
      this.colorIndicator.style.backgroundColor = 'transparent';
    } else {
      this.editor.unsetColor();
      this.colorIndicator.style.backgroundColor = '#3b82f6';
    }
  }

  public toggle(): void {
    if (this.element.classList.contains('is-open')) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    document.querySelectorAll('.ue-dropdown.is-open').forEach(el => {
      if (el !== this.element) el.classList.remove('is-open');
    });
    this.element.classList.add('is-open');
  }

  public close(): void {
    this.element.classList.remove('is-open');
  }

  public updateState(): void {
    if (this.editor.isDestroyed) return;
    const attrs = this.editor.tiptap.getAttributes('textStyle');
    if (this.options.name === 'color') {
      const activeColor = attrs.color;
      this.colorIndicator.style.backgroundColor = activeColor || '#3b82f6';
      this.button.classList.toggle('is-active', !!activeColor);
    } else if (this.options.name === 'highlight') {
      const highlightAttrs = this.editor.tiptap.getAttributes('highlight');
      const activeHighlight = highlightAttrs.color;
      this.colorIndicator.style.backgroundColor = activeHighlight || '#fef08a';
      this.button.classList.toggle('is-active', this.editor.isActive('highlight'));
    }
  }
}
