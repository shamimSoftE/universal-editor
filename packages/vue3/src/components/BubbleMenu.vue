<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { UniversalEditor } from '@universal-editor/core';
import { icons } from '@universal-editor/core';
import ToolbarButton from './ToolbarButton.vue';

const props = defineProps<{
  editor: UniversalEditor;
}>();

const emit = defineEmits<{
  (e: 'openLinkDialog'): void;
}>();

const isVisible = ref(false);
const posX = ref(0);
const posY = ref(0);
const menuEl = ref<HTMLElement | null>(null);

function updatePosition() {
  if (!props.editor || props.editor.isDestroyed) {
    isVisible.value = false;
    return;
  }

  const { state, view } = props.editor.tiptap;
  const { from, to, empty } = state.selection;

  if (empty || from === to || !view.hasFocus()) {
    isVisible.value = false;
    return;
  }

  try {
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    const left = (start.left + end.left) / 2;
    const top = Math.min(start.top, end.top) - 45;

    const menuWidth = menuEl.value ? menuEl.value.offsetWidth : 180;
    posX.value = Math.max(10, left - menuWidth / 2);
    posY.value = Math.max(10, top);
    isVisible.value = true;
  } catch {
    isVisible.value = false;
  }
}

function handleBlur() {
  isVisible.value = false;
}

onMounted(() => {
  props.editor.on('selectionUpdate', updatePosition);
  props.editor.on('blur', handleBlur);
});

onUnmounted(() => {
  props.editor.off('selectionUpdate', updatePosition);
  props.editor.off('blur', handleBlur);
});
</script>

<template>
  <div
    ref="menuEl"
    class="ue-bubble-menu"
    :class="{ 'is-visible': isVisible }"
    :style="{ left: `${posX}px`, top: `${posY}px` }"
  >
    <ToolbarButton
      name="bold"
      title="Bold (Ctrl+B)"
      :icon="icons.bold"
      :active="editor.isActive('bold')"
      @click="editor.toggleBold()"
    />
    <ToolbarButton
      name="italic"
      title="Italic (Ctrl+I)"
      :icon="icons.italic"
      :active="editor.isActive('italic')"
      @click="editor.toggleItalic()"
    />
    <ToolbarButton
      name="underline"
      title="Underline (Ctrl+U)"
      :icon="icons.underline"
      :active="editor.isActive('underline')"
      @click="editor.toggleUnderline()"
    />
    <ToolbarButton
      name="strike"
      title="Strike"
      :icon="icons.strike"
      :active="editor.isActive('strike')"
      @click="editor.toggleStrike()"
    />
    <ToolbarButton
      name="code"
      title="Inline Code"
      :icon="icons.code"
      :active="editor.isActive('code')"
      @click="editor.toggleCode()"
    />
    <ToolbarButton
      name="link"
      title="Link"
      :icon="icons.link"
      :active="editor.isActive('link')"
      @click="emit('openLinkDialog')"
    />
  </div>
</template>
