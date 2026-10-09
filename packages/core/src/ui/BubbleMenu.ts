import type { UniversalEditor } from '../UniversalEditor';
import { ToolbarButton } from './ToolbarButton';
import { icons } from '../icons';
import type { LinkDialog } from './LinkDialog';

export class BubbleMenu {
  public element: HTMLElement;
  private editor: UniversalEditor;
  private linkDialog: LinkDialog;
  private buttons: ToolbarButton[] = [];

  constructor(editor: UniversalEditor, linkDialog: LinkDialog) {
    this.editor = editor;
    this.linkDialog = linkDialog;

    this.element = document.createElement('div');
    this.element.className = 'ue-bubble-menu';

    this.setupButtons();
    document.body.appendChild(this.element);

    this.editor.on('selectionUpdate', () => this.update());
    this.editor.on('blur', () => this.hide());
  }

  private setupButtons(): void {
    const items = [
      {
        name: 'bold',
        title: 'Bold (Ctrl+B)',
        icon: icons.bold,
        action: (ed: UniversalEditor) => ed.toggleBold(),
        isActive: (ed: UniversalEditor) => ed.isActive('bold'),
      },
      {
        name: 'italic',
        title: 'Italic (Ctrl+I)',
        icon: icons.italic,
        action: (ed: UniversalEditor) => ed.toggleItalic(),
        isActive: (ed: UniversalEditor) => ed.isActive('italic'),
      },
      {
        name: 'underline',
        title: 'Underline (Ctrl+U)',
        icon: icons.underline,
        action: (ed: UniversalEditor) => ed.toggleUnderline(),
        isActive: (ed: UniversalEditor) => ed.isActive('underline'),
      },
      {
        name: 'strike',
        title: 'Strike',
        icon: icons.strike,
        action: (ed: UniversalEditor) => ed.toggleStrike(),
        isActive: (ed: UniversalEditor) => ed.isActive('strike'),
      },
      {
        name: 'code',
        title: 'Code',
        icon: icons.code,
        action: (ed: UniversalEditor) => ed.toggleCode(),
        isActive: (ed: UniversalEditor) => ed.isActive('code'),
      },
      {
        name: 'link',
        title: 'Link',
        icon: icons.link,
        action: () => this.linkDialog.open(),
        isActive: (ed: UniversalEditor) => ed.isActive('link'),
      },
    ];

    items.forEach(item => {
      const btn = new ToolbarButton(this.editor, item);
      this.buttons.push(btn);
      this.element.appendChild(btn.element);
    });
  }

  public update(): void {
    if (this.editor.isDestroyed) {
      this.hide();
      return;
    }

    const { state, view } = this.editor.tiptap;
    const { from, to, empty } = state.selection;

    if (empty || from === to) {
      this.hide();
      return;
    }

    // Check if editor has focus
    if (!view.hasFocus()) {
      this.hide();
      return;
    }

    // Update buttons state
    this.buttons.forEach(btn => btn.updateState());

    // Calculate position
    try {
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const left = (start.left + end.left) / 2;
      const top = Math.min(start.top, end.top) - 45;

      this.element.style.left = `${Math.max(10, left - this.element.offsetWidth / 2)}px`;
      this.element.style.top = `${Math.max(10, top)}px`;
      this.element.classList.add('is-visible');
    } catch {
      this.hide();
    }
  }

  public hide(): void {
    this.element.classList.remove('is-visible');
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
