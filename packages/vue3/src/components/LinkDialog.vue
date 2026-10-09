<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { icons } from '@universal-editor/core';

const props = defineProps<{
  modelValue: boolean;
  initialHref?: string;
  initialTarget?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'apply', payload: { href: string; target?: string }): void;
  (e: 'remove'): void;
}>();

const urlInput = ref('');
const openInNewTab = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      urlInput.value = props.initialHref || '';
      openInNewTab.value = props.initialTarget === '_blank';
      nextTick(() => {
        inputEl.value?.focus();
        inputEl.value?.select();
      });
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

function handleApply() {
  const href = urlInput.value.trim();
  if (href) {
    emit('apply', {
      href,
      target: openInNewTab.value ? '_blank' : undefined,
    });
  } else {
    emit('remove');
  }
  close();
}

function handleRemove() {
  emit('remove');
  close();
}

function handleOpenExternal() {
  if (urlInput.value) {
    window.open(urlInput.value, '_blank', 'noopener,noreferrer');
  }
}
</script>

<template>
  <div class="ue-dialog-overlay" :class="{ 'is-open': modelValue }" @click.self="close">
    <div class="ue-dialog">
      <div class="ue-dialog-title">
        <span v-html="icons.link" />
        <span>Insert / Edit Link</span>
      </div>

      <form @submit.prevent="handleApply">
        <div class="ue-form-group">
          <label class="ue-form-label" for="vue3-link-url">URL</label>
          <input
            id="vue3-link-url"
            ref="inputEl"
            v-model="urlInput"
            type="url"
            class="ue-input"
            placeholder="https://example.com"
            required
          />
        </div>

        <div class="ue-form-group">
          <label class="ue-checkbox-label">
            <input v-model="openInNewTab" type="checkbox" />
            <span>Open in new tab</span>
          </label>
        </div>

        <div class="ue-dialog-actions">
          <button
            v-if="initialHref"
            type="button"
            class="ue-btn ue-btn-danger"
            @click="handleRemove"
          >
            Remove
          </button>
          <button
            v-if="initialHref"
            type="button"
            class="ue-btn ue-btn-secondary"
            title="Open link in browser"
            @click="handleOpenExternal"
            v-html="icons.externalLink"
          />
          <button type="button" class="ue-btn ue-btn-secondary" @click="close">Cancel</button>
          <button type="submit" class="ue-btn ue-btn-primary">Apply</button>
        </div>
      </form>
    </div>
  </div>
</template>
