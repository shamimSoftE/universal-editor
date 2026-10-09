import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export class ImageDialog {
  public overlay: HTMLElement;
  private dialog: HTMLElement;
  private editor: UniversalEditor;

  private activeTab: 'upload' | 'url' = 'upload';
  private selectedFile: File | null = null;
  private previewImg: HTMLImageElement;
  private urlInput: HTMLInputElement;
  private altInput: HTMLInputElement;
  private captionInput: HTMLInputElement;
  private widthSelect: HTMLSelectElement;
  private alignSelect: HTMLSelectElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private progressLabel: HTMLElement;
  private errorMessage: HTMLElement;
  private submitBtn: HTMLButtonElement;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ue-dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'ue-dialog';
    this.dialog.style.maxWidth = '520px';

    this.dialog.innerHTML = `
      <div class="ue-dialog-title">
        ${icons.image}
        <span>Insert Image</span>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
        <button type="button" id="tabUploadBtn" class="ue-btn ue-btn-primary">Upload File</button>
        <button type="button" id="tabUrlBtn" class="ue-btn ue-btn-secondary">Image URL</button>
      </div>

      <!-- Upload Tab Content -->
      <div id="uploadPane">
        <div class="ue-dropzone" id="imageDropzone">
          <div class="ue-dropzone-icon">${icons.upload}</div>
          <div class="ue-dropzone-text">Click or drag & drop image here</div>
          <div class="ue-dropzone-hint">Supports JPG, PNG, WEBP, GIF, SVG (Max 10MB)</div>
          <input type="file" id="imageFileInput" accept="image/*" style="display: none;" />
        </div>
      </div>

      <!-- URL Tab Content -->
      <div id="urlPane" style="display: none;">
        <div class="ue-form-group">
          <label class="ue-form-label" for="imageUrlInput">Image URL</label>
          <input type="url" id="imageUrlInput" class="ue-input" placeholder="https://example.com/photo.jpg" />
        </div>
      </div>

      <!-- Progress Bar (hidden by default) -->
      <div class="ue-progress-container" id="imageProgressContainer" style="display: none;">
        <div class="ue-progress-bar">
          <div class="ue-progress-fill" id="imageProgressFill" style="width: 0%;"></div>
        </div>
        <div class="ue-progress-label">
          <span id="imageProgressStatus">Uploading...</span>
          <span id="imageProgressPercent">0%</span>
        </div>
      </div>

      <!-- Image Preview -->
      <div id="imagePreviewContainer" style="margin: 14px 0; text-align: center; display: none;">
        <img id="imagePreviewImg" style="max-height: 180px; max-width: 100%; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);" />
      </div>

      <!-- Formatting Attributes -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
        <div class="ue-form-group">
          <label class="ue-form-label">Width</label>
          <select id="imageWidthSelect" class="ue-input">
            <option value="100%">100% (Full Width)</option>
            <option value="75%">75% Width</option>
            <option value="50%">50% Width</option>
            <option value="25%">25% Width</option>
          </select>
        </div>
        <div class="ue-form-group">
          <label class="ue-form-label">Alignment</label>
          <select id="imageAlignSelect" class="ue-input">
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="imageAltInput">Alt Text</label>
        <input type="text" id="imageAltInput" class="ue-input" placeholder="Description for accessibility" />
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="imageCaptionInput">Caption</label>
        <input type="text" id="imageCaptionInput" class="ue-input" placeholder="Optional image caption" />
      </div>

      <div id="imageErrorMsg" style="color: #f87171; font-size: 12px; margin-top: 6px; display: none;"></div>

      <div class="ue-dialog-actions">
        <button type="button" id="imageCancelBtn" class="ue-btn ue-btn-secondary">Cancel</button>
        <button type="button" id="imageSubmitBtn" class="ue-btn ue-btn-primary">Insert Image</button>
      </div>
    `;

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    // Queries
    this.previewImg = this.dialog.querySelector('#imagePreviewImg') as HTMLImageElement;
    this.urlInput = this.dialog.querySelector('#imageUrlInput') as HTMLInputElement;
    this.altInput = this.dialog.querySelector('#imageAltInput') as HTMLInputElement;
    this.captionInput = this.dialog.querySelector('#imageCaptionInput') as HTMLInputElement;
    this.widthSelect = this.dialog.querySelector('#imageWidthSelect') as HTMLSelectElement;
    this.alignSelect = this.dialog.querySelector('#imageAlignSelect') as HTMLSelectElement;
    this.progressBar = this.dialog.querySelector('#imageProgressContainer') as HTMLElement;
    this.progressFill = this.dialog.querySelector('#imageProgressFill') as HTMLElement;
    this.progressLabel = this.dialog.querySelector('#imageProgressPercent') as HTMLElement;
    this.errorMessage = this.dialog.querySelector('#imageErrorMsg') as HTMLElement;
    this.submitBtn = this.dialog.querySelector('#imageSubmitBtn') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    const tabUploadBtn = this.dialog.querySelector('#tabUploadBtn') as HTMLButtonElement;
    const tabUrlBtn = this.dialog.querySelector('#tabUrlBtn') as HTMLButtonElement;
    const uploadPane = this.dialog.querySelector('#uploadPane') as HTMLElement;
    const urlPane = this.dialog.querySelector('#urlPane') as HTMLElement;
    const dropzone = this.dialog.querySelector('#imageDropzone') as HTMLElement;
    const fileInput = this.dialog.querySelector('#imageFileInput') as HTMLInputElement;
    const cancelBtn = this.dialog.querySelector('#imageCancelBtn') as HTMLButtonElement;

    tabUploadBtn.addEventListener('click', () => {
      this.activeTab = 'upload';
      tabUploadBtn.className = 'ue-btn ue-btn-primary';
      tabUrlBtn.className = 'ue-btn ue-btn-secondary';
      uploadPane.style.display = 'block';
      urlPane.style.display = 'none';
    });

    tabUrlBtn.addEventListener('click', () => {
      this.activeTab = 'url';
      tabUrlBtn.className = 'ue-btn ue-btn-primary';
      tabUploadBtn.className = 'ue-btn ue-btn-secondary';
      uploadPane.style.display = 'none';
      urlPane.style.display = 'block';
    });

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        this.handleFileSelected(fileInput.files[0]);
      }
    });

    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        this.handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    this.urlInput.addEventListener('input', () => {
      const url = this.urlInput.value.trim();
      if (url) {
        this.showPreview(url);
      }
    });

    cancelBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    this.submitBtn.addEventListener('click', () => this.handleSubmit());
  }

  private handleFileSelected(file: File): void {
    this.selectedFile = file;
    const validation = this.editor.uploader.validate(file, true);
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid file');
      return;
    }
    this.clearError();
    const objectUrl = URL.createObjectURL(file);
    this.showPreview(objectUrl);
  }

  private showPreview(url: string): void {
    const previewContainer = this.dialog.querySelector('#imagePreviewContainer') as HTMLElement;
    this.previewImg.src = url;
    previewContainer.style.display = 'block';
  }

  private showError(msg: string): void {
    this.errorMessage.textContent = msg;
    this.errorMessage.style.display = 'block';
  }

  private clearError(): void {
    this.errorMessage.textContent = '';
    this.errorMessage.style.display = 'none';
  }

  private async handleSubmit(): Promise<void> {
    this.clearError();
    const alt = this.altInput.value.trim();
    const caption = this.captionInput.value.trim();
    const width = this.widthSelect.value;
    const alignment = this.alignSelect.value as 'left' | 'center' | 'right';

    if (this.activeTab === 'upload') {
      if (!this.selectedFile) {
        this.showError('Please choose or drop an image file.');
        return;
      }

      try {
        this.progressBar.style.display = 'flex';
        this.submitBtn.disabled = true;

        const res = await this.editor.uploader.uploadImage(this.selectedFile, percent => {
          this.progressFill.style.width = `${percent}%`;
          this.progressLabel.textContent = `${percent}%`;
        });

        const src = typeof res === 'string' ? res : res.url;
        this.editor.insertImage({ src, alt, caption, width, alignment });
        this.close();
      } catch (err: any) {
        this.showError(err.message || 'Image upload failed.');
      } finally {
        this.progressBar.style.display = 'none';
        this.submitBtn.disabled = false;
      }
    } else {
      const src = this.urlInput.value.trim();
      if (!src) {
        this.showError('Please enter a valid image URL.');
        return;
      }
      this.editor.insertImage({ src, alt, caption, width, alignment });
      this.close();
    }
  }

  public open(): void {
    this.selectedFile = null;
    this.urlInput.value = '';
    this.altInput.value = '';
    this.captionInput.value = '';
    this.clearError();
    const previewContainer = this.dialog.querySelector('#imagePreviewContainer') as HTMLElement;
    previewContainer.style.display = 'none';
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
