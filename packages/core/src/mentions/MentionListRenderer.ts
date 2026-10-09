import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { MentionUser } from './types';
import type { UniversalEditor } from '../UniversalEditor';

export class MentionListRenderer {
  public element: HTMLElement;
  private selectedIndex = 0;
  private items: MentionUser[] = [];
  private commandCallback?: (item: MentionUser) => void;
  private coreEditor?: UniversalEditor;
  private isVisible = false;

  constructor(coreEditor?: UniversalEditor) {
    this.coreEditor = coreEditor;
    this.element = document.createElement('div');
    this.element.className = 'ue-mention-list';
    this.element.setAttribute('role', 'listbox');
    this.element.setAttribute('aria-label', 'User Mentions');
    this.element.style.display = 'none';

    this.onOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (this.isVisible && !this.element.contains(e.target as Node)) {
        this.hide();
      }
    };

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.element);
      document.addEventListener('pointerdown', this.onOutsideClick);
    }
  }

  private onOutsideClick?: (e: MouseEvent | TouchEvent) => void;

  public onStart(props: SuggestionProps<MentionUser>): void {
    this.items = props.items || [];
    this.commandCallback = props.command;
    this.selectedIndex = 0;
    this.isVisible = true;
    this.element.style.display = 'block';

    this.render(props.query);
    this.updatePosition(props.clientRect);
  }

  public onUpdate(props: SuggestionProps<MentionUser>): void {
    this.items = props.items || [];
    this.commandCallback = props.command;

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

    if (event.key === 'Enter' || event.key === 'Tab') {
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
        this.coreEditor.emit('mention', { user: item });
      }
    }
    this.hide();
  }

  private highlightItem(): void {
    const itemEls = this.element.querySelectorAll<HTMLElement>('.ue-mention-item');
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

    if (!rect || (rect.top === 0 && rect.bottom === 0 && rect.left === 0)) {
      const sel = typeof window !== 'undefined' ? window.getSelection() : null;
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
    }

    this.element.style.display = 'block';

    const menuRect = this.element.getBoundingClientRect();
    const menuW = menuRect.width || 280;
    const menuH = menuRect.height || 260;
    const margin = 8;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    let left = rect ? rect.left : 100;
    let top = rect ? rect.bottom + margin : 100;

    if (left + menuW > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - menuW - margin);
    }

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

    // Header
    const header = document.createElement('div');
    header.className = 'ue-mention-header';
    header.innerHTML = `
      <div class="ue-mention-header-title">
        <span class="ue-mention-header-tag">@</span>
        <span>${query ? `People matching "${query}"` : 'Mention a team member'}</span>
      </div>
      <div class="ue-mention-header-hint">↑↓ Navigate • ↵ Select • ESC Close</div>
    `;
    this.element.appendChild(header);

    // List
    const list = document.createElement('div');
    list.className = 'ue-mention-items';

    if (this.items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ue-mention-empty';
      empty.textContent = `No users found matching "@${query}"`;
      list.appendChild(empty);
      this.element.appendChild(list);
      return;
    }

    this.items.forEach((user, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = `ue-mention-item ${index === this.selectedIndex ? 'is-selected' : ''}`;
      itemEl.setAttribute('role', 'option');
      itemEl.setAttribute('data-id', String(user.id));

      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const avatarMarkup = user.avatar
        ? `<img class="ue-mention-avatar-img" src="${user.avatar}" alt="${user.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="ue-mention-avatar-fallback" style="display: none;">${initials}</div>`
        : `<div class="ue-mention-avatar-fallback">${initials}</div>`;

      itemEl.innerHTML = `
        <div class="ue-mention-avatar">
          ${avatarMarkup}
        </div>
        <div class="ue-mention-details">
          <div class="ue-mention-name-row">
            <span class="ue-mention-name">${user.name}</span>
            ${user.badge ? `<span class="ue-mention-badge">${user.badge}</span>` : ''}
          </div>
          <div class="ue-mention-sub-row">
            <span class="ue-mention-username">@${user.username}</span>
            ${user.role ? `<span class="ue-mention-role">• ${user.role}</span>` : ''}
          </div>
        </div>
      `;

      itemEl.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.highlightItem();
      });

      itemEl.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.selectItem(index);
      });

      list.appendChild(itemEl);
    });

    this.element.appendChild(list);
  }

  public destroy(): void {
    if (this.onOutsideClick && typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutsideClick);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
