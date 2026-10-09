<script setup lang="ts">
import { ref, shallowRef, markRaw, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  createEditor,
  UniversalEditor,
  ToolbarConfig,
  FocusPosition,
  UploaderOptions,
  UploaderInterface,
  ImageAttributes,
  FileAttachmentAttributes,
  InsertTableOptions,
  CodeBlockOptions,
  SlashCommandsConfig,
  SlashCommandItem,
  MentionConfig,
  MentionUser,
  AutosaveConfig,
  AutosaveStatus,
  DraftData,
  EditorStatistics,
  StatisticsConfig,
  LimitEventPayload,
  EditorTheme,
  EditorThemeTokens,
  AccessibilityConfig,
  MobileConfig,
  Announcer,
  MobileManager,
} from '@universal-editor/core';
import '@universal-editor/core/styles.css';

import EditorToolbar from './EditorToolbar.vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarDropdown from './ToolbarDropdown.vue';
import LinkDialog from './LinkDialog.vue';
import ImageDialog from './ImageDialog.vue';
import FileDialog from './FileDialog.vue';
import TableDialog from './TableDialog.vue';
import EmbedDialog from './EmbedDialog.vue';
import BubbleMenu from './BubbleMenu.vue';
import EditorFooter from './EditorFooter.vue';

export interface RichTextEditorProps {
  modelValue?: string | Record<string, any>;
  content?: string | Record<string, any>;
  placeholder?: string;
  editable?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  minHeight?: string | number;
  maxHeight?: string | number;
  toolbar?: boolean | ToolbarConfig;
  bubbleMenu?: boolean;
  outputFormat?: 'html' | 'json' | 'text';
  autofocus?: FocusPosition;
  characterLimit?: number;
  maxCharacters?: number;
  wordLimit?: number;
  maxWords?: number;
  hardLimit?: boolean;
  blockOnLimit?: boolean;
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  showCharactersNoSpaces?: boolean;
  showParagraphCount?: boolean;
  showReadingTime?: boolean;
  statistics?: boolean | StatisticsConfig;
  darkMode?: boolean;
  uploader?: UploaderOptions | UploaderInterface;
  slashCommands?: boolean | SlashCommandsConfig;
  mentions?: boolean | MentionConfig;
  autosave?: boolean | AutosaveConfig;
  theme?: string | EditorTheme;
  customTokens?: Partial<EditorThemeTokens>;
  accessibility?: boolean | AccessibilityConfig;
  mobile?: boolean | MobileConfig;
}

