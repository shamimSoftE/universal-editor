<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    characterCount: number;
    wordCount: number;
    charactersExcludingSpaces?: number;
    paragraphCount?: number;
    readingTime?: string;
    characterLimit?: number;
    wordLimit?: number;
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCharactersNoSpaces?: boolean;
    showParagraphCount?: boolean;
    showReadingTime?: boolean;
  }>(),
  {
    showWordCount: true,
    showCharacterCount: true,
    showCharactersNoSpaces: false,
    showParagraphCount: false,
    showReadingTime: false,
  }
);

const isCharLimitApproaching = computed(() => {
  if (!props.characterLimit) return false;
  return props.characterCount >= props.characterLimit * 0.9 && props.characterCount <= props.characterLimit;
});

const isCharLimitExceeded = computed(() => {
  if (!props.characterLimit) return false;
  return props.characterCount > props.characterLimit;
});

const charPercentage = computed(() => {
  if (!props.characterLimit || props.characterLimit <= 0) return 0;
  return Math.min(100, Math.round((props.characterCount / props.characterLimit) * 100));
});

const isWordLimitApproaching = computed(() => {
  if (!props.wordLimit) return false;
  return props.wordCount >= props.wordLimit * 0.9 && props.wordCount <= props.wordLimit;
});

const isWordLimitExceeded = computed(() => {
  if (!props.wordLimit) return false;
  return props.wordCount > props.wordLimit;
});

const wordPercentage = computed(() => {
  if (!props.wordLimit || props.wordLimit <= 0) return 0;
  return Math.min(100, Math.round((props.wordCount / props.wordLimit) * 100));
});
</script>

<template>
  <div class="ue-footer ue-editor-footer">
    <div class="ue-footer-status">
      <slot name="status" />
    </div>

    <div class="ue-footer-stats">
      <slot name="stats">
        <!-- Word Count -->
        <span
          v-if="showWordCount"
          class="ue-stat-item ue-stat-words"
          :class="{
            'is-warning': isWordLimitApproaching,
            'is-danger': isWordLimitExceeded,
            'ue-stat-warning': isWordLimitApproaching,
            'ue-stat-danger': isWordLimitExceeded,
          }"
          :title="wordLimit ? `Words: ${wordCount} / ${wordLimit} (${wordPercentage}%)` : `Words: ${wordCount}`"
        >
          <span class="ue-stat-value">{{ wordCount }} {{ wordCount === 1 ? 'word' : 'words' }}</span>
          <span v-if="wordLimit" class="ue-stat-limit"> / {{ wordLimit }}</span>
        </span>

        <span v-if="showWordCount && (showCharacterCount || showCharactersNoSpaces || showParagraphCount || showReadingTime)" class="ue-stat-divider">•</span>

        <!-- Character Count -->
        <span
          v-if="showCharacterCount"
          class="ue-stat-item ue-stat-characters"
          :class="{
            'is-warning': isCharLimitApproaching,
            'is-danger': isCharLimitExceeded,
            'ue-stat-warning': isCharLimitApproaching,
            'ue-stat-danger': isCharLimitExceeded,
          }"
          :title="characterLimit ? `Characters: ${characterCount} / ${characterLimit} (${charPercentage}%)` : `Characters: ${characterCount}`"
        >
          <span class="ue-stat-value">{{ characterCount }} {{ characterCount === 1 ? 'character' : 'characters' }}</span>
          <span v-if="characterLimit" class="ue-stat-limit"> / {{ characterLimit }}</span>
        </span>

        <!-- Characters Excluding Spaces -->
        <template v-if="showCharactersNoSpaces && charactersExcludingSpaces !== undefined">
          <span class="ue-stat-divider">•</span>
          <span class="ue-stat-item ue-stat-no-spaces ue-stat-characters-no-spaces" title="Characters excluding whitespace">
            <span class="ue-stat-label">No spaces:</span>
            <span class="ue-stat-value">{{ charactersExcludingSpaces }}</span>
          </span>
        </template>

        <!-- Paragraphs -->
        <template v-if="showParagraphCount && paragraphCount !== undefined">
          <span class="ue-stat-divider">•</span>
          <span class="ue-stat-item ue-stat-paragraphs" title="Paragraphs and block nodes">
            <span class="ue-stat-label">Paragraphs:</span>
            <span class="ue-stat-value">{{ paragraphCount }}</span>
          </span>
        </template>

        <!-- Reading Time -->
        <template v-if="showReadingTime && readingTime">
          <span class="ue-stat-divider">•</span>
          <span class="ue-stat-item ue-stat-reading-time" title="Estimated reading time">
            <span class="ue-stat-value">{{ readingTime }}</span>
          </span>
        </template>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.ue-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--ue-toolbar-bg, #1f2937);
  border-top: 1px solid var(--ue-toolbar-border, rgba(255, 255, 255, 0.08));
  border-bottom-left-radius: var(--ue-radius, 8px);
  border-bottom-right-radius: var(--ue-radius, 8px);
  font-size: 12px;
  color: var(--ue-btn-color, #9ca3af);
  user-select: none;
}

.ue-footer-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.ue-stat-divider {
  opacity: 0.35;
}

.ue-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.ue-stat-label {
  opacity: 0.75;
}

.ue-stat-value {
  font-weight: 600;
  color: #e5e7eb;
}

.ue-stat-limit {
  opacity: 0.6;
}

.ue-stat-item.is-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.ue-stat-item.is-warning .ue-stat-value {
  color: #fbbf24;
}

.ue-stat-item.is-danger {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  font-weight: 600;
}

.ue-stat-item.is-danger .ue-stat-value {
  color: #f87171;
}
</style>
