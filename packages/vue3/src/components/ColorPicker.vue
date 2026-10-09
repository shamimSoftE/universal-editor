<script setup lang="ts">
import { ref } from 'vue';
import { icons } from '@universal-editor/core';

const props = withDefaults(
  defineProps<{
    name: 'color' | 'highlight';
    title: string;
    activeColor?: string;
    isActive?: boolean;
  }>(),
  {
    activeColor: '',
    isActive: false,
  }
);

const emit = defineEmits<{
  (e: 'select', color: string): void;
  (e: 'clear'): void;
}>();

const isOpen = ref(false);
const customColor = ref('#3b82f6');

const presetColors = [
  '#000000', '#1f2937', '#4b5563', '#9ca3af',
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#ffffff', 'transparent',
];

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectColor(color: string) {
  emit('select', color);
  isOpen.value = false;
}

function clearColor() {
  emit('clear');
  isOpen.value = false;
}
</script>

<template>
  <div class="ue-dropdown ue-color-picker" :class="{ 'is-open': isOpen }">
    <button
      type="button"
      class="ue-toolbar-btn ue-color-btn"
      :class="{ 'is-active': isActive }"
      :title="title"
      @click.stop="toggle"
    >
      <span class="ue-btn-icon" v-html="name === 'highlight' ? icons.highlight : icons.color" />
      <span
        class="ue-color-indicator"
        :style="{ backgroundColor: activeColor || (name === 'highlight' ? '#fef08a' : '#3b82f6') }"
      />
      <span class="chevron" v-html="icons.chevronDown" />
    </button>

    <div v-if="isOpen" class="ue-dropdown-menu ue-color-menu" @click.stop>
      <div class="ue-color-grid">
        <button
          v-for="c in presetColors"
          :key="c"
          type="button"
          class="ue-color-swatch"
          :style="{ backgroundColor: c }"
          :title="c"
          @click="selectColor(c)"
        />
      </div>

      <div class="ue-color-footer">
        <label class="ue-custom-color-label">
          Custom:
          <input
            v-model="customColor"
            type="color"
            class="ue-custom-color-input"
            @change="selectColor(customColor)"
          />
        </label>
        <button type="button" class="ue-color-clear-btn" @click="clearColor">
          Reset
        </button>
      </div>
    </div>
  </div>
</template>
