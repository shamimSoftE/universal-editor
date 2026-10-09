<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type { EditorTheme, ThemeManager, UniversalEditor } from '@universal-editor/core';
import { DEFAULT_THEMES } from '@universal-editor/core';

export interface ThemeSwitcherProps {
  modelValue?: string;
  themeManager?: ThemeManager;
  editor?: UniversalEditor;
  themes?: EditorTheme[];
  layout?: 'dropdown' | 'pills' | 'compact';
  showModeToggle?: boolean;
}

const props = withDefaults(defineProps<ThemeSwitcherProps>(), {
  modelValue: 'dark',
  layout: 'dropdown',
  showModeToggle: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', themeId: string): void;
  (e: 'select', theme: EditorTheme): void;
}>();

const isOpen = ref(false);
const activeThemeId = ref<string>(props.modelValue);

// Resolve available themes
const availableThemes = computed<EditorTheme[]>(() => {
  if (props.themes && props.themes.length > 0) {
    return props.themes;
  }
  if (props.themeManager) {
    return props.themeManager.getThemes();
  }
  if (props.editor?.themeManager) {
    return props.editor.themeManager.getThemes();
  }
  return DEFAULT_THEMES;
});

// Resolve currently selected theme object
const currentTheme = computed<EditorTheme>(() => {
  const found = availableThemes.value.find((t) => t.id === activeThemeId.value);
  return found || availableThemes.value[0] || DEFAULT_THEMES[0];
});

// Check if current theme is dark mode
const isDark = computed(() => {
  return currentTheme.value?.mode === 'dark';
});

// Watch external modelValue changes
watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== activeThemeId.value) {
      activeThemeId.value = val;
    }
  }
);

// Apply theme on selection
function selectTheme(theme: EditorTheme) {
  activeThemeId.value = theme.id;
  emit('update:modelValue', theme.id);
  emit('select', theme);

  if (props.themeManager) {
    props.themeManager.applyTheme(theme);
  } else if (props.editor?.themeManager) {
    props.editor.themeManager.applyTheme(theme);
  }

  isOpen.value = false;
}

// Toggle between light and dark
function toggleMode() {
  const targetId = isDark.value ? 'light' : 'dark';
  const targetTheme = availableThemes.value.find((t) => t.id === targetId) ||
    (isDark.value ? DEFAULT_THEMES.find((t) => t.id === 'light') : DEFAULT_THEMES.find((t) => t.id === 'dark'));
  if (targetTheme) {
    selectTheme(targetTheme);
  }
}

