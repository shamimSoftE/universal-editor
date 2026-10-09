import type { UniversalEditor } from '../UniversalEditor';
import type { AutosaveStatus, DraftData } from './types';

export class AutosaveIndicator {
  private editor: UniversalEditor;
  private container: HTMLElement;
  private statusEl: HTMLElement;
  private promptEl: HTMLElement;
  private isDestroyed = false;

  constructor(editor: UniversalEditor, parentElement?: HTMLElement) {
    this.editor = editor;
    this.container = document.createElement('div');
    this.container.className = 'ue-autosave-container';

    // Status indicator badge
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'ue-autosave-status ue-autosave-status-saved';
    this.statusEl.innerHTML = this.renderStatus('saved', 'Saved');
    this.container.appendChild(this.statusEl);

    // Draft detected prompt banner (hidden by default)
    this.promptEl = document.createElement('div');
    this.promptEl.className = 'ue-draft-prompt';
    this.promptEl.style.display = 'none';
    this.container.appendChild(this.promptEl);

    if (parentElement) {
      parentElement.appendChild(this.container);
    }

    this.bindEvents();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private bindEvents(): void {
    this.editor.on('autosave:status', ({ status, formattedTime }: { status: AutosaveStatus; formattedTime?: string }) => {
      this.updateStatus(status, formattedTime);
    });

    this.editor.on('autosave:draft-detected', ({ draft }: { draft: DraftData }) => {
      this.showDraftPrompt(draft);
    });

    this.editor.on('autosave:restored', () => {
      this.hideDraftPrompt();
    });
  }

  public updateStatus(status: AutosaveStatus, formattedTime?: string): void {
    if (this.isDestroyed) return;

    this.statusEl.className = `ue-autosave-status ue-autosave-status-${status}`;
    let label = 'Saved';
    if (status === 'saving') {
      label = 'Saving...';
    } else if (status === 'unsaved') {
      label = 'Unsaved changes';
    } else if (status === 'error') {
      label = 'Save failed';
    } else if (status === 'saved') {
      label = formattedTime ? `Saved ${formattedTime}` : 'Saved';
    }

    this.statusEl.innerHTML = this.renderStatus(status, label);

    // Attach retry handler if failed
    if (status === 'error') {
      const retryBtn = this.statusEl.querySelector('.ue-autosave-retry');
      retryBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editor.saveDraft(true);
      });
    }
  }

  private renderStatus(status: AutosaveStatus, label: string): string {
    let icon = '';
    if (status === 'saving') {
      icon = `<svg class="ue-autosave-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`;
    } else if (status === 'saved') {
      icon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (status === 'unsaved') {
      icon = `<span class="ue-autosave-dot ue-autosave-dot-unsaved"></span>`;
    } else if (status === 'error') {
      icon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    const retryHtml = status === 'error' ? ' <button class="ue-autosave-retry">Retry</button>' : '';

    return `
      <span class="ue-autosave-icon">${icon}</span>
      <span class="ue-autosave-label">${label}</span>
      ${retryHtml}
    `;
  }

  public showDraftPrompt(draft: DraftData): void {
    if (this.isDestroyed) return;

    const dateStr = draft.updatedAt
      ? new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'earlier';

    this.promptEl.innerHTML = `
      <div class="ue-draft-prompt-inner">
        <span class="ue-draft-prompt-text">💡 Unsaved draft found from ${dateStr}</span>
        <div class="ue-draft-prompt-actions">
          <button class="btn btn-sm btn-primary ue-draft-restore-btn">Restore Draft</button>
          <button class="btn btn-sm btn-ghost ue-draft-discard-btn">Discard</button>
        </div>
      </div>
    `;

    this.promptEl.style.display = 'block';

    const restoreBtn = this.promptEl.querySelector('.ue-draft-restore-btn');
    const discardBtn = this.promptEl.querySelector('.ue-draft-discard-btn');

    restoreBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.editor.restoreDraft(draft);
      this.hideDraftPrompt();
    });

    discardBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.editor.clearDraft();
      this.hideDraftPrompt();
    });
  }

  public hideDraftPrompt(): void {
    if (this.promptEl) {
      this.promptEl.style.display = 'none';
      this.promptEl.innerHTML = '';
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
