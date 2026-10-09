import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export interface TableToolbarAction {
  name: string;
  title: string;
  icon: string;
  action: (editor: UniversalEditor) => void;
  canExecute?: (editor: UniversalEditor) => boolean;
  isActive?: (editor: UniversalEditor) => boolean;
  isDanger?: boolean;
}

export class TableToolbar {
  public element: HTMLElement;
  private editor: UniversalEditor;
  private isVisible = false;
  private actionButtons: { btn: HTMLButtonElement; item: TableToolbarAction }[] = [];

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.element = document.createElement('div');
    this.element.className = 'ue-table-toolbar';
    this.element.setAttribute('role', 'toolbar');
    this.element.setAttribute('aria-label', 'Table controls');

    this.setupActions();

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.element);
    }

    this.editor.on('selectionUpdate', () => this.update());
    this.editor.on('update', () => this.update());
    this.editor.on('blur', () => {
      // Delay hide to allow click on toolbar buttons
      setTimeout(() => {
        if (typeof document !== 'undefined' && !this.element.contains(document.activeElement)) {
          this.hide();
        }
      }, 150);
    });
  }

  private setupActions(): void {
    const actions: (TableToolbarAction | { separator: true })[] = [
      {
        name: 'addRowBefore',
        title: 'Add Row Above',
        icon: icons.addRowBefore,
        action: ed => ed.addRowBefore(),
      },
      {
        name: 'addRowAfter',
        title: 'Add Row Below',
        icon: icons.addRowAfter,
        action: ed => ed.addRowAfter(),
      },
      {
        name: 'deleteRow',
        title: 'Delete Row',
        icon: icons.deleteRow,
        action: ed => ed.deleteRow(),
      },
      { separator: true },
      {
        name: 'addColumnBefore',
        title: 'Add Column Left',
        icon: icons.addColumnBefore,
        action: ed => ed.addColumnBefore(),
      },
      {
        name: 'addColumnAfter',
        title: 'Add Column Right',
        icon: icons.addColumnAfter,
        action: ed => ed.addColumnAfter(),
      },
      {
        name: 'deleteColumn',
        title: 'Delete Column',
        icon: icons.deleteColumn,
        action: ed => ed.deleteColumn(),
      },
      { separator: true },
      {
        name: 'mergeCells',
        title: 'Merge Cells',
        icon: icons.mergeCells,
        action: ed => ed.mergeCells(),
        canExecute: ed => ed.tiptap.can().mergeCells(),
      },
      {
        name: 'splitCell',
        title: 'Split Cell',
        icon: icons.splitCell,
        action: ed => ed.splitCell(),
        canExecute: ed => ed.tiptap.can().splitCell(),
      },
      {
        name: 'toggleHeaderRow',
        title: 'Toggle Header Row',
        icon: icons.toggleHeaderRow,
        action: ed => ed.toggleHeaderRow(),
      },
      { separator: true },
      {
        name: 'deleteTable',
        title: 'Delete Table',
        icon: icons.deleteTable,
        action: ed => ed.deleteTable(),
        isDanger: true,
      },
    ];

    actions.forEach(item => {
      if ('separator' in item) {
        const sep = document.createElement('div');
        sep.className = 'ue-toolbar-separator';
        this.element.appendChild(sep);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ue-table-toolbar-btn ${item.isDanger ? 'ue-btn-danger-icon' : ''}`;
      btn.title = item.title;
      btn.setAttribute('aria-label', item.title);
      btn.innerHTML = item.icon;

      btn.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevent losing editor focus
      });

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        item.action(this.editor);
        this.update();
      });

      this.actionButtons.push({ btn, item });
      this.element.appendChild(btn);
    });
  }

  public update(): void {
    if (this.editor.isDestroyed || typeof window === 'undefined') {
      this.hide();
      return;
    }

    if (!this.editor.isTableActive()) {
      this.hide();
      return;
    }

    // Get current selection anchor cell or table DOM element
    const { view } = this.editor.tiptap;
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      this.hide();
      return;
    }

    let node: Node | null = domSelection.anchorNode;
    let tableEl: HTMLElement | null = null;
    let cellEl: HTMLElement | null = null;

    while (node && node !== view.dom) {
      if (node instanceof HTMLElement) {
        if (node.tagName === 'TD' || node.tagName === 'TH') {
          cellEl = node;
        }
        if (node.tagName === 'TABLE') {
          tableEl = node;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!tableEl) {
      this.hide();
      return;
    }

    // Update buttons enabled/disabled states
    this.actionButtons.forEach(({ btn, item }) => {
      if (item.canExecute) {
        const can = item.canExecute(this.editor);
        btn.disabled = !can;
        btn.classList.toggle('disabled', !can);
      } else {
        btn.disabled = false;
        btn.classList.remove('disabled');
      }

      if (item.isActive) {
        const active = item.isActive(this.editor);
        btn.classList.toggle('active', active);
      }
    });

    // Position floating toolbar above the active cell or table
    const targetRect = (cellEl || tableEl).getBoundingClientRect();
    this.show(targetRect);
  }

  public show(targetRect: DOMRect): void {
    this.element.classList.add('visible');
    this.isVisible = true;

    const toolbarRect = this.element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = targetRect.top + scrollTop - toolbarRect.height - 8;
    let left = targetRect.left + scrollLeft + (targetRect.width / 2) - (toolbarRect.width / 2);

    // If toolbar overflows top of viewport, show below target
    if (top < scrollTop + 10) {
      top = targetRect.bottom + scrollTop + 8;
    }

    // Horizontal boundary clamping
    if (left < 10) left = 10;
    const maxLeft = document.documentElement.clientWidth - toolbarRect.width - 10;
    if (left > maxLeft) left = maxLeft;

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  public hide(): void {
    if (this.isVisible) {
      this.element.classList.remove('visible');
      this.isVisible = false;
    }
  }

  public destroy(): void {
    this.hide();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
