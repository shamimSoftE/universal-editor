/**
 * Universal Editor Media & Upload Types
 */

export interface UploadResult {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  id?: string | number;
  [key: string]: any;
}

export type ProgressCallback = (percent: number) => void;

export interface UploaderOptions {
  maxFileSize?: number; // In bytes (default: 10MB)
  allowedImageMimes?: string[];
  allowedFileMimes?: string[];
  uploadEndpoint?: string;
  uploadImage?: (file: File, onProgress?: ProgressCallback) => Promise<UploadResult | string>;
  uploadFile?: (file: File, onProgress?: ProgressCallback) => Promise<UploadResult>;
}

export interface UploaderInterface {
  uploadImage(file: File, onProgress?: ProgressCallback): Promise<UploadResult | string>;
  uploadFile(file: File, onProgress?: ProgressCallback): Promise<UploadResult>;
  validate(file: File, isImage?: boolean): { valid: boolean; error?: string };
}

export interface ImageAttributes {
  src: string;
  alt?: string;
  title?: string;
  width?: string | number;
  alignment?: 'left' | 'center' | 'right';
  caption?: string;
}

export interface FileAttachmentAttributes {
  url: string;
  name: string;
  size: number;
  type: string;
}
