<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import type {
  UniversalEditor,
  ToolbarConfig,
  TextAlignment,
} from '@universal-editor/core';
import { icons, DEFAULT_TOOLBAR, ToolbarKeyboardNav } from '@universal-editor/core';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarDropdown from './ToolbarDropdown.vue';
import ColorPicker from './ColorPicker.vue';

const props = withDefaults(
  defineProps<{
    editor: UniversalEditor;
    config?: ToolbarConfig;
  }>(),
  {
    config: () => DEFAULT_TOOLBAR,
  }
);

const toolbarRef = ref<HTMLElement | null>(null);
let keyboardNav: ToolbarKeyboardNav | null = null;

onMounted(() => {
  if (toolbarRef.value) {
    keyboardNav = new ToolbarKeyboardNav(toolbarRef.value);
  }
});

onBeforeUnmount(() => {
  if (keyboardNav) {
    keyboardNav.destroy();
    keyboardNav = null;
  }
});

const emit = defineEmits<{
  (e: 'openLinkDialog'): void;
  (e: 'openImageDialog'): void;
  (e: 'openFileDialog'): void;
  (e: 'openTableDialog'): void;
  (e: 'openEmbedDialog'): void;
}>();

const currentHeadingLabel = computed(() => {
  for (let l = 1; l <= 6; l++) {
    if (props.editor.isActive('heading', { level: l })) {
      return `Heading ${l}`;
    }
  }
  return 'Paragraph';
});

const currentAlignLabel = computed(() => {
  if (props.editor.isActive({ textAlign: 'center' })) return 'Center';
  if (props.editor.isActive({ textAlign: 'right' })) return 'Right';
  if (props.editor.isActive({ textAlign: 'justify' })) return 'Justify';
  return 'Left';
});

const currentFontFamilyLabel = computed(() => {
  const font = props.editor.tiptap.getAttributes('textStyle').fontFamily;
  if (!font) return 'Font';
  if (font.includes('Kalpurush') || font.includes('Bengali')) return 'বাংলা';
  if (font.includes('Amiri') || font.includes('Arabic')) return 'العربية';
  if (font.includes('Devanagari')) return 'हिन्दी';
  if (font.includes('JetBrains') || font.includes('mono')) return 'Mono';
  if (font.includes('Merriweather') || font.includes('serif')) return 'Serif';
  return 'Sans';
});

const currentFontSizeLabel = computed(() => {
  return props.editor.tiptap.getAttributes('textStyle').fontSize || 'Size';
});

const currentLineHeightLabel = computed(() => {
  return (
    props.editor.tiptap.getAttributes('paragraph').lineHeight ||
    props.editor.tiptap.getAttributes('heading').lineHeight ||
    '1.5'
  );
});

const currentDirectionLabel = computed(() => {
  const dir =
    props.editor.tiptap.getAttributes('paragraph').dir ||
    props.editor.tiptap.getAttributes('heading').dir;
  return dir ? dir.toUpperCase() : 'LTR';
});

const headingItems = [
  { id: 'p', label: 'Paragraph', icon: icons.paragraph },
  { id: 'h1', label: 'Heading 1', icon: icons.h1 },
  { id: 'h2', label: 'Heading 2', icon: icons.h2 },
  { id: 'h3', label: 'Heading 3', icon: icons.h3 },
  { id: 'h4', label: 'Heading 4' },
  { id: 'h5', label: 'Heading 5' },
  { id: 'h6', label: 'Heading 6' },
];

const alignItems = [
  { id: 'left', label: 'Align Left', icon: icons.alignLeft },
  { id: 'center', label: 'Align Center', icon: icons.alignCenter },
  { id: 'right', label: 'Align Right', icon: icons.alignRight },
  { id: 'justify', label: 'Align Justify', icon: icons.alignJustify },
];

const fontFamilyItems = [
  { id: 'font-default', label: 'Default (Inter / Sans)' },
  { id: 'font-serif', label: 'Serif (Georgia)' },
  { id: 'font-mono', label: 'Monospace (JetBrains)' },
  { id: 'font-bangla', label: 'বাংলা (Kalpurush / Bengali)' },
  { id: 'font-arabic', label: 'العربية / اردو (Amiri / Arabic)' },
  { id: 'font-hindi', label: 'हिन्दी (Noto Sans Devanagari)' },
];

