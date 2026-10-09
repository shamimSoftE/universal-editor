import type { UniversalEditor } from '../UniversalEditor';
import { FocusTrap } from '../accessibility/FocusTrap';
import { icons } from '../icons';

export class LinkDialog {
  public overlay: HTMLElement;
  private dialog: HTMLElement;
  private urlInput: HTMLInputElement;
  private openNewTabCheckbox: HTMLInputElement;
  private removeBtn: HTMLButtonElement;
  private openExternalBtn: HTMLButtonElement;
  private editor: UniversalEditor;
  private focusTrap: FocusTrap;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ue-dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'ue-dialog';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'ue-link-dialog-heading');

    this.dialog.innerHTML = `
      <div class="ue-dialog-title">
        ${icons.link}
        <span id="ue-link-dialog-heading">Insert / Edit Link</span>
      </div>
      <form id="ue-link-form">
        <div class="ue-form-group">
          <label class="ue-form-label" for="ue-link-url">URL</label>
          <input type="url" id="ue-link-url" class="ue-input" placeholder="https://example.com" required />
        </div>
        <div class="ue-form-group">
          <label class="ue-checkbox-label">
            <input type="checkbox" id="ue-link-blank" />
            <span>Open in new tab</span>
          </label>
        </div>
        <div class="ue-dialog-actions">
          <button type="button" id="ue-link-remove" class="ue-btn ue-btn-danger" style="display: none;">
            Remove
          </button>
          <button type="button" id="ue-link-open" class="ue-btn ue-btn-secondary" style="display: none;" title="Open link in browser">
            ${icons.externalLink}
          </button>
          <button type="button" id="ue-link-cancel" class="ue-btn ue-btn-secondary">
            Cancel
          </button>
          <button type="submit" class="ue-btn ue-btn-primary">
            Apply
          </button>
        </div>
      </form>
    `;

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    this.urlInput = this.dialog.querySelector('#ue-link-url') as HTMLInputElement;
    this.openNewTabCheckbox = this.dialog.querySelector('#ue-link-blank') as HTMLInputElement;
    this.removeBtn = this.dialog.querySelector('#ue-link-remove') as HTMLButtonElement;
    this.openExternalBtn = this.dialog.querySelector('#ue-link-open') as HTMLButtonElement;
    const cancelBtn = this.dialog.querySelector('#ue-link-cancel') as HTMLButtonElement;
    const form = this.dialog.querySelector('#ue-link-form') as HTMLFormElement;

    this.focusTrap = new FocusTrap(this.dialog, {
      onEscape: () => this.close(),
    });

    // Events
    cancelBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    this.removeBtn.addEventListener('click', () => {
      this.editor.unsetLink();
      this.close();
    });

    this.openExternalBtn.addEventListener('click', () => {
      const url = this.urlInput.value;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const href = this.urlInput.value.trim();
      if (href) {
        const target = this.openNewTabCheckbox.checked ? '_blank' : undefined;
        this.editor.setLink({ href, target });
      } else {
        this.editor.unsetLink();
      }
      this.close();
    });
  }

  public open(): void {
    const attrs = this.editor.getLinkAttributes();
    const currentHref = attrs.href || '';
    const currentTarget = attrs.target === '_blank';

    this.urlInput.value = currentHref;
    this.openNewTabCheckbox.checked = currentTarget;

    if (currentHref) {
      this.removeBtn.style.display = 'inline-flex';
      this.openExternalBtn.style.display = 'inline-flex';
    } else {
      this.removeBtn.style.display = 'none';
      this.openExternalBtn.style.display = 'none';
    }

    this.overlay.classList.add('is-open');
    this.focusTrap.activate();
    setTimeout(() => {
      this.urlInput.focus();
      this.urlInput.select();
    }, 50);
  }

  public close(): void {
    this.focusTrap.deactivate();
    this.overlay.classList.remove('is-open');
    this.editor.focus();
  }

  public destroy(): void {
    this.focusTrap.destroy();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
