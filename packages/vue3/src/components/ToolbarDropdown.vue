<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { icons } from '@universal-editor/core';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
}

const props = defineProps<{
  name?: string;
  title: string;
  currentLabel: string;
  items: DropdownItem[];
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectItem(id: string) {
  emit('select', id);
  isOpen.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    ref="dropdownRef"
    class="ue-dropdown"
    :class="[name ? `ue-dropdown-${name}` : '', { 'is-open': isOpen }]"
    @keydown.esc="isOpen = false"
  >
    <button
      type="button"
      class="ue-toolbar-btn ue-dropdown-btn"
      :title="title"
      :aria-label="title"
      aria-haspopup="true"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click.stop="toggle"
    >
      <span>{{ currentLabel }}</span>
      <span class="chevron" v-html="icons.chevronDown" />
    </button>

    <div v-show="isOpen" class="ue-dropdown-menu" role="menu" :aria-label="title">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="ue-dropdown-item"
        :class="{ 'is-active': item.active }"
        role="menuitem"
        @click.stop="selectItem(item.id)"
      >
        <span v-if="item.icon" v-html="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>
