import type { UploaderInterface, UploaderOptions, UploadResult, ProgressCallback } from './types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export class DefaultUploader implements UploaderInterface {
  private options: UploaderOptions;

  constructor(options: UploaderOptions = {}) {
    this.options = {
      maxFileSize: 10 * 1024 * 1024, // 10 MB default
      allowedImageMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      allowedFileMimes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'text/csv',
      ],
      ...options,
    };
  }

  public validate(file: File, isImage = false): { valid: boolean; error?: string } {
    if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
      const maxFormatted = formatBytes(this.options.maxFileSize);
      return {
        valid: false,
        error: `File size (${formatBytes(file.size)}) exceeds the maximum allowed size of ${maxFormatted}.`,
      };
    }

    if (isImage && this.options.allowedImageMimes) {
      if (!this.options.allowedImageMimes.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported image format (${file.type}). Allowed formats: JPG, PNG, WEBP, GIF, SVG.`,
        };
      }
    } else if (!isImage && this.options.allowedFileMimes) {
      // Check file extension if mime type is generic
      const hasAllowedMime = this.options.allowedFileMimes.includes(file.type);
      const isCommonExt = /\.(pdf|docx?|xlsx?|zip|csv|txt)$/i.test(file.name);
      if (!hasAllowedMime && !isCommonExt) {
        return {
          valid: false,
          error: `Unsupported file type (${file.type || file.name}). Allowed: PDF, DOC, XLS, ZIP, TXT, CSV.`,
        };
      }
    }

    return { valid: true };
  }

  public async uploadImage(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<UploadResult | string> {
    const validation = this.validate(file, true);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (this.options.uploadImage) {
      return this.options.uploadImage(file, onProgress);
    }

    if (this.options.uploadEndpoint) {
      return this.httpUpload(file, this.options.uploadEndpoint, onProgress);
    }

    // Default standalone / client-side mock with real progress
    return this.clientMockUpload(file, onProgress);
  }

  public async uploadFile(file: File, onProgress?: ProgressCallback): Promise<UploadResult> {
    const validation = this.validate(file, false);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (this.options.uploadFile) {
      return this.options.uploadFile(file, onProgress);
    }

    if (this.options.uploadEndpoint) {
      return this.httpUpload(file, this.options.uploadEndpoint, onProgress);
    }

    // Default client mock
    const res = await this.clientMockUpload(file, onProgress);
    return {
      url: typeof res === 'string' ? res : res.url,
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop() || 'file',
    };
  }

  private clientMockUpload(file: File, onProgress?: ProgressCallback): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(progress, 100));

        if (progress >= 100) {
          clearInterval(interval);
          try {
            const url = URL.createObjectURL(file);
            resolve({
              url,
              name: file.name,
              size: file.size,
              type: file.type,
            });
          } catch (err) {
            reject(err);
          }
        }
      }, 50);
    });
  }

  private httpUpload(
    file: File,
    endpoint: string,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      if (onProgress) {
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch {
            resolve({ url: xhr.responseText });
          }
        } else {
          reject(new Error(`Upload failed with status code ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during file upload.'));
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  }
}
