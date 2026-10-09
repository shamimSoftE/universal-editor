<script setup lang="ts">
import { ref } from 'vue';
import { icons, formatBytes } from '@universal-editor/core';
import type { UniversalEditor, FileAttachmentAttributes } from '@universal-editor/core';

const props = defineProps<{
  modelValue: boolean;
  editor?: UniversalEditor | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'insert', attrs: FileAttachmentAttributes): void;
}>();

const selectedFile = ref<File | null>(null);
const fileName = ref('');
const fileSize = ref('');
const isUploading = ref(false);
const uploadPercent = ref(0);
const errorMessage = ref('');
const isDragover = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

function close() {
  emit('update:modelValue', false);
  selectedFile.value = null;
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
    const val = props.editor.uploader.validate(file, false);
    if (!val.valid) {
      errorMessage.value = val.error || 'Invalid file';
      selectedFile.value = null;
      return;
    }
  }

  errorMessage.value = '';
  selectedFile.value = file;
  fileName.value = file.name;
  fileSize.value = formatBytes(file.size);
}

async function handleAttach() {
  if (!selectedFile.value || !props.editor) return;
  errorMessage.value = '';

  try {
    isUploading.value = true;
    uploadPercent.value = 0;

    const res = await props.editor.uploader.uploadFile(selectedFile.value, p => {
      uploadPercent.value = p;
    });

    props.editor.insertFile({
      url: res.url,
      name: res.name || selectedFile.value.name,
      size: res.size || selectedFile.value.size,
      type: res.type || selectedFile.value.type,
    });

    close();
  } catch (err: any) {
    errorMessage.value = err.message || 'File upload failed.';
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div class="ue-dialog-overlay" :class="{ 'is-open': modelValue }" @click.self="close">
    <div class="ue-dialog" style="max-width: 480px">
      <div class="ue-dialog-title">
        <span v-html="icons.file" />
        <span>Attach Document / File</span>
      </div>

      <div
        class="ue-dropzone"
        :class="{ 'is-dragover': isDragover }"
        @click="fileInputRef?.click()"
        @dragover.prevent="isDragover = true"
        @dragleave.prevent="isDragover = false"
        @drop.prevent="handleDrop"
      >
        <div class="ue-dropzone-icon" v-html="icons.upload" />
        <div class="ue-dropzone-text">Click or drag & drop document here</div>
        <div class="ue-dropzone-hint">Supports PDF, DOC, DOCX, XLS, XLSX, ZIP, CSV (Max 10MB)</div>
        <input ref="fileInputRef" type="file" style="display: none" @change="handleFileChange" />
      </div>

      <div
        v-if="selectedFile"
        style="
          margin: 14px 0;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
        "
      >
        <div style="font-weight: 600; font-size: 13px; color: #f8fafc">
          {{ fileName }}
        </div>
        <div style="font-size: 11px; color: #94a3b8">
          {{ fileSize }}
        </div>
      </div>

      <div v-if="isUploading" class="ue-progress-container">
        <div class="ue-progress-bar">
          <div class="ue-progress-fill" :style="{ width: `${uploadPercent}%` }" />
        </div>
        <div class="ue-progress-label">
          <span>Uploading attachment...</span>
          <span>{{ uploadPercent }}%</span>
        </div>
      </div>

      <div v-if="errorMessage" style="color: #f87171; font-size: 12px; margin-top: 6px">
        {{ errorMessage }}
      </div>

      <div class="ue-dialog-actions">
        <button type="button" class="ue-btn ue-btn-secondary" @click="close">Cancel</button>
        <button
          type="button"
          class="ue-btn ue-btn-primary"
          :disabled="!selectedFile || isUploading"
          @click="handleAttach"
        >
          Attach File
        </button>
      </div>
    </div>
  </div>
</template>
