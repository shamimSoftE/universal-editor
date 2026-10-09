import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: string;
  action: (editor: UniversalEditor) => void;
  canExecute?: (editor: UniversalEditor) => boolean;
  isDanger?: boolean;
  separatorAfter?: boolean;
}

export class TableContextMenu {
  public element: HTMLElement;
  private editor: UniversalEditor;
  private isVisible = false;
  private onContextMenuBound: (e: MouseEvent) => void;
  private onDocumentClickBound: (e: MouseEvent) => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.element = document.createElement('div');
    this.element.className = 'ue-context-menu ue-table-context-menu';

    this.onContextMenuBound = this.handleContextMenu.bind(this);
    this.onDocumentClickBound = this.handleDocumentClick.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.element);
      this.attachListeners();
    }
  }

  private attachListeners(): void {
    const editorDom = this.editor.tiptap.view.dom;
    editorDom.addEventListener('contextmenu', this.onContextMenuBound as EventListener);
    document.addEventListener('click', this.onDocumentClickBound);
    document.addEventListener('keydown', this.onKeyDownBound);
  }

  private handleContextMenu(e: MouseEvent): void {
    if (this.editor.isDestroyed) return;

    // Check if right click occurred inside a table cell
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const cell = target.closest('td, th');
    const table = target.closest('table');

    if (!cell && !table) {
      this.hide();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.renderMenu();
    this.showAt(e.clientX, e.clientY);
  }

  private getMenuItems(): ContextMenuItem[] {
    return [
      {
        id: 'addRowBefore',
        label: 'Insert Row Above',
        icon: icons.addRowBefore,
        action: ed => ed.addRowBefore(),
      },
      {
        id: 'addRowAfter',
        label: 'Insert Row Below',
        icon: icons.addRowAfter,
        action: ed => ed.addRowAfter(),
      },
      {
        id: 'deleteRow',
        label: 'Delete Row',
        icon: icons.deleteRow,
        action: ed => ed.deleteRow(),
        separatorAfter: true,
      },
      {
        id: 'addColumnBefore',
        label: 'Insert Column Left',
        icon: icons.addColumnBefore,
        action: ed => ed.addColumnBefore(),
      },
      {
        id: 'addColumnAfter',
        label: 'Insert Column Right',
        icon: icons.addColumnAfter,
        action: ed => ed.addColumnAfter(),
      },
      {
        id: 'deleteColumn',
        label: 'Delete Column',
        icon: icons.deleteColumn,
        action: ed => ed.deleteColumn(),
        separatorAfter: true,
      },
      {
        id: 'mergeCells',
        label: 'Merge Cells',
        icon: icons.mergeCells,
        action: ed => ed.mergeCells(),
        canExecute: ed => ed.tiptap.can().mergeCells(),
      },
      {
        id: 'splitCell',
        label: 'Split Cell',
        icon: icons.splitCell,
        action: ed => ed.splitCell(),
        canExecute: ed => ed.tiptap.can().splitCell(),
        separatorAfter: true,
      },
      {
        id: 'toggleHeaderRow',
        label: 'Toggle Header Row',
        icon: icons.toggleHeaderRow,
        action: ed => ed.toggleHeaderRow(),
      },
      {
        id: 'toggleHeaderCol',
        label: 'Toggle Header Column',
        icon: icons.toggleHeaderCol,
        action: ed => ed.toggleHeaderColumn(),
        separatorAfter: true,
      },
      {
        id: 'deleteTable',
        label: 'Delete Table',
        icon: icons.deleteTable,
        action: ed => ed.deleteTable(),
        isDanger: true,
      },
    ];
  }

  private renderMenu(): void {
    this.element.innerHTML = '';
    const items = this.getMenuItems();

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ue-context-menu-item ${item.isDanger ? 'ue-context-menu-danger' : ''}`;

      const isEnabled = item.canExecute ? item.canExecute(this.editor) : true;
      if (!isEnabled) {
        btn.disabled = true;
        btn.classList.add('disabled');
      }

      btn.innerHTML = `
        <span class="ue-context-menu-icon">${item.icon}</span>
        <span class="ue-context-menu-text">${item.label}</span>
      `;

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
        item.action(this.editor);
        this.editor.focus();
      });

      this.element.appendChild(btn);

      if (item.separatorAfter) {
        const sep = document.createElement('div');
        sep.className = 'ue-context-menu-separator';
        this.element.appendChild(sep);
      }
    });
  }

  private showAt(clientX: number, clientY: number): void {
    this.element.classList.add('active');
    this.isVisible = true;

    const menuRect = this.element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let x = clientX + scrollLeft;
    let y = clientY + scrollTop;

    // Viewport overflow bounds checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (clientX + menuRect.width > viewportWidth - 10) {
      x = Math.max(10, clientX - menuRect.width + scrollLeft);
    }
    if (clientY + menuRect.height > viewportHeight - 10) {
      y = Math.max(10, clientY - menuRect.height + scrollTop);
    }

    this.element.style.top = `${y}px`;
    this.element.style.left = `${x}px`;
  }

  public hide(): void {
    if (this.isVisible) {
      this.element.classList.remove('active');
      this.isVisible = false;
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (this.isVisible && !this.element.contains(e.target as Node)) {
      this.hide();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }

  public destroy(): void {
    this.hide();
    const editorDom = this.editor.tiptap?.view?.dom;
    if (editorDom) {
      editorDom.removeEventListener('contextmenu', this.onContextMenuBound as EventListener);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.onDocumentClickBound);
      document.removeEventListener('keydown', this.onKeyDownBound);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