// Close dropdown on click outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.ue-theme-switcher')) {
    isOpen.value = false;
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside);
  }
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div class="ue-theme-switcher" :class="[`layout-${layout}`, { 'is-open': isOpen }]">
    <!-- Quick Light/Dark Toggle Button -->
    <button
      v-if="showModeToggle && layout !== 'pills'"
      type="button"
      class="ue-theme-mode-btn"
      :title="isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
      @click="toggleMode"
    >
      <!-- Sun icon for light mode -->
      <svg
        v-if="isDark"
        class="ue-theme-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <!-- Moon icon for dark mode -->
      <svg
        v-else
        class="ue-theme-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>

    <!-- Pills Layout -->
    <div v-if="layout === 'pills'" class="ue-theme-pills">
      <button
        v-for="t in availableThemes"
        :key="t.id"
        type="button"
        class="ue-theme-pill"
        :class="{ 'is-active': t.id === activeThemeId }"
        @click="selectTheme(t)"
      >
        <span
          class="ue-theme-swatch"
          :style="{
            backgroundColor: t.tokens.editorBg || '#1e293b',
            borderColor: t.tokens.editorActiveColor || '#6366f1',
          }"
        >
          <span
            class="ue-swatch-dot"
            :style="{ backgroundColor: t.tokens.editorActiveColor || '#6366f1' }"
          />
        </span>
        <span class="ue-theme-name">{{ t.name }}</span>
      </button>
    </div>

    <!-- Dropdown Layout -->
    <div v-else class="ue-theme-dropdown-container">
      <button
        type="button"
        class="ue-theme-trigger"
        @click.stop="isOpen = !isOpen"
        :aria-expanded="isOpen"
      >
        <span
          class="ue-theme-swatch"
          :style="{
            backgroundColor: currentTheme.tokens.editorBg || '#1e293b',
            borderColor: currentTheme.tokens.editorActiveColor || '#6366f1',
          }"
        >
          <span
            class="ue-swatch-dot"
            :style="{ backgroundColor: currentTheme.tokens.editorActiveColor || '#6366f1' }"
          />
        </span>
        <span class="ue-theme-trigger-label">{{ currentTheme.name }}</span>
        <svg
          class="ue-theme-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      <div v-if="isOpen" class="ue-theme-menu">
        <div class="ue-theme-menu-header">Select Editor Theme</div>
        <div class="ue-theme-menu-list">
          <button
            v-for="t in availableThemes"
            :key="t.id"
            type="button"
            class="ue-theme-item"
            :class="{ 'is-active': t.id === activeThemeId }"
            @click="selectTheme(t)"
          >
            <div class="ue-theme-item-left">
              <span
                class="ue-theme-swatch"
                :style="{
                  backgroundColor: t.tokens.editorBg || '#1e293b',
                  borderColor: t.tokens.editorActiveColor || '#6366f1',
                }"
              >
                <span
                  class="ue-swatch-dot"
                  :style="{ backgroundColor: t.tokens.editorActiveColor || '#6366f1' }"
                />
              </span>
              <div class="ue-theme-info">
                <span class="ue-theme-title">{{ t.name }}</span>
                <span v-if="t.description" class="ue-theme-desc">{{ t.description }}</span>
              </div>
            </div>

            <div class="ue-theme-item-right">
              <span class="ue-theme-mode-badge" :class="t.mode">
                {{ t.mode }}
              </span>
              <svg
                v-if="t.id === activeThemeId"
                class="ue-check-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ue-theme-switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  font-family: inherit;
  font-size: 13px;
  user-select: none;
}

.ue-theme-mode-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ue-theme-mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.2);
}

.ue-theme-icon {
  width: 16px;
  height: 16px;
}

/* Pills Layout */
.ue-theme-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ue-theme-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.ue-theme-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.ue-theme-pill.is-active {
  background: rgba(99, 102, 241, 0.18);
  border-color: #6366f1;
  color: #a5b4fc;
  font-weight: 500;
}

/* Dropdown Container */
.ue-theme-dropdown-container {
  position: relative;
}

.ue-theme-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px 0 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ue-theme-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.ue-theme-trigger-label {
  font-size: 13px;
  font-weight: 500;
}

.ue-theme-chevron {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.ue-theme-switcher.is-open .ue-theme-chevron {
  transform: rotate(180deg);
}

/* Swatches */
.ue-theme-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.ue-swatch-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Menu */
.ue-theme-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 240px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  padding: 6px;
  z-index: 1000;
  backdrop-filter: blur(12px);
  animation: ueMenuFadeIn 0.15s ease-out;
}

@keyframes ueMenuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ue-theme-menu-header {
  padding: 6px 10px 4px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}

.ue-theme-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ue-theme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.ue-theme-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ue-theme-item.is-active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.ue-theme-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ue-theme-info {
  display: flex;
  flex-direction: column;
}

.ue-theme-title {
  font-size: 13px;
  font-weight: 500;
}

.ue-theme-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 1px;
}

.ue-theme-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ue-theme-mode-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
}

.ue-theme-mode-badge.dark {
  background: rgba(30, 41, 59, 0.8);
  color: #93c5fd;
}

.ue-theme-mode-badge.light {
  background: rgba(241, 245, 249, 0.15);
  color: #fbbf24;
}

.ue-check-icon {
  width: 14px;
  height: 14px;
  color: #6366f1;
}
</style>