const fontSizeItems = [
  { id: '12px', label: '12px' },
  { id: '14px', label: '14px' },
  { id: '16px', label: '16px' },
  { id: '18px', label: '18px' },
  { id: '20px', label: '20px' },
  { id: '24px', label: '24px' },
  { id: '30px', label: '30px' },
  { id: '36px', label: '36px' },
  { id: 'reset', label: 'Reset Size' },
];

const lineHeightItems = [
  { id: '1.0', label: '1.0 (Single)' },
  { id: '1.25', label: '1.25 (Compact)' },
  { id: '1.5', label: '1.5 (Standard)' },
  { id: '1.75', label: '1.75 (Relaxed)' },
  { id: '2.0', label: '2.0 (Double)' },
  { id: 'reset', label: 'Reset Spacing' },
];

const directionItems = [
  { id: 'ltr', label: 'Left-to-Right (LTR)', icon: icons.ltr },
  { id: 'rtl', label: 'Right-to-Left (RTL)', icon: icons.rtl },
];

function handleHeadingSelect(id: string) {
  if (id === 'p') {
    props.editor.setParagraph();
  } else {
    const level = parseInt(id.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
    props.editor.toggleHeading(level);
  }
}

function handleAlignSelect(id: string) {
  props.editor.setTextAlign(id as TextAlignment);
}

function handleFontFamilySelect(id: string) {
  switch (id) {
    case 'font-serif':
      props.editor.setFontFamily('Merriweather, Georgia, serif');
      break;
    case 'font-mono':
      props.editor.setFontFamily("'JetBrains Mono', 'Fira Code', monospace");
      break;
    case 'font-bangla':
      props.editor.setFontFamily("'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', sans-serif");
      break;
    case 'font-arabic':
      props.editor.setFontFamily("'Amiri', 'Noto Naskh Arabic', serif");
      break;
    case 'font-hindi':
      props.editor.setFontFamily("'Noto Sans Devanagari', sans-serif");
      break;
    default:
      props.editor.unsetFontFamily();
      break;
  }
}

function handleFontSizeSelect(id: string) {
  if (id === 'reset') {
    props.editor.unsetFontSize();
  } else {
    props.editor.setFontSize(id);
  }
}

function handleLineHeightSelect(id: string) {
  if (id === 'reset') {
    props.editor.unsetLineHeight();
  } else {
    props.editor.setLineHeight(id);
  }
}

function handleDirectionSelect(id: string) {
  if (id === 'rtl') {
    props.editor.setRtl();
  } else {
    props.editor.setLtr();
  }
}
</script>

<template>
  <div ref="toolbarRef" class="ue-toolbar ue-toolbar-scrollable" role="toolbar" aria-label="Rich text formatting">
    <template v-for="(item, index) in config" :key="index">
      <!-- Divider -->
      <div v-if="item === '|'" class="ue-toolbar-divider" aria-hidden="true" />

      <!-- Headings Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'heading'"
        name="heading"
        title="Headings"
        :current-label="currentHeadingLabel"
        :items="
          headingItems.map(h => ({
            ...h,
            active:
              h.id === 'p'
                ? editor.isActive('paragraph')
                : editor.isActive('heading', { level: parseInt(h.id.replace('h', '')) }),
          }))
        "
        @select="handleHeadingSelect"
      />

      <!-- Font Family Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'fontFamily'"
        name="font-family"
        title="Font Family"
        :current-label="currentFontFamilyLabel"
        :items="
          fontFamilyItems.map(f => ({
            ...f,
            active:
              f.id === 'font-default'
                ? !editor.tiptap.getAttributes('textStyle').fontFamily
                : !!editor.tiptap.getAttributes('textStyle').fontFamily?.includes(f.id.replace('font-', '')),
          }))
        "
        @select="handleFontFamilySelect"
      />

      <!-- Font Size Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'fontSize'"
        name="font-size"
        title="Font Size"
        :current-label="currentFontSizeLabel"
        :items="
          fontSizeItems.map(s => ({
            ...s,
            active: editor.tiptap.getAttributes('textStyle').fontSize === s.id,
          }))
        "
        @select="handleFontSizeSelect"
      />

      <!-- Alignment Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'align'"
        name="align"
        title="Alignment"
        :current-label="currentAlignLabel"
        :items="
          alignItems.map(a => ({
            ...a,
            active: editor.isActive({ textAlign: a.id }),
          }))
        "
        @select="handleAlignSelect"
      />

      <!-- Bold -->
      <ToolbarButton
        v-else-if="item === 'bold'"
        name="bold"
        title="Bold (Ctrl+B)"
        :icon="icons.bold"
        :active="editor.isActive('bold')"
        @click="editor.toggleBold()"
      />

      <!-- Italic -->
      <ToolbarButton
        v-else-if="item === 'italic'"
        name="italic"
        title="Italic (Ctrl+I)"
        :icon="icons.italic"
        :active="editor.isActive('italic')"
        @click="editor.toggleItalic()"
      />

      <!-- Underline -->
      <ToolbarButton
        v-else-if="item === 'underline'"
        name="underline"
        title="Underline (Ctrl+U)"
        :icon="icons.underline"
        :active="editor.isActive('underline')"
        @click="editor.toggleUnderline()"
      />

      <!-- Strike -->
      <ToolbarButton
        v-else-if="item === 'strike'"
        name="strike"
        title="Strikethrough"
        :icon="icons.strike"
        :active="editor.isActive('strike')"
        @click="editor.toggleStrike()"
      />

      <!-- Text Color Picker -->
      <ColorPicker
        v-else-if="item === 'color'"
        name="color"
        title="Text Color"
        :active-color="editor.tiptap.getAttributes('textStyle').color"
        :is-active="!!editor.tiptap.getAttributes('textStyle').color"
        @select="color => editor.setColor(color)"
        @clear="editor.unsetColor()"
      />

      <!-- Highlight Picker -->
      <ColorPicker
        v-else-if="item === 'highlight'"
        name="highlight"
        title="Highlight Color"
        :active-color="editor.tiptap.getAttributes('highlight').color"
        :is-active="editor.isActive('highlight')"
        @select="color => editor.setHighlight(color)"
        @clear="editor.unsetHighlight()"
      />

      <!-- Subscript -->
      <ToolbarButton
        v-else-if="item === 'subscript'"
        name="subscript"
        title="Subscript (X₂)"
        :icon="icons.subscript"
        :active="editor.isActive('subscript')"
        @click="editor.toggleSubscript()"
      />

      <!-- Superscript -->
      <ToolbarButton
        v-else-if="item === 'superscript'"
        name="superscript"
        title="Superscript (X²)"
        :icon="icons.superscript"
        :active="editor.isActive('superscript')"
        @click="editor.toggleSuperscript()"
      />

      <!-- Inline Code -->
      <ToolbarButton
        v-else-if="item === 'code'"
        name="code"
        title="Inline Code"
        :icon="icons.code"
        :active="editor.isActive('code')"
        @click="editor.toggleCode()"
      />

      <!-- Code Block -->
      <ToolbarButton
        v-else-if="item === 'codeBlock'"
        name="codeBlock"
        title="Code Block"
        :icon="icons.codeBlock"
        :active="editor.isCodeBlockActive()"
        @click="editor.toggleCodeBlock()"
      />

      <!-- Line Height Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'lineHeight'"
        name="line-height"
        title="Line Spacing"
        :current-label="currentLineHeightLabel"
        :items="
          lineHeightItems.map(l => ({
            ...l,
            active: editor.tiptap.getAttributes('paragraph').lineHeight === l.id,
          }))
        "
        @select="handleLineHeightSelect"
      />

      <!-- Indent -->
      <ToolbarButton
        v-else-if="item === 'indent'"
        name="indent"
        title="Indent (Tab)"
        :icon="icons.indent"
        @click="editor.indent()"
      />

      <!-- Outdent -->
      <ToolbarButton
        v-else-if="item === 'outdent'"
        name="outdent"
        title="Outdent (Shift+Tab)"
        :icon="icons.outdent"
        @click="editor.outdent()"
      />

      <!-- Text Direction Dropdown -->
      <ToolbarDropdown
        v-else-if="item === 'textDirection'"
        name="text-direction"
        title="Text Direction"
        :current-label="currentDirectionLabel"
        :items="
          directionItems.map(d => ({
            ...d,
            active: (editor.tiptap.getAttributes('paragraph').dir || 'ltr') === d.id,
          }))
        "
        @select="handleDirectionSelect"
      />

      <!-- RTL Button -->
      <ToolbarButton
        v-else-if="item === 'rtl'"
        name="rtl"
        title="Right-to-Left (dir=&quot;rtl&quot;)"
        :icon="icons.rtl"
        :active="editor.tiptap.getAttributes('paragraph').dir === 'rtl'"
        @click="editor.setRtl()"
      />

      <!-- LTR Button -->
      <ToolbarButton
        v-else-if="item === 'ltr'"
        name="ltr"
        title="Left-to-Right (dir=&quot;ltr&quot;)"
        :icon="icons.ltr"
        :active="(editor.tiptap.getAttributes('paragraph').dir || 'ltr') === 'ltr'"
        @click="editor.setLtr()"
      />

      <!-- Bullet List -->
      <ToolbarButton
        v-else-if="item === 'bulletList'"
        name="bulletList"
        title="Bullet List"
        :icon="icons.bulletList"
        :active="editor.isActive('bulletList')"
        @click="editor.toggleBulletList()"
      />

      <!-- Ordered List -->
      <ToolbarButton
        v-else-if="item === 'orderedList'"
        name="orderedList"
        title="Numbered List"
        :icon="icons.orderedList"
        :active="editor.isActive('orderedList')"
        @click="editor.toggleOrderedList()"
      />

      <!-- Task List -->
      <ToolbarButton
        v-else-if="item === 'taskList'"
        name="taskList"
        title="Task List"
        :icon="icons.taskList"
        :active="editor.isActive('taskList')"
        @click="editor.toggleTaskList()"
      />

      <!-- Blockquote -->
      <ToolbarButton
        v-else-if="item === 'blockquote'"
        name="blockquote"
        title="Blockquote"
        :icon="icons.blockquote"
        :active="editor.isActive('blockquote')"
        @click="editor.toggleBlockquote()"
      />

      <!-- Horizontal Rule -->
      <ToolbarButton
        v-else-if="item === 'hr'"
        name="hr"
        title="Horizontal Rule"
        :icon="icons.hr"
        @click="editor.setHorizontalRule()"
      />

      <!-- Clear Formatting -->
      <ToolbarButton
        v-else-if="item === 'clearFormatting'"
        name="clearFormatting"
        title="Clear Formatting"
        :icon="icons.clearFormatting"
        @click="editor.clearFormatting()"
      />

      <!-- Link -->
      <ToolbarButton
        v-else-if="item === 'link'"
        name="link"
        title="Insert / Edit Link"
        :icon="icons.link"
        :active="editor.isActive('link')"
        @click="emit('openLinkDialog')"
      />

      <!-- Image -->
      <ToolbarButton
        v-else-if="item === 'image'"
        name="image"
        title="Insert Image"
        :icon="icons.image"
        @click="emit('openImageDialog')"
      />

      <!-- File -->
      <ToolbarButton
        v-else-if="item === 'file'"
        name="file"
        title="Attach File"
        :icon="icons.file"
        @click="emit('openFileDialog')"
      />

      <!-- Table -->
      <ToolbarButton
        v-else-if="item === 'table'"
        name="table"
        title="Insert Table"
        :icon="icons.table"
        :active="editor.isTableActive()"
        @click="emit('openTableDialog')"
      />

      <!-- Embed -->
      <ToolbarButton
        v-else-if="item === 'embed'"
        name="embed"
        title="Insert Media Embed"
        :icon="icons.embed"
        @click="emit('openEmbedDialog')"
      />

      <!-- Undo -->
      <ToolbarButton
        v-else-if="item === 'undo'"
        name="undo"
        title="Undo (Ctrl+Z)"
        :icon="icons.undo"
        :disabled="!editor.tiptap.can().undo()"
        @click="editor.undo()"
      />

      <!-- Redo -->
      <ToolbarButton
        v-else-if="item === 'redo'"
        name="redo"
        title="Redo (Ctrl+Shift+Z)"
        :icon="icons.redo"
        :disabled="!editor.tiptap.can().redo()"
        @click="editor.redo()"
      />
    </template>
  </div>
</template>
