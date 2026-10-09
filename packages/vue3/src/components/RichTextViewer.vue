<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { renderViewerHTML } from '@universal-editor/core';
import type { SanitizerConfig } from '@universal-editor/core';

const props = withDefaults(
  defineProps<{
    content: string | Record<string, any>;
    darkMode?: boolean;
    theme?: 'dark' | 'light' | 'auto';
    sanitize?: boolean;
    sanitizerConfig?: SanitizerConfig;
    enableCopyCode?: boolean;
    enableImageLightbox?: boolean;
    responsiveEmbeds?: boolean;
    printOptimized?: boolean;
    wrapperClass?: string;
  }>(),
  {
    content: '',
    darkMode: false,
    theme: 'auto',
    sanitize: true,
    enableCopyCode: true,
    enableImageLightbox: true,
    responsiveEmbeds: true,
    printOptimized: true,
    wrapperClass: '',
  }
);

const emit = defineEmits<{
  (e: 'link-click', payload: { href: string; target?: string; event: MouseEvent }): void;
  (e: 'image-click', payload: { src: string; alt?: string; title?: string; event: MouseEvent }): void;
  (e: 'copy-code', payload: { code: string; language?: string }): void;
}>();

// Lightbox modal state
const lightbox = ref<{
  open: boolean;
  src: string;
  alt?: string;
  caption?: string;
}>({
  open: false,
  src: '',
});

// Rendered HTML computation
const renderedHtml = computed(() => {
  return renderViewerHTML(props.content, {
    sanitize: props.sanitize,
    sanitizerConfig: props.sanitizerConfig,
    enableCopyCode: props.enableCopyCode,
    responsiveEmbeds: props.responsiveEmbeds,
  });
});

// Theme class computation
const themeClass = computed(() => {
  if (props.darkMode || props.theme === 'dark') {
    return 'ue-viewer-dark';
  }
  if (props.theme === 'light') {
    return 'ue-viewer-light';
  }
  return 'ue-viewer-auto';
});

// Click delegation on viewer surface
function handleViewerClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  // 1. Code copy button click
  const copyBtn = target.closest<HTMLButtonElement>('.ue-code-copy-btn, [data-action="copy-code"]');
  if (copyBtn) {
    event.preventDefault();
    event.stopPropagation();

    const block = copyBtn.closest<HTMLElement>('.ue-code-block-viewer') || copyBtn.closest<HTMLElement>('pre');
    const pre = block?.querySelector('pre') || (block?.tagName === 'PRE' ? block : null);
    const codeEl = pre?.querySelector('code') || pre;
    const text = codeEl?.textContent || '';
    const language = block?.getAttribute('data-language') || undefined;

    // Clipboard copy
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    // Toggle button visual state
    copyBtn.classList.add('copied');
    const labelSpan = copyBtn.querySelector('.ue-copy-text');
    const prevText = labelSpan ? labelSpan.textContent : copyBtn.textContent;
    if (labelSpan) {
      labelSpan.textContent = '✓ Copied!';
    } else {
      copyBtn.textContent = '✓ Copied!';
    }

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      if (labelSpan) {
        labelSpan.textContent = prevText || 'Copy';
      } else {
        copyBtn.textContent = prevText || 'Copy';
      }
    }, 2000);

    emit('copy-code', { code: text, language });
    return;
  }

  // 2. Image click (lightbox)
  if (target.tagName === 'IMG') {
    const img = target as HTMLImageElement;
    const figure = img.closest('figure');
    const captionEl = figure?.querySelector('figcaption');
    const captionText = captionEl?.textContent || img.title || img.alt || '';

    emit('image-click', {
      src: img.src,
      alt: img.alt,
      title: img.title,
      event,
    });

    if (props.enableImageLightbox !== false) {
      lightbox.value = {
        open: true,
        src: img.src,
        alt: img.alt,
        caption: captionText,
      };
    }
    return;
  }

  // 3. Link click
  const link = target.closest<HTMLAnchorElement>('a[href]');
  if (link) {
    emit('link-click', {
      href: link.getAttribute('href') || link.href,
      target: link.getAttribute('target') || undefined,
      event,
    });
  }
}

function closeLightbox() {
  lightbox.value.open = false;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && lightbox.value.open) {
    closeLightbox();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown);
  }
});

// Exposed methods
function print() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

defineExpose({
  print,
  closeLightbox,
  renderedHtml,
});
</script>

<template>
  <div class="ue-viewer-wrapper" :class="[themeClass, wrapperClass]">
    <article
      class="ue-viewer prose-content"
      :class="[themeClass]"
      v-html="renderedHtml"
      @click="handleViewerClick"
    />

    <!-- Image Lightbox Modal -->
    <Teleport to="body">
      <div
        v-if="lightbox.open"
        class="ue-viewer-lightbox"
        @click.self="closeLightbox"
      >
        <div class="ue-viewer-lightbox-content">
          <button
            type="button"
            class="ue-viewer-lightbox-close"
            title="Close image preview (Esc)"
            @click="closeLightbox"
          >
            &times;
          </button>
          <img
            :src="lightbox.src"
            :alt="lightbox.alt || 'Full-size preview'"
            class="ue-viewer-lightbox-img"
          />
          <div v-if="lightbox.caption" class="ue-viewer-lightbox-caption">
            {{ lightbox.caption }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ue-viewer-wrapper {
  position: relative;
  width: 100%;
}
</style>
