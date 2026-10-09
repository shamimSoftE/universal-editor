<script setup lang="ts">
import { ref } from 'vue';
import { icons } from '@universal-editor/core';
import type { UniversalEditor, ImageAttributes } from '@universal-editor/core';

const props = defineProps<{
  modelValue: boolean;
  editor?: UniversalEditor | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'insert', attrs: ImageAttributes): void;
}>();

const activeTab = ref<'upload' | 'url'>('upload');
const selectedFile = ref<File | null>(null);
const previewUrl = ref('');
const urlInput = ref('');
const altInput = ref('');
const captionInput = ref('');
const widthInput = ref('100%');
const alignInput = ref<'left' | 'center' | 'right'>('center');
const isUploading = ref(false);
const uploadPercent = ref(0);
const errorMessage = ref('');
const isDragover = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

function close() {
  emit('update:modelValue', false);
  errorMessage.value = '';
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectFile(target.files[0]);
  }
}

function handleDrop(e: DragEvent) {
  isDragover.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    selectFile(e.dataTransfer.files[0]);
  }
}

function selectFile(file: File) {
  if (props.editor) {
    const val = props.editor.uploader.validate(file, true);
    if (!val.valid) {
      errorMessage.value = val.error || 'Invalid image file';
      return;
    }
  }

  errorMessage.value = '';
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
}

function handleUrlInput() {
  if (urlInput.value) {
    previewUrl.value = urlInput.value;
  }
}

async function handleApply() {
  errorMessage.value = '';

  const alt = altInput.value.trim();
  const caption = captionInput.value.trim();
  const width = widthInput.value;
  const alignment = alignInput.value;

  if (activeTab.value === 'upload') {
    if (!selectedFile.value) {
      errorMessage.value = 'Please select an image file to upload.';
      return;
    }

    if (!props.editor) return;

    try {
      isUploading.value = true;
      uploadPercent.value = 0;

      const res = await props.editor.uploader.uploadImage(selectedFile.value, p => {
        uploadPercent.value = p;
      });

      const src = typeof res === 'string' ? res : res.url;
      props.editor.insertImage({
        src,
        alt: alt || selectedFile.value.name,
        caption,
        width,
        alignment,
      });

      close();
    } catch (err: any) {
      errorMessage.value = err.message || 'Image upload failed.';
    } finally {
      isUploading.value = false;
    }
  } else {
    const src = urlInput.value.trim();
    if (!src) {
      errorMessage.value = 'Please enter a valid image URL.';
      return;
    }

    if (props.editor) {
      props.editor.insertImage({ src, alt, caption, width, alignment });
    }

    close();
  }
}
</script>

<template>
  <div class="ue-dialog-overlay" :class="{ 'is-open': modelValue }" @click.self="close">
    <div class="ue-dialog" style="max-width: 520px">
      <div class="ue-dialog-title">
        <span v-html="icons.image" />
        <span>Insert Image</span>
      </div>

      <!-- Tab Buttons -->
      <div
        style="
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
        "
      >
        <button
          type="button"
          class="ue-btn"
          :class="activeTab === 'upload' ? 'ue-btn-primary' : 'ue-btn-secondary'"
          @click="activeTab = 'upload'"
        >
          Upload File
        </button>
        <button
          type="button"
          class="ue-btn"
          :class="activeTab === 'url' ? 'ue-btn-primary' : 'ue-btn-secondary'"
          @click="activeTab = 'url'"
        >
          Image URL
        </button>
      </div>

      <!-- Upload Pane -->
      <div v-show="activeTab === 'upload'">
        <div
          class="ue-dropzone"
          :class="{ 'is-dragover': isDragover }"
          @click="fileInputRef?.click()"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="handleDrop"
        >
          <div class="ue-dropzone-icon" v-html="icons.upload" />
          <div class="ue-dropzone-text">Click or drag & drop image here</div>
          <div class="ue-dropzone-hint">Supports JPG, PNG, WEBP, GIF, SVG (Max 10MB)</div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
      </div>

      <!-- URL Pane -->
      <div v-show="activeTab === 'url'">
        <div class="ue-form-group">
          <label class="ue-form-label" for="vue3-image-url">Image URL</label>
          <input
            id="vue3-image-url"
            v-model="urlInput"
            type="url"
            class="ue-input"
            placeholder="https://example.com/photo.jpg"
            @input="handleUrlInput"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="isUploading" class="ue-progress-container">
        <div class="ue-progress-bar">
          <div class="ue-progress-fill" :style="{ width: `${uploadPercent}%` }" />
        </div>
        <div class="ue-progress-label">
          <span>Uploading...</span>
          <span>{{ uploadPercent }}%</span>
        </div>
      </div>

      <!-- Preview Image -->
      <div v-if="previewUrl" style="margin: 14px 0; text-align: center">
        <img
          :src="previewUrl"
          style="
            max-height: 180px;
            max-width: 100%;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          "
        />
      </div>

      <!-- Width & Alignment Controls -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px">
        <div class="ue-form-group">
          <label class="ue-form-label">Width</label>
          <select v-model="widthInput" class="ue-input">
            <option value="100%">100% (Full Width)</option>
            <option value="75%">75% Width</option>
            <option value="50%">50% Width</option>
            <option value="25%">25% Width</option>
          </select>
        </div>
        <div class="ue-form-group">
          <label class="ue-form-label">Alignment</label>
          <select v-model="alignInput" class="ue-input">
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="vue3-image-alt">Alt Text</label>
        <input
          id="vue3-image-alt"
          v-model="altInput"
          type="text"
          class="ue-input"
          placeholder="Accessibility description"
        />
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="vue3-image-caption">Caption</label>
        <input
          id="vue3-image-caption"
          v-model="captionInput"
          type="text"
          class="ue-input"
          placeholder="Optional image caption"
        />
      </div>

      <div v-if="errorMessage" style="color: #f87171; font-size: 12px; margin-top: 6px">
        {{ errorMessage }}
      </div>

      <div class="ue-dialog-actions">
        <button type="button" class="ue-btn ue-btn-secondary" @click="close">Cancel</button>
        <button
          type="button"
          class="ue-btn ue-btn-primary"
          :disabled="isUploading"
          @click="handleApply"
        >
          Insert Image
        </button>
      </div>
    </div>
  </div>
</template>
