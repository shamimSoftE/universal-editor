import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';
import { formatBytes } from '../upload/Uploader';

export class FileDialog {
  public overlay: HTMLElement;
  private dialog: HTMLElement;
  private editor: UniversalEditor;
  private selectedFile: File | null = null;

  private dropzone: HTMLElement;
  private fileInput: HTMLInputElement;
  private fileDetails: HTMLElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private progressPercent: HTMLElement;
  private errorMessage: HTMLElement;
  private submitBtn: HTMLButtonElement;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ue-dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'ue-dialog';
    this.dialog.style.maxWidth = '480px';

    this.dialog.innerHTML = `
      <div class="ue-dialog-title">
        ${icons.file}
        <span>Attach Document / File</span>
      </div>

      <div class="ue-dropzone" id="fileDropzone">
        <div class="ue-dropzone-icon">${icons.upload}</div>
        <div class="ue-dropzone-text">Click or drag & drop document here</div>
        <div class="ue-dropzone-hint">Supports PDF, DOC, DOCX, XLS, XLSX, ZIP, CSV (Max 10MB)</div>
        <input type="file" id="docFileInput" style="display: none;" />
      </div>

      <div id="fileSelectedDetails" style="display: none; margin: 14px 0; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 6px;">
        <div style="font-weight: 600; font-size: 13px; color: #f8fafc;" id="selectedFileName">filename.pdf</div>
        <div style="font-size: 11px; color: #94a3b8;" id="selectedFileSize">0 KB</div>
      </div>

      <div class="ue-progress-container" id="fileProgressContainer" style="display: none;">
        <div class="ue-progress-bar">
          <div class="ue-progress-fill" id="fileProgressFill" style="width: 0%;"></div>
        </div>
        <div class="ue-progress-label">
          <span>Uploading attachment...</span>
          <span id="fileProgressPercent">0%</span>
        </div>
      </div>

      <div id="fileErrorMsg" style="color: #f87171; font-size: 12px; margin-top: 6px; display: none;"></div>

      <div class="ue-dialog-actions">
        <button type="button" id="fileCancelBtn" class="ue-btn ue-btn-secondary">Cancel</button>
        <button type="button" id="fileSubmitBtn" class="ue-btn ue-btn-primary" disabled>Attach File</button>
      </div>
    `;

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    this.dropzone = this.dialog.querySelector('#fileDropzone') as HTMLElement;
    this.fileInput = this.dialog.querySelector('#docFileInput') as HTMLInputElement;
    this.fileDetails = this.dialog.querySelector('#fileSelectedDetails') as HTMLElement;
    this.progressBar = this.dialog.querySelector('#fileProgressContainer') as HTMLElement;
    this.progressFill = this.dialog.querySelector('#fileProgressFill') as HTMLElement;
    this.progressPercent = this.dialog.querySelector('#fileProgressPercent') as HTMLElement;
    this.errorMessage = this.dialog.querySelector('#fileErrorMsg') as HTMLElement;
    this.submitBtn = this.dialog.querySelector('#fileSubmitBtn') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    const cancelBtn = this.dialog.querySelector('#fileCancelBtn') as HTMLButtonElement;

    this.dropzone.addEventListener('click', () => this.fileInput.click());

    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files && this.fileInput.files[0]) {
        this.handleFileChosen(this.fileInput.files[0]);
      }
    });

    this.dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      this.dropzone.classList.add('is-dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('is-dragover');
    });

    this.dropzone.addEventListener('drop', e => {
      e.preventDefault();
      this.dropzone.classList.remove('is-dragover');
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        this.handleFileChosen(e.dataTransfer.files[0]);
      }
    });

    cancelBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    this.submitBtn.addEventListener('click', () => this.handleUploadAndInsert());
  }

  private handleFileChosen(file: File): void {
    this.selectedFile = file;
    const validation = this.editor.uploader.validate(file, false);
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid file');
      this.submitBtn.disabled = true;
      return;
    }

    this.clearError();
    const nameEl = this.dialog.querySelector('#selectedFileName') as HTMLElement;
    const sizeEl = this.dialog.querySelector('#selectedFileSize') as HTMLElement;

    nameEl.textContent = file.name;
    sizeEl.textContent = formatBytes(file.size);
    this.fileDetails.style.display = 'block';
    this.submitBtn.disabled = false;
  }

  private showError(msg: string): void {
    this.errorMessage.textContent = msg;
    this.errorMessage.style.display = 'block';
  }

  private clearError(): void {
    this.errorMessage.textContent = '';
    this.errorMessage.style.display = 'none';
  }

  private async handleUploadAndInsert(): Promise<void> {
    if (!this.selectedFile) return;
    this.clearError();

    try {
      this.progressBar.style.display = 'flex';
      this.submitBtn.disabled = true;

      const res = await this.editor.uploader.uploadFile(this.selectedFile, percent => {
        this.progressFill.style.width = `${percent}%`;
        this.progressPercent.textContent = `${percent}%`;
      });

      this.editor.insertFile({
        url: res.url,
        name: res.name || this.selectedFile.name,
        size: res.size || this.selectedFile.size,
        type: res.type || this.selectedFile.type,
      });

      this.close();
    } catch (err: any) {
      this.showError(err.message || 'File upload failed.');
    } finally {
      this.progressBar.style.display = 'none';
      this.submitBtn.disabled = false;
    }
  }

  public open(): void {
    this.selectedFile = null;
    this.clearError();
    this.fileDetails.style.display = 'none';
    this.submitBtn.disabled = true;
    this.overlay.classList.add('is-open');
  }

  public close(): void {
    this.overlay.classList.remove('is-open');
    this.editor.focus();
  }

  public destroy(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
