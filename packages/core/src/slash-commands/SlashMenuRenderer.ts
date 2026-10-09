import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from './types';
import type { UniversalEditor } from '../UniversalEditor';

export class SlashMenuRenderer {
  public element: HTMLElement;
  private selectedIndex = 0;
  private items: SlashCommandItem[] = [];
  private commandCallback?: (item: SlashCommandItem) => void;
  private coreEditor?: UniversalEditor;
  private isVisible = false;

  constructor(coreEditor?: UniversalEditor) {
    this.coreEditor = coreEditor;
    this.element = document.createElement('div');
    this.element.className = 'ue-slash-menu';
    this.element.setAttribute('role', 'listbox');
    this.element.setAttribute('aria-label', 'Slash Commands');
    this.element.style.display = 'none';

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.element);
    }
  }

  public onStart(props: SuggestionProps<SlashCommandItem>): void {
    this.items = props.items || [];
    this.commandCallback = props.command;
    this.selectedIndex = 0;
    this.isVisible = true;

    this.render(props.query);
    this.updatePosition(props.clientRect);
  }

  public onUpdate(props: SuggestionProps<SlashCommandItem>): void {
    this.items = props.items || [];
    this.commandCallback = props.command;

    // Retain or reset selected index
    if (this.selectedIndex >= this.items.length) {
      this.selectedIndex = Math.max(0, this.items.length - 1);
    }

    this.render(props.query);
    this.updatePosition(props.clientRect);
  }

  public onKeyDown(props: SuggestionKeyDownProps): boolean {
    if (!this.isVisible || this.items.length === 0) {
      return false;
    }

    const { event } = props;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this.highlightItem();
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this.highlightItem();
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectItem(this.selectedIndex);
      return true;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide();
      return true;
    }

    return false;
  }

  public onExit(): void {
    this.hide();
  }

  public hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  public selectItem(index: number): void {
    const item = this.items[index];
    if (item && this.commandCallback) {
      this.commandCallback(item);
      if (this.coreEditor) {
        this.coreEditor.emit('slash-command', { item });
      }
    }
    this.hide();
  }

  private highlightItem(): void {
    const itemEls = this.element.querySelectorAll<HTMLElement>('.ue-slash-item');
    itemEls.forEach((el, idx) => {
      if (idx === this.selectedIndex) {
        el.classList.add('is-selected');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.classList.remove('is-selected');
      }
    });
  }

  private updatePosition(clientRect?: (() => DOMRect | null) | null): void {
    let rect: DOMRect | null = null;
    if (clientRect) {
      rect = clientRect();
    }

    // Fallback to active selection if decoration node rect is not available yet
    if (!rect || (rect.top === 0 && rect.bottom === 0 && rect.left === 0)) {
      const sel = typeof window !== 'undefined' ? window.getSelection() : null;
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
    }

    this.element.style.display = 'block';

    const menuRect = this.element.getBoundingClientRect();
    const menuW = menuRect.width || 320;
    const menuH = menuRect.height || 300;
    const margin = 8;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    let left = rect ? rect.left : 100;
    let top = rect ? rect.bottom + margin : 100;

    // Prevent horizontal overflow
    if (left + menuW > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - menuW - margin);
    }

    // If bottom exceeds viewport, flip upwards
    if (top + menuH > viewportHeight - margin && rect) {
      top = Math.max(margin, rect.top - menuH - margin);
    }

    this.element.style.position = 'fixed';
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.element.style.zIndex = '99999';
  }

  private render(query: string): void {
    this.element.innerHTML = '';

    // Header with search status
    const header = document.createElement('div');
    header.className = 'ue-slash-header';
    header.innerHTML = `
      <div class="ue-slash-header-title">
        <span class="ue-slash-header-tag">/</span>
        <span>${query ? `Commands matching "${query}"` : 'Basic & Media Commands'}</span>
      </div>
      <div class="ue-slash-header-hint">↑↓ Navigate • ↵ Select • ESC Close</div>
    `;
    this.element.appendChild(header);

    // List container
    const list = document.createElement('div');
    list.className = 'ue-slash-list';

    if (this.items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ue-slash-empty';
      empty.textContent = `No commands matching "/${query}"`;
      list.appendChild(empty);
      this.element.appendChild(list);
      return;
    }

    // Group items by category
    const groups: Record<string, { items: SlashCommandItem[]; startIndex: number }> = {};
    let currentIndex = 0;

    this.items.forEach(item => {
      const groupName = item.group || 'Basic Blocks';
      if (!groups[groupName]) {
        groups[groupName] = { items: [], startIndex: currentIndex };
      }
      groups[groupName].items.push(item);
      currentIndex++;
    });

    let globalItemIndex = 0;

    Object.entries(groups).forEach(([groupName, groupData]) => {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'ue-slash-group-title';
      groupHeader.textContent = groupName;
      list.appendChild(groupHeader);

      groupData.items.forEach(item => {
        const itemIndex = globalItemIndex;
        const itemEl = document.createElement('div');
        itemEl.className = `ue-slash-item ${itemIndex === this.selectedIndex ? 'is-selected' : ''}`;
        itemEl.setAttribute('role', 'option');
        itemEl.setAttribute('data-id', item.id);

        itemEl.innerHTML = `
          <div class="ue-slash-item-icon">${item.icon}</div>
          <div class="ue-slash-item-content">
            <div class="ue-slash-item-title">${item.title}</div>
            <div class="ue-slash-item-desc">${item.description}</div>
          </div>
          <div class="ue-slash-item-badge">/${item.id}</div>
        `;

        itemEl.addEventListener('mouseenter', () => {
          this.selectedIndex = itemIndex;
          this.highlightItem();
        });

        itemEl.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          this.selectItem(itemIndex);
        });

        list.appendChild(itemEl);
        globalItemIndex++;
      });
    });

    this.element.appendChild(list);
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
