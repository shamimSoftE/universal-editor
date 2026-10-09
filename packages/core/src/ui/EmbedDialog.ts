import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';
import { detectEmbedProvider } from '../embed/detectEmbed';

export class EmbedDialog {
  public overlay: HTMLElement;
  private dialog: HTMLElement;
  private editor: UniversalEditor;
  private urlInput: HTMLInputElement;
  private widthSelect: HTMLSelectElement;
  private alignSelect: HTMLSelectElement;
  private previewBadge: HTMLElement;
  private errorMsg: HTMLElement;
  private submitBtn: HTMLButtonElement;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ue-dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'ue-dialog ue-embed-dialog';
    this.dialog.style.maxWidth = '460px';

    this.dialog.innerHTML = `
      <div class="ue-dialog-title">
        ${icons.embed}
        <span>Insert Media Embed</span>
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="ueEmbedUrlInput">Media or Embed URL</label>
        <input
          type="url"
          id="ueEmbedUrlInput"
          class="ue-input"
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
        />
        <div class="ue-embed-detection-badge" id="ueEmbedDetectionBadge" style="display: none; margin-top: 6px;"></div>
        <div class="ue-dialog-error" id="ueEmbedError" style="display: none; margin-top: 6px;"></div>
        <div style="font-size: 11.5px; color: #94a3b8; margin-top: 6px;">
          Supports YouTube, Vimeo, Google Maps, direct video files (.mp4), and whitelisted iframes.
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 14px;">
        <div class="ue-form-group" style="flex: 1; margin-bottom: 0;">
          <label class="ue-form-label" for="ueEmbedWidthSelect">Width</label>
          <select id="ueEmbedWidthSelect" class="ue-select">
            <option value="100%" selected>100% (Responsive)</option>
            <option value="85%">85%</option>
            <option value="70%">70%</option>
            <option value="550px">550px (Fixed)</option>
          </select>
        </div>
        <div class="ue-form-group" style="flex: 1; margin-bottom: 0;">
          <label class="ue-form-label" for="ueEmbedAlignSelect">Alignment</label>
          <select id="ueEmbedAlignSelect" class="ue-select">
            <option value="center" selected>Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="ue-dialog-actions" style="margin-top: 20px;">
        <button type="button" class="ue-btn ue-btn-secondary" id="ueEmbedCancelBtn">Cancel</button>
        <button type="button" class="ue-btn ue-btn-primary" id="ueEmbedSubmitBtn">Insert Embed</button>
      </div>
    `;

    this.overlay.appendChild(this.dialog);

    this.urlInput = this.dialog.querySelector('#ueEmbedUrlInput') as HTMLInputElement;
    this.widthSelect = this.dialog.querySelector('#ueEmbedWidthSelect') as HTMLSelectElement;
    this.alignSelect = this.dialog.querySelector('#ueEmbedAlignSelect') as HTMLSelectElement;
    this.previewBadge = this.dialog.querySelector('#ueEmbedDetectionBadge') as HTMLElement;
    this.errorMsg = this.dialog.querySelector('#ueEmbedError') as HTMLElement;
    this.submitBtn = this.dialog.querySelector('#ueEmbedSubmitBtn') as HTMLButtonElement;

    this.bindEvents();

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.overlay);
    }
  }

  private bindEvents(): void {
    const cancelBtn = this.dialog.querySelector('#ueEmbedCancelBtn');
    cancelBtn?.addEventListener('click', () => this.close());
    this.submitBtn.addEventListener('click', () => this.submit());

    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    this.urlInput.addEventListener('input', () => this.validateAndPreview());
    this.urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  private validateAndPreview(): boolean {
    const raw = this.urlInput.value.trim();
    if (!raw) {
      this.previewBadge.style.display = 'none';
      this.errorMsg.style.display = 'none';
      return false;
    }

    const detected = detectEmbedProvider(raw);
    if (!detected.valid) {
      this.previewBadge.style.display = 'none';
      this.errorMsg.textContent = detected.error || 'Invalid embed URL';
      this.errorMsg.style.display = 'block';
      return false;
    }

    this.errorMsg.style.display = 'none';
    this.previewBadge.style.display = 'inline-flex';
    this.previewBadge.className = 'ue-embed-detection-badge valid';

    let icon = icons.embed;
    if (detected.provider === 'youtube') icon = icons.youtube;
    else if (detected.provider === 'vimeo') icon = icons.vimeo;
    else if (detected.provider === 'google-maps') icon = icons.map;
    else if (detected.provider === 'video') icon = icons.video;

    this.previewBadge.innerHTML = `
      <span class="ue-badge-icon">${icon}</span>
      <span>Detected: <strong>${detected.title || detected.provider}</strong></span>
    `;

    return true;
  }

  public open(): void {
    this.urlInput.value = '';
    this.widthSelect.value = '100%';
    this.alignSelect.value = 'center';
    this.previewBadge.style.display = 'none';
    this.errorMsg.style.display = 'none';

    this.overlay.classList.add('active');
    setTimeout(() => this.urlInput.focus(), 60);
  }

  public close(): void {
    this.overlay.classList.remove('active');
    this.editor.focus();
  }

  public submit(): void {
    const raw = this.urlInput.value.trim();
    if (!raw) {
      this.errorMsg.textContent = 'Please enter a valid URL';
      this.errorMsg.style.display = 'block';
      return;
    }

    const detected = detectEmbedProvider(raw);
    if (!detected.valid) {
      this.errorMsg.textContent = detected.error || 'Invalid or untrusted embed provider';
      this.errorMsg.style.display = 'block';
      return;
    }

    const width = this.widthSelect.value;
    const alignment = this.alignSelect.value as 'left' | 'center' | 'right';

    this.editor.insertEmbed({
      url: raw,
      width,
      alignment,
      title: detected.title,
    });

    this.close();
  }

  public destroy(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
