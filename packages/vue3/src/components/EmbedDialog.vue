<script setup lang="ts">
import { ref } from 'vue';
import { icons, detectEmbedProvider } from '@universal-editor/core';
import type { UniversalEditor, EmbedProvider } from '@universal-editor/core';

const props = defineProps<{
  modelValue: boolean;
  editor?: UniversalEditor | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'insert', payload: { url: string; width?: string; alignment?: 'left' | 'center' | 'right' }): void;
}>();

const urlInput = ref('');
const widthInput = ref('100%');
const alignInput = ref<'left' | 'center' | 'right'>('center');
const detectedProvider = ref<EmbedProvider | null>(null);
const detectedTitle = ref('');
const errorMsg = ref('');

function close() {
  emit('update:modelValue', false);
  errorMsg.value = '';
}

function handleUrlInput() {
  const raw = urlInput.value.trim();
  if (!raw) {
    detectedProvider.value = null;
    detectedTitle.value = '';
    errorMsg.value = '';
    return;
  }

  const detected = detectEmbedProvider(raw);
  if (!detected.valid) {
    detectedProvider.value = null;
    detectedTitle.value = '';
    errorMsg.value = detected.error || 'Invalid or untrusted embed URL';
    return;
  }

  errorMsg.value = '';
  detectedProvider.value = detected.provider;
  detectedTitle.value = detected.title || detected.provider;
}

function getProviderIcon(provider: EmbedProvider) {
  if (provider === 'youtube') return icons.youtube;
  if (provider === 'vimeo') return icons.vimeo;
  if (provider === 'google-maps') return icons.map;
  if (provider === 'video') return icons.video;
  return icons.embed;
}

function submit() {
  const raw = urlInput.value.trim();
  if (!raw) {
    errorMsg.value = 'Please enter an embed URL';
    return;
  }

  const detected = detectEmbedProvider(raw);
  if (!detected.valid) {
    errorMsg.value = detected.error || 'Invalid embed URL';
    return;
  }

  if (props.editor) {
    props.editor.insertEmbed({
      url: raw,
      width: widthInput.value,
      alignment: alignInput.value,
      title: detected.title,
    });
  }

  emit('insert', {
    url: raw,
    width: widthInput.value,
    alignment: alignInput.value,
  });

  close();
}
</script>

<template>
  <div v-if="modelValue" class="ue-dialog-overlay active" @click.self="close">
    <div class="ue-dialog ue-embed-dialog">
      <div class="ue-dialog-title">
        <span v-html="icons.embed" />
        <span>Insert Media Embed</span>
      </div>

      <div class="ue-form-group">
        <label class="ue-form-label" for="vueEmbedUrlInput">Media or Embed URL</label>
        <input
          id="vueEmbedUrlInput"
          v-model="urlInput"
          type="url"
          class="ue-input"
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          @input="handleUrlInput"
          @keydown.enter="submit"
        />

        <!-- Live Provider Detection Badge -->
        <div v-if="detectedProvider" class="ue-embed-detection-badge valid">
          <span class="ue-badge-icon" v-html="getProviderIcon(detectedProvider)" />
          <span>Detected: <strong>{{ detectedTitle }}</strong></span>
        </div>

        <!-- Error message -->
        <div v-if="errorMsg" class="ue-dialog-error">
          {{ errorMsg }}
        </div>

        <div class="ue-embed-hints">
          Supports YouTube, Vimeo, Google Maps, direct HTML5 video (.mp4), and whitelisted iframes.
        </div>
      </div>

      <!-- Controls Row: Width & Alignment -->
      <div class="ue-embed-controls-row">
        <div class="ue-form-group">
          <label class="ue-form-label" for="vueEmbedWidth">Width</label>
          <select id="vueEmbedWidth" v-model="widthInput" class="ue-select">
            <option value="100%">100% (Responsive)</option>
            <option value="85%">85%</option>
            <option value="70%">70%</option>
            <option value="550px">550px (Fixed)</option>
          </select>
        </div>

        <div class="ue-form-group">
          <label class="ue-form-label" for="vueEmbedAlign">Alignment</label>
          <select id="vueEmbedAlign" v-model="alignInput" class="ue-select">
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="ue-dialog-actions">
        <button type="button" class="ue-btn ue-btn-secondary" @click="close">
          Cancel
        </button>
        <button type="button" class="ue-btn ue-btn-primary" @click="submit">
          Insert Embed
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ue-embed-dialog {
  max-width: 460px;
}

.ue-embed-hints {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 6px;
  line-height: 1.4;
}

.ue-embed-controls-row {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.ue-embed-controls-row .ue-form-group {
  flex: 1;
  margin-bottom: 0;
}

.ue-embed-detection-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.ue-embed-detection-badge .ue-badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ue-dialog-error {
  color: #f87171;
  font-size: 12px;
  margin-top: 6px;
}
</style>