const props = withDefaults(defineProps<RichTextEditorProps>(), {
  modelValue: '',
  content: '',
  placeholder: 'Type your content here...',
  editable: true,
  readonly: false,
  disabled: false,
  minHeight: '280px',
  toolbar: true,
  bubbleMenu: true,
  outputFormat: 'html',
  autofocus: false,
  darkMode: false,
  slashCommands: true,
  mentions: true,
  autosave: true,
  theme: 'dark',
  showCharacterCount: true,
  showWordCount: true,
  showCharactersNoSpaces: false,
  showParagraphCount: false,
  showReadingTime: false,
  hardLimit: false,
  accessibility: true,
  mobile: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
  (e: 'focus', payload: { event: FocusEvent; editor: UniversalEditor }): void;
  (e: 'blur', payload: { event: FocusEvent; editor: UniversalEditor }): void;
  (e: 'ready', payload: { editor: UniversalEditor }): void;
  (e: 'imageUpload', file: File): void;
  (e: 'fileUpload', file: File): void;
  (e: 'slashCommand', item: any): void;
  (e: 'mention', user: MentionUser): void;
  (e: 'autosave:status', payload: { status: AutosaveStatus; lastSavedTime: Date | null; formattedTime?: string }): void;
  (e: 'autosave:saved', payload: { draft: DraftData; manual: boolean }): void;
  (e: 'autosave:error', payload: { error: any }): void;
  (e: 'autosave:restored', payload: { draft: DraftData }): void;
  (e: 'statistics:update', stats: EditorStatistics): void;
  (e: 'limit:warning', payload: LimitEventPayload): void;
  (e: 'limit:exceeded', payload: LimitEventPayload): void;
  (e: 'themeChange', theme: EditorTheme): void;
  (e: 'error', error: any): void;
}>();

const rootCardRef = ref<HTMLElement | null>(null);
const editorSurfaceRef = ref<HTMLElement | null>(null);
const editor = shallowRef<UniversalEditor | null>(null);

const isLinkDialogOpen = ref(false);
const isImageDialogOpen = ref(false);
const isFileDialogOpen = ref(false);
const isTableDialogOpen = ref(false);
const isEmbedDialogOpen = ref(false);

const currentLinkHref = ref('');
const currentLinkTarget = ref('');

const charCount = ref(0);
const wordCount = ref(0);
const charactersExcludingSpaces = ref(0);
const paragraphCount = ref(1);
const readingTimeString = ref('< 1 min read');

const autosaveStatus = ref<AutosaveStatus>('saved');
const autosaveTime = ref<string>('');
const detectedDraft = ref<DraftData | null>(null);

const autosaveStatusLabel = computed(() => {
  if (autosaveStatus.value === 'saving') return 'Saving...';
  if (autosaveStatus.value === 'unsaved') return 'Unsaved changes';
  if (autosaveStatus.value === 'error') return 'Save failed';
  return autosaveTime.value ? `Saved ${autosaveTime.value}` : 'Saved';
});

function restoreDetectedDraft() {
  if (detectedDraft.value && editor.value) {
    editor.value.restoreDraft(detectedDraft.value);
    detectedDraft.value = null;
  }
}

function discardDetectedDraft() {
  if (editor.value) {
    editor.value.clearDraft();
  }
  detectedDraft.value = null;
}

const isCurrentlyEditable = computed(() => {
  return props.editable && !props.readonly && !props.disabled;
});

const contentStyles = computed(() => {
  const minH = typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight;
  const maxH = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return {
    minHeight: minH,
    maxHeight: maxH,
    overflowY: maxH ? 'auto' : undefined,
  };
});

const toolbarConfig = computed<ToolbarConfig | undefined>(() => {
  if (Array.isArray(props.toolbar)) {
    return props.toolbar;
  }
  return undefined;
});

function getFormattedOutput(ed: UniversalEditor) {
  if (props.outputFormat === 'json') {
    return ed.getJSON();
  }
  if (props.outputFormat === 'text') {
    return ed.getText();
  }
  return ed.getHTML();
}

function updateStatistics(ed: UniversalEditor) {
  if (!ed || ed.isDestroyed) return;
  const stats = ed.getStatistics();
  charCount.value = stats.characters;
  wordCount.value = stats.words;
  charactersExcludingSpaces.value = stats.charactersExcludingSpaces;
  paragraphCount.value = stats.paragraphs;
  readingTimeString.value = stats.readingTimeString;
}

function openLinkDialog() {
  if (!editor.value) return;
  const attrs = editor.value.getLinkAttributes();
  currentLinkHref.value = attrs.href || '';
  currentLinkTarget.value = attrs.target || '';
  isLinkDialogOpen.value = true;
}

function handleLinkApply(payload: { href: string; target?: string }) {
  if (!editor.value) return;
  editor.value.setLink(payload);
}

function handleLinkRemove() {
  if (!editor.value) return;
  editor.value.unsetLink();
}

onMounted(() => {
  if (!editorSurfaceRef.value) return;

  try {
    const initialContent = props.modelValue || props.content || '';

    const instance = createEditor({
      element: editorSurfaceRef.value,
      content: initialContent,
      editable: isCurrentlyEditable.value,
      autofocus: props.autofocus,
      placeholder: props.placeholder,
      uploader: props.uploader,
      slashCommands: props.slashCommands,
      mentions: props.mentions,
      autosave: props.autosave,
      theme: props.theme,
      customTokens: props.customTokens,
      accessibility: props.accessibility,
      mobile: props.mobile,
      statistics:
        typeof props.statistics === 'object'
          ? props.statistics
          : {
              maxCharacters: props.maxCharacters ?? props.characterLimit,
              maxWords: props.maxWords ?? props.wordLimit,
              hardLimit: props.hardLimit ?? props.blockOnLimit ?? false,
            },
      onUpdate: () => {
        if (!instance || instance.isDestroyed) return;
        updateStatistics(instance);
        const output = getFormattedOutput(instance);
        emit('update:modelValue', output);
        emit('change', output);
      },
      onFocus: ({ event }) => {
        emit('focus', { event, editor: instance });
      },
      onBlur: ({ event }) => {
        emit('blur', { event, editor: instance });
      },
    });

    instance.on('imageUpload', ({ file }: { file: File }) => emit('imageUpload', file));
    instance.on('fileUpload', ({ file }: { file: File }) => emit('fileUpload', file));
    instance.on('slash-command', ({ item }: { item: any }) => emit('slashCommand', item));
    instance.on('mention', ({ user }: { user: any }) => emit('mention', user));
    instance.on('autosave:status', ({ status, formattedTime }: any) => {
      autosaveStatus.value = status;
      if (formattedTime) autosaveTime.value = formattedTime;
      emit('autosave:status', { status, lastSavedTime: instance.getLastSavedTime(), formattedTime });
    });
    instance.on('autosave:saved', (payload: any) => emit('autosave:saved', payload));
    instance.on('autosave:error', (payload: any) => emit('autosave:error', payload));
    instance.on('autosave:restored', (payload: any) => {
      detectedDraft.value = null;
      emit('autosave:restored', payload);
    });
    instance.on('autosave:draft-detected', ({ draft }: any) => {
      detectedDraft.value = draft;
    });
    instance.on('statistics:update', (stats: EditorStatistics) => {
      charCount.value = stats.characters;
      wordCount.value = stats.words;
      charactersExcludingSpaces.value = stats.charactersExcludingSpaces;
      paragraphCount.value = stats.paragraphs;
      readingTimeString.value = stats.readingTimeString;
      emit('statistics:update', stats);
    });
    instance.on('limit:warning', (payload: LimitEventPayload) => emit('limit:warning', payload));
    instance.on('limit:exceeded', (payload: LimitEventPayload) => emit('limit:exceeded', payload));

    if (rootCardRef.value && instance.themeManager) {
      instance.themeManager.setTargetElement(rootCardRef.value);
    }
    instance.on('theme:change', (theme: EditorTheme) => emit('themeChange', theme));

    editor.value = markRaw(instance);
    updateStatistics(instance);
    emit('ready', { editor: instance });
  } catch (err) {
    emit('error', err);
  }
});

onBeforeUnmount(() => {
  if (editor.value && !editor.value.isDestroyed) {
    editor.value.destroy();
    editor.value = null;
  }
});

// Watch editable state changes
watch(isCurrentlyEditable, newVal => {
  if (editor.value && !editor.value.isDestroyed) {
    editor.value.setEditable(newVal);
  }
});

// Watch modelValue prop for external updates
watch(
  () => props.modelValue,
  newVal => {
    if (!editor.value || editor.value.isDestroyed) return;

    if (props.outputFormat === 'html') {
      const currentHTML = editor.value.getHTML();
      if (newVal !== currentHTML) {
        editor.value.setContent(newVal as string);
        updateStatistics(editor.value);
      }
    } else if (props.outputFormat === 'text') {
      const currentText = editor.value.getText();
      if (newVal !== currentText) {
        editor.value.setContent(newVal as string);
        updateStatistics(editor.value);
      }
    }
  }
);

// Watch limit props for dynamic updates
watch(
  () => [
    props.characterLimit,
    props.maxCharacters,
    props.wordLimit,
    props.maxWords,
    props.hardLimit,
    props.blockOnLimit,
  ],
  () => {
    if (editor.value && !editor.value.isDestroyed) {
      editor.value.setLimits({
        maxCharacters: props.maxCharacters ?? props.characterLimit,
        maxWords: props.maxWords ?? props.wordLimit,
        hardLimit: props.hardLimit ?? props.blockOnLimit,
      });
      updateStatistics(editor.value);
    }
  }
);

// Watch theme prop for dynamic updates
watch(
  () => props.theme,
  newTheme => {
    if (editor.value?.themeManager && newTheme) {
      editor.value.setTheme(newTheme);
    }
  }
);

// Watch customTokens prop for dynamic updates
watch(
  () => props.customTokens,
  newTokens => {
    if (editor.value?.themeManager && newTokens) {
      editor.value.setCustomTokens(newTokens);
    }
  },
  { deep: true }
);

// Expose public API methods
defineExpose({
  editor,
  themeManager: computed(() => editor.value?.themeManager),
  setTheme: (t: string | EditorTheme) => editor.value?.setTheme(t),
  getTheme: () => editor.value?.getTheme(),
  getThemes: () => editor.value?.getThemes() ?? [],
  setCustomTokens: (tokens: Partial<EditorThemeTokens>) => editor.value?.setCustomTokens(tokens),
  getHTML: () => editor.value?.getHTML() ?? '',
  getJSON: () => editor.value?.getJSON() ?? {},
  getText: () => editor.value?.getText() ?? '',
  setContent: (content: string | Record<string, any>) => editor.value?.setContent(content),
  clearContent: () => editor.value?.clearContent(),
  focus: (pos?: FocusPosition) => editor.value?.focus(pos),
  blur: () => editor.value?.blur(),
  insertImage: (attrs: ImageAttributes) => editor.value?.insertImage(attrs),
  insertFile: (attrs: FileAttachmentAttributes) => editor.value?.insertFile(attrs),
  uploadAndInsertImage: (file: File) => editor.value?.uploadAndInsertImage(file),
  uploadAndInsertFile: (file: File) => editor.value?.uploadAndInsertFile(file),
  insertTable: (options?: InsertTableOptions) => editor.value?.insertTable(options),
  toggleCodeBlock: (options?: CodeBlockOptions) => editor.value?.toggleCodeBlock(options),
  setCodeBlock: (options?: CodeBlockOptions) => editor.value?.setCodeBlock(options),
  insertEmbed: (options: { url: string; width?: string; height?: string; alignment?: 'left' | 'center' | 'right'; title?: string }) => editor.value?.insertEmbed(options),
  getSlashCommands: () => editor.value?.getSlashCommands() ?? [],
  registerSlashCommand: (item: any) => editor.value?.registerSlashCommand(item),
  insertMention: (user: MentionUser) => editor.value?.insertMention(user),
  getMentions: () => editor.value?.getMentions() ?? [],
  saveDraft: (manual = true) => editor.value?.saveDraft(manual) ?? Promise.resolve(false),
  restoreDraft: (draft?: DraftData) => editor.value?.restoreDraft(draft) ?? false,
  getDraft: () => editor.value?.getDraft() ?? null,
  clearDraft: () => editor.value?.clearDraft() ?? false,
  getAutosaveStatus: () => editor.value?.getAutosaveStatus() ?? 'saved',
  getLastSavedTime: () => editor.value?.getLastSavedTime() ?? null,
  hasDraft: () => editor.value?.hasDraft() ?? false,
  getWordCount: () => editor.value?.getWordCount() ?? 0,
  getCharacterCount: (excludeSpaces?: boolean) => editor.value?.getCharacterCount(excludeSpaces) ?? 0,
  getParagraphCount: () => editor.value?.getParagraphCount() ?? 0,
  getStatistics: () => editor.value?.getStatistics() ?? null,
  setLimits: (limits: StatisticsConfig) => editor.value?.setLimits(limits),
  getAnnouncer: () => editor.value?.announcer,
  getMobileManager: () => editor.value?.mobileManager,
  announce: (message: string, options?: any) => editor.value?.announcer?.announce(message, options),
  getViewportState: () => editor.value?.mobileManager?.getState(),
});
</script>

<template>
  <div
    ref="rootCardRef"
    class="ue-editor-card"
    :class="{
      'ue-dark-mode': darkMode,
      'is-disabled': disabled,
      'is-readonly': readonly || !editable,
    }"
    role="region"
    aria-label="Rich Text Editor"
  >
    <!-- Toolbar -->
    <EditorToolbar
      v-if="toolbar !== false && editor"
      :editor="editor"
      :config="toolbarConfig"
      @open-link-dialog="openLinkDialog"
      @open-image-dialog="isImageDialogOpen = true"
      @open-file-dialog="isFileDialogOpen = true"
      @open-table-dialog="isTableDialogOpen = true"
      @open-embed-dialog="isEmbedDialogOpen = true"
    />

    <!-- Draft Detected Banner -->
    <div v-if="detectedDraft" class="ue-draft-prompt">
      <div class="ue-draft-prompt-inner">
        <span class="ue-draft-prompt-text">💡 Unsaved draft found from {{ new Date(detectedDraft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        <div class="ue-draft-prompt-actions">
          <button class="ue-draft-restore-btn" @click="restoreDetectedDraft">Restore Draft</button>
          <button class="ue-draft-discard-btn" @click="discardDetectedDraft">Discard</button>
        </div>
      </div>
    </div>

    <!-- Editor Surface Wrapper -->
    <div class="ue-surface-wrapper" :style="contentStyles">
      <div ref="editorSurfaceRef" class="ue-editor-content" />
    </div>

    <!-- Bubble Menu -->
    <BubbleMenu v-if="bubbleMenu && editor" :editor="editor" @open-link-dialog="openLinkDialog" />

    <!-- Link Dialog -->
    <LinkDialog
      v-model="isLinkDialogOpen"
      :initial-href="currentLinkHref"
      :initial-target="currentLinkTarget"
      @apply="handleLinkApply"
      @remove="handleLinkRemove"
    />

    <!-- Image Dialog -->
    <ImageDialog v-model="isImageDialogOpen" :editor="editor" />

    <!-- File Dialog -->
    <FileDialog v-model="isFileDialogOpen" :editor="editor" />

    <!-- Table Dialog -->
    <TableDialog v-model="isTableDialogOpen" :editor="editor" />

    <!-- Embed Dialog -->
    <EmbedDialog v-model="isEmbedDialogOpen" :editor="editor" />

    <!-- Footer with Word & Character statistics & Autosave Indicator -->
    <EditorFooter
      :character-count="charCount"
      :word-count="wordCount"
      :characters-excluding-spaces="charactersExcludingSpaces"
      :paragraph-count="paragraphCount"
      :reading-time="readingTimeString"
      :character-limit="characterLimit ?? maxCharacters"
      :word-limit="wordLimit ?? maxWords"
      :show-character-count="showCharacterCount"
      :show-word-count="showWordCount"
      :show-characters-no-spaces="showCharactersNoSpaces"
      :show-paragraph-count="showParagraphCount"
      :show-reading-time="showReadingTime"
    >
      <template #status>
        <div v-if="autosave" class="ue-autosave-container">
          <div :class="['ue-autosave-status', `ue-autosave-status-${autosaveStatus}`]">
            <span class="ue-autosave-icon">
              <svg v-if="autosaveStatus === 'saving'" class="ue-autosave-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
              <svg v-else-if="autosaveStatus === 'saved'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span v-else-if="autosaveStatus === 'unsaved'" class="ue-autosave-dot ue-autosave-dot-unsaved"></span>
              <svg v-else-if="autosaveStatus === 'error'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </span>
            <span class="ue-autosave-label">{{ autosaveStatusLabel }}</span>
            <button v-if="autosaveStatus === 'error'" class="ue-autosave-retry" @click="editor?.saveDraft(true)">Retry</button>
          </div>
        </div>
      </template>
    </EditorFooter>
  </div>
</template>

<style scoped>
.ue-editor-card {
  display: flex;
  flex-direction: column;
  background: var(--editor-bg, var(--ue-bg, #111827));
  color: var(--editor-text, #f9fafb);
  border: 1px solid var(--editor-border, var(--ue-toolbar-border, rgba(255, 255, 255, 0.08)));
  border-radius: var(--editor-radius, var(--ue-radius, 8px));
  font-family: var(--editor-font-family, inherit);
  font-size: var(--editor-font-size, 15px);
  overflow: hidden;
  box-shadow: var(--editor-shadow, 0 4px 20px rgba(0, 0, 0, 0.2));
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.ue-editor-card:focus-within {
  border-color: var(--editor-active-color, var(--ue-accent, #6366f1));
  box-shadow: 0 0 0 1px var(--editor-active-color, var(--ue-accent, #6366f1));
}

.ue-editor-card.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.ue-surface-wrapper {
  padding: 16px 20px;
  background: var(--editor-bg, rgba(3, 7, 18, 0.35));
  cursor: text;
}

.ue-editor-content {
  min-height: 100%;
  outline: none;
  color: var(--editor-text, #f9fafb);
}
</style>
