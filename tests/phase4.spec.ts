import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEditor,
  UniversalEditor,
  DefaultUploader,
  formatBytes,
} from '@universal-editor/core';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { RichTextEditor } from '@universal-editor/vue3';

describe('Phase 4 — Image & File Management', () => {
  let editor: UniversalEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (editor && !editor.isDestroyed) {
      editor.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Upload Service & Validation (DefaultUploader)', () => {
    it('should format bytes properly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(245 * 1024)).toBe('245 KB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should validate file sizes against maxFileSize limit', () => {
      const uploader = new DefaultUploader({ maxFileSize: 1024 * 1024 }); // 1MB

      const smallFile = new File(['hello'], 'test.png', { type: 'image/png' });
      expect(uploader.validate(smallFile, true).valid).toBe(true);

      const largeContent = new Uint8Array(2 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });
      const validation = uploader.validate(largeFile, true);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceeds the maximum allowed size');
    });

    it('should validate MIME types for images and files', () => {
      const uploader = new DefaultUploader();

      const validImg = new File(['fake-png'], 'photo.png', { type: 'image/png' });
      expect(uploader.validate(validImg, true).valid).toBe(true);

      const invalidImg = new File(['fake-exe'], 'program.exe', {
        type: 'application/x-msdownload',
      });
      expect(uploader.validate(invalidImg, true).valid).toBe(false);

      const validPdf = new File(['fake-pdf'], 'doc.pdf', { type: 'application/pdf' });
      expect(uploader.validate(validPdf, false).valid).toBe(true);
    });

    it('should allow custom uploadImage and uploadFile providers', async () => {
      const customUploadImage = vi.fn().mockResolvedValue('https://cdn.example.com/custom.jpg');
      const customUploadFile = vi.fn().mockResolvedValue({
        url: 'https://cdn.example.com/custom.pdf',
        name: 'custom.pdf',
        size: 5000,
        type: 'application/pdf',
      });

      const uploader = new DefaultUploader({
        uploadImage: customUploadImage,
        uploadFile: customUploadFile,
      });

      const testImg = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
      const imgRes = await uploader.uploadImage(testImg);
      expect(customUploadImage).toHaveBeenCalledWith(testImg, undefined);
      expect(imgRes).toBe('https://cdn.example.com/custom.jpg');

      const testDoc = new File(['doc'], 'test.pdf', { type: 'application/pdf' });
      const docRes = await uploader.uploadFile(testDoc);
      expect(customUploadFile).toHaveBeenCalledWith(testDoc, undefined);
      expect(docRes.url).toBe('https://cdn.example.com/custom.pdf');
    });
  });

  describe('CustomImage Extension & Editor API', () => {
    it('should insert image with alignment, width, and caption', () => {
      editor = createEditor({
        element: container,
        content: '<p>Before image</p>',
      });

      editor.insertImage({
        src: 'https://images.unsplash.com/photo-sample.jpg',
        alt: 'Sample nature photograph',
        title: 'Nature photo',
        width: '75%',
        alignment: 'center',
        caption: 'A beautiful morning view',
      });

      const html = editor.getHTML();
      expect(html).toContain('photo-sample.jpg');
      expect(html).toContain('ue-image-align-center');
      expect(html).toContain('alt="Sample nature photograph"');
      expect(html).toContain('A beautiful morning view');
    });

    it('should support left and right image alignment', () => {
      editor = createEditor({
        element: container,
      });

      editor.insertImage({
        src: 'https://example.com/left.jpg',
        alignment: 'left',
      });
      expect(editor.getHTML()).toContain('ue-image-align-left');

      editor.insertImage({
        src: 'https://example.com/right.jpg',
        alignment: 'right',
      });
      expect(editor.getHTML()).toContain('ue-image-align-right');
    });
  });

  describe('FileAttachment Extension & Editor API', () => {
    it('should insert file attachment card with metadata and download link', () => {
      editor = createEditor({
        element: container,
        content: '<p>Document attachment below:</p>',
      });

      editor.insertFile({
        url: 'https://example.com/reports/quarterly-report.pdf',
        name: 'quarterly-report.pdf',
        size: 245 * 1024,
        type: 'application/pdf',
      });

      const html = editor.getHTML();
      expect(html).toContain('data-type="file-attachment"');
      expect(html).toContain('quarterly-report.pdf');
      expect(html).toContain('245 KB');
      expect(html).toContain('href="https://example.com/reports/quarterly-report.pdf"');
      expect(html).toContain('Download');
    });
  });

  describe('Vue 3 Media Integration', () => {
    it('should render image and file toolbar buttons in Vue 3 component', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          toolbar: ['image', 'file'],
        },
      });

      await nextTick();

      expect(wrapper.find('.ue-btn-image').exists()).toBe(true);
      expect(wrapper.find('.ue-btn-file').exists()).toBe(true);

      wrapper.unmount();
    });

    it('should support insertImage and insertFile via template ref in Vue 3', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '<p>Vue 3 media</p>',
        },
      });

      await nextTick();

      const vm = wrapper.vm as any;
      expect(typeof vm.insertImage).toBe('function');
      expect(typeof vm.insertFile).toBe('function');

      vm.insertImage({
        src: 'https://example.com/vue3-img.png',
        alt: 'Vue 3 image',
      });

      expect(vm.getHTML()).toContain('vue3-img.png');

      vm.insertFile({
        url: 'https://example.com/sample.zip',
        name: 'sample.zip',
        size: 1024 * 1024,
        type: 'application/zip',
      });

      expect(vm.getHTML()).toContain('sample.zip');
      expect(vm.getHTML()).toContain('1 MB');

      wrapper.unmount();
    });
  });
});
