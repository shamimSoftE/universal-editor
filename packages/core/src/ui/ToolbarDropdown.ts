import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  action: (editor: UniversalEditor) => void;
  isActive?: (editor: UniversalEditor) => boolean;
}

export interface ToolbarDropdownOptions {
  name: string;
  title: string;
  defaultLabel: string;
  items: DropdownItem[];
  getActiveLabel?: (editor: UniversalEditor) => string | null;
}

export class ToolbarDropdown {
  public element: HTMLElement;
  private button: HTMLButtonElement;
  private labelSpan: HTMLSpanElement;
  private menu: HTMLElement;
  private editor: UniversalEditor;
  private options: ToolbarDropdownOptions;
  private itemElements: Map<string, HTMLButtonElement> = new Map();

  constructor(editor: UniversalEditor, options: ToolbarDropdownOptions) {
    this.editor = editor;
    this.options = options;

    this.element = document.createElement('div');
    this.element.className = `ue-dropdown ue-dropdown-${options.name}`;

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'ue-toolbar-btn ue-dropdown-btn';
    this.button.title = options.title;
    this.button.setAttribute('aria-label', options.title);
    this.button.setAttribute('aria-haspopup', 'true');
    this.button.setAttribute('aria-expanded', 'false');

    this.labelSpan = document.createElement('span');
    this.labelSpan.textContent = options.defaultLabel;

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.innerHTML = icons.chevronDown;

    this.button.appendChild(this.labelSpan);
    this.button.appendChild(chevron);

    this.menu = document.createElement('div');
    this.menu.className = 'ue-dropdown-menu';
    this.menu.setAttribute('role', 'menu');
    this.menu.setAttribute('aria-label', options.title);

    options.items.forEach(item => {
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = 'ue-dropdown-item';
      itemBtn.setAttribute('role', 'menuitem');
      if (item.icon) {
        itemBtn.innerHTML = `${item.icon} <span>${item.label}</span>`;
      } else {
        itemBtn.textContent = item.label;
      }

      itemBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        item.action(this.editor);
        this.close();
        this.updateState();
      });

      this.itemElements.set(item.id, itemBtn);
      this.menu.appendChild(itemBtn);
    });

    this.element.appendChild(this.button);
    this.element.appendChild(this.menu);

    this.button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Close when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
      if (!this.element.contains(e.target as Node)) {
        this.close();
      }
    });

    this.updateState();
  }

  public toggle(): void {
    if (this.element.classList.contains('is-open')) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    // Close other dropdowns
    document.querySelectorAll('.ue-dropdown.is-open').forEach(el => {
      if (el !== this.element) el.classList.remove('is-open');
    });
    this.element.classList.add('is-open');
    this.button.setAttribute('aria-expanded', 'true');
  }

  public close(): void {
    this.element.classList.remove('is-open');
    this.button.setAttribute('aria-expanded', 'false');
  }

  public updateState(): void {
    if (this.editor.isDestroyed) return;

    if (this.options.getActiveLabel) {
      const activeLabel = this.options.getActiveLabel(this.editor);
      this.labelSpan.textContent = activeLabel || this.options.defaultLabel;
    }

    this.options.items.forEach(item => {
      const el = this.itemElements.get(item.id);
      if (el && item.isActive) {
        el.classList.toggle('is-active', item.isActive(this.editor));
      }
    });
  }
}
