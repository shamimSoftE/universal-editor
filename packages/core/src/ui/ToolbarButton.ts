import type { UniversalEditor } from '../UniversalEditor';

export interface ToolbarButtonOptions {
  name: string;
  title: string;
  icon: string;
  action: (editor: UniversalEditor) => void;
  isActive?: (editor: UniversalEditor) => boolean;
  canExecute?: (editor: UniversalEditor) => boolean;
}

export class ToolbarButton {
  public element: HTMLButtonElement;
  private editor: UniversalEditor;
  private options: ToolbarButtonOptions;

  constructor(editor: UniversalEditor, options: ToolbarButtonOptions) {
    this.editor = editor;
    this.options = options;

    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = `ue-toolbar-btn ue-btn-${options.name}`;
    this.element.title = options.title;
    this.element.setAttribute('aria-label', options.title);
    this.element.innerHTML = options.icon;

    this.element.addEventListener('click', e => {
      e.preventDefault();
      this.options.action(this.editor);
      this.updateState();
    });

    this.updateState();
  }

  public updateState(): void {
    if (this.editor.isDestroyed) return;

    if (this.options.isActive) {
      const active = this.options.isActive(this.editor);
      this.element.classList.toggle('is-active', active);
      this.element.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (this.options.canExecute) {
      const can = this.options.canExecute(this.editor);
      this.element.disabled = !can;
    }
  }
}
