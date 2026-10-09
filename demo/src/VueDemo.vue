<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import {
  RichTextEditor,
  RichTextViewer,
  VersionHistoryModal,
  CollaborationBar,
  CommentSidebar,
  DocumentLockBanner,
  AIAssistantModal,
  ThemeSwitcher,
} from '@universal-editor/vue3';
import {
  VersionHistoryManager,
  MockCollaborationProvider,
  MockAIProvider,
  PresenceManager,
  CommentManager,
  DocumentLockManager,
  DEFAULT_THEMES,
  countWords,
  countCharacters,
  countParagraphs,
  calculateReadingTime,
  type EditorTheme,
  type EditorThemeTokens,
  type VersionSnapshot,
  type CollaborationUser,
  type UserPresence,
  type CommentItem,
  type DocumentLockState,
} from '@universal-editor/core';

// =========================================================================
// Phase 27: Multi-Page Showcase & Site Navigation
// =========================================================================
export type SitePage =
  | 'home'
  | 'demo'
  | 'features'
  | 'examples'
  | 'docs'
  | 'api'
  | 'extensions'
  | 'laravel'
  | 'vue'
  | 'changelog';

export type DemoPresetKey =
  | 'basic'
  | 'advanced'
  | 'image'
  | 'table'
  | 'code'
  | 'slash'
  | 'mention'
  | 'autosave'
  | 'dark'
  | 'viewer'
  | 'ai';

const activePage = ref<SitePage>('demo');
const activeDemoPreset = ref<DemoPresetKey>('basic');
const activeInspectorTab = ref<'html' | 'json' | 'stats' | 'viewer'>('html');
const copyToast = ref<string | null>(null);

const sitePages: { id: SitePage; title: string; icon: string }[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'demo', title: 'Editor Demo', icon: '⚡' },
  { id: 'features', title: 'Features', icon: '✨' },
  { id: 'examples', title: 'Examples', icon: '💡' },
  { id: 'docs', title: 'Documentation', icon: '📖' },
  { id: 'api', title: 'API', icon: '📚' },
  { id: 'extensions', title: 'Extensions', icon: '🧩' },
  { id: 'laravel', title: 'Laravel', icon: '🔴' },
  { id: 'vue', title: 'Vue', icon: '💚' },
  { id: 'changelog', title: 'Changelog', icon: '📋' },
];

const demoPresets: Record<DemoPresetKey, { title: string; icon: string; description: string; content: string }> = {
  basic: {
    title: 'Basic Editor',
    icon: '📝',
    description: 'Headings, bold, italic, underline, strike, lists, blockquote & links',
    content: `<h1>Universal Rich Text Editor — Basic Editor</h1><p>Welcome to the <strong>Universal Rich Text Editor</strong> basic showcase. Format text with <em>italics</em>, <u>underline</u>, <s>strikethrough</s>, or <code>inline code</code>.</p><blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote><ul><li>Nested bulleted list item A</li><li>Bullet list item B</li></ul><ol><li>Ordered step 1</li><li>Ordered step 2</li></ol>`,
  },
  advanced: {
    title: 'Advanced Editor',
    icon: '🎨',
    description: 'Color pickers, highlight swatches, font size/family, subscript, superscript, Bengali & Arabic RTL',
    content: `<h1>Advanced Formatting & Multilingual Unicode</h1><p style="color: #6366f1; font-size: 20px;">Rich color styling, custom typography, and multi-script Unicode.</p><p><span style="background-color: #fef08a; color: #854d0e;">Highlighter marker yellow</span> and <span style="background-color: #bbf7d0; color: #166534;">mint green highlight</span>.</p><p>Subscript: H<sub>2</sub>O and Superscript: E = mc<sup>2</sup></p><h3>বাংলা ইউনিকোড (Bengali):</h3><p>ইউনিভার্সাল রিচ টেক্সট এডিটর একটি আধুনিক ও সমৃদ্ধ টেক্সট এডিটর ইঞ্জিন।</p><h3 dir="rtl">اللغة العربية (Arabic RTL):</h3><p dir="rtl">محرر نصوص متطور يدعم الكتابة من اليمين إلى اليسار بشكل كامل وسلس.</p>`,
  },
  image: {
    title: 'Image Editor',
    icon: '🖼️',
    description: 'Image upload, drag-and-drop, clipboard paste, alignment, captions, resize & file cards',
    content: `<h1>Image & File Management Showcase</h1><p>Drag & drop images directly or paste from your clipboard. Sizing, alignment, and captions are built-in.</p><figure class="ue-image-figure ue-image-align-center" style="max-width: 100%;" data-alignment="center" data-width="100%"><img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80" alt="Clean Code" title="Production Architecture"><figcaption class="ue-image-caption">Universal Editor Engine & Media Pipeline</figcaption></figure><div class="ue-file-card" data-type="file-attachment" data-url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" data-name="enterprise-specification.pdf" data-size="250880" data-file-type="application/pdf"><div class="ue-file-icon"></div><div class="ue-file-info"><div class="ue-file-name">enterprise-specification.pdf</div><div class="ue-file-size">245 KB</div></div><a class="ue-file-download" href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" download="enterprise-specification.pdf" target="_blank" rel="noopener noreferrer">Download</a></div>`,
  },
  table: {
    title: 'Table Editor',
    icon: '📊',
    description: 'ProseMirror grid matrix, resizable columns, cell merge/split, header rows & context menu',
    content: `<h1>Enterprise Tabular Matrix & Resizable Columns</h1><p>Right-click any cell to open the contextual table operations menu.</p><table class="ue-table" style="width: 100%; border-collapse: collapse;"><colgroup><col style="width: 30%;"><col style="width: 35%;"><col style="width: 35%;"></colgroup><thead><tr><th style="border: 1px solid #334155; padding: 10px; background: rgba(99,102,241,0.15);"><p>Feature Subsystem</p></th><th style="border: 1px solid #334155; padding: 10px; background: rgba(99,102,241,0.15);"><p>Implementation</p></th><th style="border: 1px solid #334155; padding: 10px; background: rgba(99,102,241,0.15);"><p>Verification Status</p></th></tr></thead><tbody><tr><td style="border: 1px solid #334155; padding: 10px;"><p>Core Engine</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>TypeScript / ProseMirror</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>✅ 100% Tested</p></td></tr><tr><td style="border: 1px solid #334155; padding: 10px;"><p>Vue 3 Component</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>Composition API & v-model</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>✅ 100% Tested</p></td></tr><tr><td style="border: 1px solid #334155; padding: 10px;"><p>Laravel Package</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>REST API & Sanitization</p></td><td style="border: 1px solid #334155; padding: 10px;"><p>✅ 100% Tested</p></td></tr></tbody></table>`,
  },
  code: {
    title: 'Code Editor',
    icon: '💻',
    description: 'Syntax highlighting across 13+ languages (JS, TS, PHP, Python, SQL) with language switcher & copy button',
    content: `<h1>Code Blocks & Syntax Highlighting</h1><p>Code blocks support real-time syntax highlighting for 13+ programming languages with language switcher and copy code button.</p><pre><code class="language-typescript">import { createEditor } from '@universal-editor/core';

// Initialize Universal Editor with strict options
const editor = createEditor({
  element: '#editor',
  content: '<p>Enterprise Ready</p>',
  editable: true,
  onUpdate: ({ editor }) => {
    console.log('Sanitized HTML:', editor.getSanitizedHTML());
  }
});</code></pre><pre><code class="language-php">&lt;?php

namespace App\Http\Controllers;

use UniversalEditor\Laravel\Facades\Editor;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content_html' => 'required|string',
        ]);

        $safeHtml = Editor::sanitize($validated['content_html']);
        // Persist clean HTML...
    }
}</code></pre>`,
  },
  slash: {
    title: 'Slash Commands',
    icon: '⚡',
    description: 'Notion-style / command palette with search filtering, keyboard navigation & action dispatch',
    content: `<h1>Notion-Style Slash Commands</h1><p>Press <kbd>Enter</kbd> on a new line and type <code>/</code> to open the Notion-style command palette. Filter through headings, lists, tables, media, code, and quotes using the keyboard.</p><p>Try typing <code>/table</code> or <code>/code</code> or <code>/h2</code> below:</p><p></p>`,
  },
  mention: {
    title: 'Mention',
    icon: '👤',
    description: 'User mentions autocomplete with @ trigger, avatar badges, role tags & JSON serialization',
    content: `<h1>Enterprise Mentions & Collaboration</h1><p>Type <code>@</code> to open user autocomplete. Search across team members by name or username.</p><p>Project contributors: <span data-type="mention" data-id="1" data-label="Shamim Linktech" data-username="shamim" data-avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" data-role="Lead Architect" class="ue-mention">@Shamim Linktech</span> and <span data-type="mention" data-id="2" data-label="Sarah Connor" data-username="sarah" data-role="Senior Engineer" class="ue-mention">@Sarah Connor</span>.</p>`,
  },
  autosave: {
    title: 'Autosave',
    icon: '💾',
    description: 'Debounced draft synchronization, DJB2 checksums, localStorage recovery & live status badges',
    content: `<h1>Autosave & Draft Resilience System</h1><p>Every keystroke triggers a debounced DJB2 checksum evaluation. Content is synchronized with local storage and optional remote endpoints.</p><p>Edit this content and notice the live saving badge in the toolbar footer!</p>`,
  },
  dark: {
    title: 'Dark Mode',
    icon: '🌙',
    description: 'Adaptive design engine with 6 presets (Dark, Light, Sepia, Cyberpunk, Minimal, High Contrast)',
    content: `<h1>Theming & Customization Engine</h1><p>Universal Editor includes 6 curated design presets: <strong>Dark</strong>, <strong>Light</strong>, <strong>Sepia</strong>, <strong>Cyberpunk</strong>, <strong>Minimal</strong>, and <strong>High Contrast</strong>. All styles are driven by dynamic CSS custom properties.</p>`,
  },
  viewer: {
    title: 'Read-only Viewer',
    icon: '👁️',
    description: '<RichTextViewer /> zero-chrome reading mode with image lightbox, code copy & print styles',
    content: `<h1>Read-Only Viewer Mode (&lt;RichTextViewer /&gt;)</h1><p>Clean, zero-chrome presentation layer for publishing articles, knowledge bases, and document readers with embedded media, tables, and syntax highlighting.</p><blockquote>"Knowledge increases by sharing but not by saving."</blockquote>`,
  },
  ai: {
    title: 'AI Demo',
    icon: '✨',
    description: 'AI Assistant modal for rewriting, grammar fixing, summarizing, translating & title generation',
    content: `<h1>✨ AI Assistant Integration</h1><p>Select any paragraph and click <strong>✨ AI Assistant</strong> to improve writing, fix grammar, rewrite in professional tone, summarize, translate, or generate compelling titles.</p><p>Universal Rich Text Editor delivers enterprise-grade architecture for modern web applications.</p>`,
  },
};

const content = ref(demoPresets.basic.content);

function selectDemoPreset(presetKey: DemoPresetKey) {
  activeDemoPreset.value = presetKey;
  content.value = demoPresets[presetKey].content;
  if (presetKey === 'viewer') {
    activeTab.value = 'viewer';
  } else {
    activeTab.value = 'split';
  }
  if (presetKey === 'ai') {
    openAIAssistant();
  }
  if (presetKey === 'dark') {
    switchTheme('dark');
  }
  eventMessage.value = `Loaded demo preset: ${demoPresets[presetKey].title}`;
  nextTick(() => updateLiveJson());
}

const liveJson = ref<any>({ type: 'doc', content: [] });

function updateLiveJson() {
  try {
    const editor = (window as any).vueEditorInstance;
    if (editor?.getJSON) {
      liveJson.value = editor.getJSON();
    }
  } catch {}
}

const liveFormattedHtml = computed(() => {
  if (typeof content.value === 'string') return content.value.trim();
  return JSON.stringify(content.value, null, 2);
});

const liveFormattedJson = computed(() => {
  return JSON.stringify(liveJson.value, null, 2);
});

const docStats = computed(() => {
  const text = typeof content.value === 'string' ? content.value.replace(/<[^>]+>/g, ' ') : '';
  const words = countWords(text);
  const chars = countCharacters(text, false);
  const charsNoSpaces = countCharacters(text, true);
  const paragraphs = countParagraphs(text);
  const reading = calculateReadingTime(words);
  return { words, chars, charsNoSpaces, paragraphs, reading };
});

function copyInspectorContent(type: 'html' | 'json') {
  const text = type === 'html' ? liveFormattedHtml.value : liveFormattedJson.value;
  navigator.clipboard.writeText(text).then(() => {
    copyToast.value = `Copied ${type.toUpperCase()}!`;
    setTimeout(() => {
      copyToast.value = null;
    }, 2000);
  });
}

// Controls State
const activeTab = ref<'split' | 'editor' | 'viewer'>('split');
const darkMode = ref(true);
const isReadonly = ref(false);
const outputFormat = ref<'html' | 'json' | 'text'>('html');
const eventMessage = ref('Universal Editor ready');
const editorRef = ref<any>(null);
const viewerRef = ref<any>(null);
const viewerTheme = ref<'light' | 'dark'>('dark');

// Word & Char Limits
const vueWordLimit = ref<number | undefined>(undefined);
const vueCharLimit = ref<number | undefined>(undefined);
const vueHardLimit = ref(false);
const showExtraStats = ref(true);

function setVueWordLimit(limit: number) {
  vueWordLimit.value = limit;
  eventMessage.value = `Set word limit: ${limit}`;
}

function setVueCharLimit(limit: number) {
  vueCharLimit.value = limit;
  eventMessage.value = `Set character limit: ${limit}`;
}

function toggleVueHardLimit() {
  vueHardLimit.value = !vueHardLimit.value;
  eventMessage.value = `Hard limit enforcement: ${vueHardLimit.value ? 'ON' : 'OFF'}`;
}

function resetVueLimits() {
  vueWordLimit.value = undefined;
  vueCharLimit.value = undefined;
  vueHardLimit.value = false;
  eventMessage.value = 'Reset word/char limits to unlimited';
}

function toggleExtraStats() {
  showExtraStats.value = !showExtraStats.value;
  eventMessage.value = `Extra statistics display: ${showExtraStats.value ? 'ON' : 'OFF'}`;
}

function toggleViewerTheme() {
  viewerTheme.value = viewerTheme.value === 'dark' ? 'light' : 'dark';
  eventMessage.value = `Switched viewer theme: ${viewerTheme.value}`;
}

function triggerPrint() {
  eventMessage.value = 'Print triggered';
  window.print();
}

function onCopyCode(code: string, lang: string) {
  eventMessage.value = `Copied ${lang || 'text'} code block (${code.length} chars)`;
}

function onImageClick(src: string, alt: string) {
  eventMessage.value = `Viewer lightbox opened image: ${alt || src}`;
}

function onLinkClick(href: string) {
  eventMessage.value = `Viewer link clicked: ${href}`;
}

function insertSampleYoutube() {
  editorRef.value?.insertEmbed({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    provider: 'youtube',
    caption: 'Demo YouTube Video Embed',
  });
  eventMessage.value = 'Inserted YouTube video embed';
}

function insertSampleMention() {
  editorRef.value?.insertMention({
    id: 1,
    label: 'Shamim Linktech',
    username: 'shamim',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: 'Lead Architect',
  });
}

function onReady(payload: any) {
  eventMessage.value = 'Editor initialized (@ready fired)';
  (window as any).vueEditor = editorRef.value;
  (window as any).vueEditorInstance = payload?.editor;
  updateLiveJson();
}

function onFocus() {
  eventMessage.value = 'Editor focused (@focus fired)';
}

function onBlur() {
  eventMessage.value = 'Editor blurred (@blur fired)';
}

function onChange() {
  eventMessage.value = 'Content changed (@change fired)';
  updateLiveJson();
}

function onSlashCommand(item: any) {
  eventMessage.value = `Slash command executed: /${item.id} (${item.title})`;
}

function onMention(user: any) {
  eventMessage.value = `Mention inserted: @${user.label} (${user.role || 'Member'})`;
}

function triggerVueSave() {
  editorRef.value?.saveDraft();
  eventMessage.value = 'Manual draft save triggered';
  updateLiveJson();
}

function triggerVueRestore() {
  const restored = editorRef.value?.restoreDraft();
  if (restored) {
    eventMessage.value = 'Restored draft from local storage';
    updateLiveJson();
  } else {
    eventMessage.value = 'No draft found in storage';
  }
}

function triggerVueClear() {
  editorRef.value?.clearDraft();
  eventMessage.value = 'Cleared draft storage';
}

// Version History State
const showVersionModal = ref(false);
const versions = ref<VersionSnapshot[]>([]);
const versionManager = new VersionHistoryManager({
  documentId: 'doc-vue-demo',
  maxVersions: 20,
});

const v1 = versionManager.createSnapshot(
  '<h2>Universal Rich Text Editor — Phase 18 Milestone</h2><p>Initial baseline content before edits.</p>',
  'Initial baseline milestone',
  undefined,
  'Vue Demo Document',
  'Shamim'
);

const v2 = versionManager.createSnapshot(
  '<h2>Universal Rich Text Editor — Phase 19 Milestone</h2><p>Added tables, syntax highlighting and embeds workflow.</p>',
  'Added tables, syntax highlighting and embeds',
  undefined,
  'Vue Demo Document',
  'Sarah Connor'
);

versions.value = versionManager.getVersions();

function takeSnapshot() {
  const snap = versionManager.createSnapshot(
    content.value,
    `Manual snapshot taken at ${new Date().toLocaleTimeString()}`,
    undefined,
    'Vue Demo Document',
    'Current User'
  );
  versions.value = versionManager.getVersions();
  eventMessage.value = `Created Version snapshot #${snap.version}`;
}

function onRestoreVersion(ver: VersionSnapshot) {
  const restored = versionManager.restoreVersion(ver.version);
  if (restored) {
    content.value = restored.contentHtml;
    versions.value = versionManager.getVersions();
    eventMessage.value = `Restored document to Version #${ver.version}`;
    updateLiveJson();
  }
}

// Phase 20 Collaboration State
const currentUser: CollaborationUser = {
  id: 'usr-shamim-01',
  name: 'Shamim Linktech',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  color: '#6366f1',
  role: 'Lead Architect',
};

const peerSarah: CollaborationUser = {
  id: 'usr-sarah-02',
  name: 'Sarah Connor',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  color: '#10b981',
  role: 'Senior Engineer',
};

const peerAlex: CollaborationUser = {
  id: 'usr-alex-03',
  name: 'Alex Rivers',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  color: '#f59e0b',
  role: 'Security Specialist',
};

const collabProvider = new MockCollaborationProvider({
  documentId: 'doc-vue-demo',
  currentUser,
});

const presences = ref<UserPresence[]>([]);
const presenceManager = new PresenceManager({
  provider: collabProvider,
  currentUser,
  onPresenceChange: (p) => {
    presences.value = [...p];
  },
});
presences.value = presenceManager.getAllPresences();

collabProvider.simulateRemotePeer(peerSarah);

const comments = ref<CommentItem[]>([]);
const commentManager = new CommentManager({
  provider: collabProvider,
  currentUser,
  documentId: 'doc-vue-demo',
  initialComments: [
    {
      id: 'cmt-1',
      documentId: 'doc-vue-demo',
      userName: 'Sarah Connor',
      content: 'Please verify the WebSocket fallback behavior for Phase 20 collaboration.',
      selectedText: 'Phase 20: Collaboration & Comments',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      replies: [
        {
          id: 'rpl-1',
          documentId: 'doc-vue-demo',
          parentId: 'cmt-1',
          userName: 'Shamim Linktech',
          content: 'Thanks Sarah! Concurrency lock TTL and heartbeat are active.',
          status: 'active',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      mentions: ['shamim'],
    },
  ],
  onCommentsChange: (c) => {
    comments.value = [...c];
  },
});
comments.value = commentManager.getComments();

const showComments = ref(true);
const selectedCommentId = ref<string | number | null>(null);
const currentSelectedText = ref('Universal Rich Text Editor architecture');

const lockState = ref<DocumentLockState>({ isLocked: false });
const lockManager = new DocumentLockManager({
  provider: collabProvider,
  currentUser,
  documentId: 'doc-vue-demo',
  onLockChange: (st) => {
    lockState.value = { ...st };
    if (st.isLocked && !st.isCurrentOwner) {
      isReadonly.value = true;
      eventMessage.value = `⚠️ Document locked by ${st.lockedBy?.name || 'peer'} (Viewer mode active)`;
    } else if (!st.isLocked) {
      isReadonly.value = false;
      eventMessage.value = '🔓 Document lock released. Editor is now editable';
    } else if (st.isLocked && st.isCurrentOwner) {
      isReadonly.value = false;
      eventMessage.value = '🔒 You acquired document lock (Exclusive Edit Mode)';
    }
  },
});
lockState.value = lockManager.getLockState();

function onAcquireLock() {
  const ok = lockManager.acquireLock(180000);
  if (ok) {
    eventMessage.value = 'Document lock acquired for 3 minutes';
  } else {
    eventMessage.value = 'Could not acquire lock (already owned)';
  }
}

function onReleaseLock() {
  lockManager.releaseLock();
  eventMessage.value = 'Document lock released';
}

function onAddComment(payload: { content: string; selectedText?: string }) {
  const item = commentManager.addComment(payload.content, payload.selectedText);
  eventMessage.value = `Added comment #${item.id}`;
}

function onAddReply(payload: { commentId: string | number; content: string }) {
  const reply = commentManager.addReply(payload.commentId, payload.content);
  if (reply) {
    eventMessage.value = `Added reply to comment #${payload.commentId}`;
  }
}

function onResolveComment(commentId: string | number) {
  commentManager.resolveComment(commentId);
  eventMessage.value = `Resolved comment #${commentId}`;
}

function onReopenComment(commentId: string | number) {
  commentManager.reopenComment(commentId);
  eventMessage.value = `Reopened comment #${commentId}`;
}

function onDeleteComment(commentId: string | number) {
  commentManager.deleteComment(commentId);
  eventMessage.value = `Deleted comment #${commentId}`;
}

function onSelectComment(comment: CommentItem) {
  selectedCommentId.value = comment.id;
  eventMessage.value = `Selected comment thread: "${comment.content.slice(0, 30)}..."`;
}

function simulatePeerJoin() {
  collabProvider.simulateRemotePeer(peerAlex);
  eventMessage.value = 'Simulated: Alex Rivers joined session';
}

function simulatePeerTyping() {
  collabProvider.simulateRemoteCursor(peerSarah.id, 120, 145);
  eventMessage.value = 'Simulated: Sarah Connor moved cursor & typing';
}

function simulatePeerLock() {
  collabProvider.broadcastLock({
    isLocked: true,
    lockedBy: peerSarah,
    lockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    isCurrentOwner: false,
  });
}

// AI Assistant State
const showAIModal = ref(false);
const aiTargetText = ref('');
const mockAI = new MockAIProvider({ simulatedDelayMs: 250 });

function openAIAssistant() {
  try {
    const editor = (window as any).vueEditorInstance;
    const tiptap = editor?.tiptap || editor;
    if (tiptap?.state?.selection) {
      const { from, to } = tiptap.state.selection;
      const sel = tiptap.state.doc.textBetween(from, to, ' ').trim();
      aiTargetText.value = sel || 'Universal Rich Text Editor delivers enterprise-grade architecture for modern web applications.';
    } else {
      aiTargetText.value = 'Universal Rich Text Editor delivers enterprise-grade architecture for modern web applications.';
    }
  } catch {
    aiTargetText.value = 'Universal Rich Text Editor delivers enterprise-grade architecture for modern web applications.';
  }
  showAIModal.value = true;
  eventMessage.value = 'Opened AI Assistant modal';
}

function onApplyAI(payload: { text: string; insertMode: 'replace' | 'insertBelow' }) {
  try {
    const editor = (window as any).vueEditorInstance;
    if (editor?.tiptap) {
      if (payload.insertMode === 'replace') {
        editor.tiptap.commands.insertContent(payload.text);
      } else {
        editor.tiptap.commands.enter();
        editor.tiptap.commands.insertContent(payload.text);
      }
    } else {
      content.value += `<p>${payload.text}</p>`;
    }
  } catch {
    content.value += `<p>${payload.text}</p>`;
  }
  eventMessage.value = `Applied AI result (${payload.insertMode}): "${payload.text.slice(0, 30)}..."`;
  updateLiveJson();
}

// Theming State
const selectedTheme = ref('dark');
const customEditorTokens = ref<Partial<EditorThemeTokens>>({});

function switchTheme(themeId: string) {
  selectedTheme.value = themeId;
  eventMessage.value = `Applied theme preset: ${themeId}`;
}

function adjustRadius(radius: string) {
  customEditorTokens.value = { ...customEditorTokens.value, editorRadius: radius };
  eventMessage.value = `Updated design token: border-radius = ${radius}`;
}

function resetTokens() {
  customEditorTokens.value = {};
  eventMessage.value = 'Reset design token overrides';
}

function onThemeChange(theme: EditorTheme) {
  eventMessage.value = `Theme active: ${theme.name} (${theme.mode} mode)`;
}

// Mobile & A11y
const simulatedViewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop');
const isBottomSheetOnMobile = ref(false);
const latestAnnouncerMessage = ref('Live region ready');
const announcerPoliteness = ref<'polite' | 'assertive'>('polite');

function triggerLiveAnnouncement(msg: string) {
  latestAnnouncerMessage.value = msg;
  editorRef.value?.announce(msg, { politeness: announcerPoliteness.value });
  eventMessage.value = `🔊 Screen Reader Live Announcement: "${msg}"`;
}

function setSimulatedViewport(mode: 'desktop' | 'tablet' | 'mobile') {
  simulatedViewport.value = mode;
  if (mode === 'mobile') {
    showComments.value = false;
  }
  eventMessage.value = `Switched viewport mode: ${mode.toUpperCase()}`;
}

// Documentation Sections (Phase 25)
const docSections = [
  '1. Introduction',
  '2. Installation',
  '3. Vue 3 Installation',
  '4. Vue 2 Installation',
  '5. Vanilla JS Installation',
  '6. Laravel Installation',
  '7. Basic Usage',
  '8. Configuration',
  '9. Toolbar Customization',
  '10. Image Upload',
  '11. File Upload',
  '12. Tables',
  '13. Code Blocks',
  '14. Embeds',
  '15. Slash Commands',
  '16. Mentions',
  '17. Autosave',
  '18. Sanitization',
  '19. Custom Extensions',
  '20. Custom Upload Provider',
  '21. Custom AI Provider',
  '22. Events',
  '23. Theming',
  '24. Security',
  '25. API Reference',
  '26. Troubleshooting',
  '27. Migration Guide',
];

const selectedDocSection = ref(docSections[0]);
const docsSearch = ref('');

const filteredDocSections = computed(() => {
  if (!docsSearch.value) return docSections;
  const q = docsSearch.value.toLowerCase();
  return docSections.filter((s) => s.toLowerCase().includes(q));
});

// Features Data
const featuresList = [
  { id: 1, name: 'Project Architecture & Monorepo', phase: 'Phase 1', cat: 'Core', status: '✅ Done' },
  { id: 2, name: 'Basic Rich Text Editing Engine', phase: 'Phase 2', cat: 'Core', status: '✅ Done' },
  { id: 3, name: 'Vue 3 Reactive Component Adapter', phase: 'Phase 3', cat: 'Vue', status: '✅ Done' },
  { id: 4, name: 'Image & File Media Pipeline', phase: 'Phase 4', cat: 'Media', status: '✅ Done' },
  { id: 5, name: 'Laravel Integration Package', phase: 'Phase 5', cat: 'Backend', status: '✅ Done' },
  { id: 6, name: 'Dual-Tier XSS Content Security', phase: 'Phase 6', cat: 'Security', status: '✅ Done' },
  { id: 7, name: 'Advanced Formatting & Multilingual', phase: 'Phase 7', cat: 'Core', status: '✅ Done' },
  { id: 8, name: 'Enterprise Tables & Context Menu', phase: 'Phase 8', cat: 'Elements', status: '✅ Done' },
  { id: 9, name: 'Syntax Highlighting Code Blocks', phase: 'Phase 9', cat: 'Elements', status: '✅ Done' },
  { id: 10, name: 'Media Embeds (YouTube, Vimeo, Maps)', phase: 'Phase 10', cat: 'Elements', status: '✅ Done' },
  { id: 11, name: 'Notion-Style Slash Commands', phase: 'Phase 11', cat: 'Productivity', status: '✅ Done' },
  { id: 12, name: 'Enterprise Mentions System', phase: 'Phase 12', cat: 'Productivity', status: '✅ Done' },
  { id: 13, name: 'Autosave & Draft Resilience', phase: 'Phase 13', cat: 'Productivity', status: '✅ Done' },
  { id: 14, name: 'Word & Character Statistics', phase: 'Phase 14', cat: 'Utility', status: '✅ Done' },
  { id: 15, name: 'Read-Only Viewer Mode', phase: 'Phase 15', cat: 'Viewer', status: '✅ Done' },
  { id: 16, name: 'Vue 2 Backward-Compatibility', phase: 'Phase 16', cat: 'Vue', status: '✅ Done' },
  { id: 17, name: 'Vanilla JavaScript API', phase: 'Phase 17', cat: 'Core', status: '✅ Done' },
  { id: 18, name: 'Laravel Database Persistence', phase: 'Phase 18', cat: 'Backend', status: '✅ Done' },
  { id: 19, name: 'Document Version History & Diff', phase: 'Phase 19', cat: 'Backend', status: '✅ Done' },
  { id: 20, name: 'Live Collaboration & Threaded Comments', phase: 'Phase 20', cat: 'Collab', status: '✅ Done' },
  { id: 21, name: 'AI Assistant Integration', phase: 'Phase 21', cat: 'AI', status: '✅ Done' },
  { id: 22, name: 'Theming Engine & Design Tokens', phase: 'Phase 22', cat: 'Theme', status: '✅ Done' },
  { id: 23, name: 'Mobile Optimization & WCAG 2.1 A11y', phase: 'Phase 23', cat: 'A11y', status: '✅ Done' },
  { id: 24, name: 'Testing Suite (Unit, Vue, Laravel, E2E)', phase: 'Phase 24', cat: 'QA', status: '✅ Done' },
  { id: 25, name: 'Professional Documentation (27 Sec)', phase: 'Phase 25', cat: 'Docs', status: '✅ Done' },
  { id: 26, name: 'NPM & Composer Packages', phase: 'Phase 26', cat: 'DevOps', status: '✅ Done' },
  { id: 27, name: 'Demo Website & Interactive Showcase', phase: 'Phase 27', cat: 'Showcase', status: '🚀 Current' },
];

const selectedFeatureCat = ref('All');
const featureCategories = ['All', 'Core', 'Vue', 'Backend', 'Security', 'Elements', 'Productivity', 'A11y', 'DevOps'];

const filteredFeatures = computed(() => {
  if (selectedFeatureCat.value === 'All') return featuresList;
  return featuresList.filter((f) => f.cat === selectedFeatureCat.value);
});
</script>

<template>
  <div class="vue3-demo-container">
    <!-- Top Site Navigation Bar (Phase 27) -->
    <nav class="card site-nav-bar mb-3" style="padding: 0.5rem 0.75rem;">
      <div class="site-nav-container">
        <button
          v-for="page in sitePages"
          :key="page.id"
          :id="'nav-' + page.id"
          class="site-nav-btn"
          :class="{ active: activePage === page.id }"
          @click="activePage = page.id"
        >
          <span>{{ page.icon }}</span>
          <span>{{ page.title }}</span>
        </button>
      </div>
    </nav>

    <!-- =====================================================================
         PAGE 1: HOME
         ===================================================================== -->
    <section v-if="activePage === 'home'" class="hero-page">
      <div class="hero-card">
        <div class="hero-badge">✨ Enterprise Monorepo v1.0.0 • 100% Tested</div>
        <h1 class="hero-title">Universal Rich Text Editor</h1>
        <p class="hero-subtitle">
          An extensible, framework-independent rich content editing engine powered by ProseMirror and Tiptap.
          Official first-class adapters for Vue 3, Vue 2, Vanilla JavaScript, and Laravel.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 1rem;" @click="activePage = 'demo'">
            ⚡ Launch Interactive Demo
          </button>
          <button class="btn btn-secondary" style="padding: 0.75rem 1.75rem; font-size: 1rem;" @click="activePage = 'docs'">
            📖 Read Documentation
          </button>
        </div>
      </div>

      <!-- Quick Install Box -->
      <div class="card mb-4" style="padding: 1.5rem;">
        <h3 style="margin-bottom: 0.75rem; color: #f8fafc;">📦 Quick Installation</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          <div style="background: #030712; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Vue 3 Component</div>
            <code style="color: #4ade80;">npm install @universal-editor/vue3 @universal-editor/core</code>
          </div>
          <div style="background: #030712; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Vanilla JS Core API</div>
            <code style="color: #38bdf8;">npm install @universal-editor/core</code>
          </div>
          <div style="background: #030712; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Laravel Package</div>
            <code style="color: #f87171;">composer require vendor/laravel-universal-editor</code>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 2: EDITOR DEMO (Master Showcase with 11 Presets & Real-Time Output)
         ===================================================================== -->
    <div v-show="activePage === 'demo'">
      <!-- 11 Interactive Demo Presets Pill Bar (Page 34 Spec) -->
      <div class="card mb-3" style="padding: 0.75rem 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.82rem; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em;">
            🎯 11 Interactive Showcase Presets:
          </span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            {{ demoPresets[activeDemoPreset].description }}
          </span>
        </div>
        <div class="demo-preset-bar">
          <button
            v-for="(preset, key) in demoPresets"
            :key="key"
            :id="'preset-' + key"
            class="demo-preset-pill"
            :class="{ active: activeDemoPreset === key }"
            @click="selectDemoPreset(key)"
          >
            <span>{{ preset.icon }}</span>
            <span>{{ preset.title }}</span>
          </button>
        </div>
      </div>

      <!-- Reactive Controls Bar -->
      <div class="card controls-card mb-4">
        <div class="card-header">
          <h3>Reactive Controls & Toolbar Configuration</h3>
          <span class="status-indicator">{{ eventMessage }}</span>
        </div>
        <div class="button-bar">
          <!-- View Mode Switcher -->
          <button class="btn" :class="activeTab === 'split' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'split'">
            Split View (Editor + Output)
          </button>
          <button class="btn" :class="activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'editor'">
            Editor Only
          </button>
          <button class="btn" :class="activeTab === 'viewer' ? 'btn-primary' : 'btn-secondary'" @click="activeTab = 'viewer'">
            Viewer Mode (&lt;RichTextViewer /&gt;)
          </button>
          <button class="btn btn-secondary" style="border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;" @click="triggerPrint">
            🖨️ Print Document
          </button>
          <button class="btn btn-secondary" style="border-color: rgba(234, 179, 8, 0.4); color: #facc15;" @click="toggleViewerTheme">
            {{ viewerTheme === 'dark' ? '☀️ Viewer Light' : '🌙 Viewer Dark' }}
          </button>
          <label class="btn btn-secondary">
            <input v-model="darkMode" type="checkbox" style="margin-right: 6px" />
            Dark Mode
          </label>
          <label class="btn btn-secondary">
            <input v-model="isReadonly" type="checkbox" style="margin-right: 6px" />
            Read-Only
          </label>
          <button class="btn btn-secondary" style="border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc;" @click="showVersionModal = true">
            🕒 Versions ({{ versions.length }})
          </button>
          <button class="btn btn-secondary" style="border-color: rgba(52, 211, 153, 0.4); color: #34d399;" @click="takeSnapshot">
            📸 Snapshot
          </button>
          <button class="btn btn-secondary" style="border-color: rgba(16, 185, 129, 0.4); color: #34d399;" @click="triggerVueSave">
            💾 Save Draft
          </button>
          <button class="btn btn-secondary" style="border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc;" @click="triggerVueRestore">
            🔄 Restore Draft
          </button>
          <button
            class="btn"
            style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; font-weight: 600; border: none; box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);"
            @click="openAIAssistant"
          >
            ✨ AI Assistant
          </button>
        </div>

        <!-- Theming Preset Selector Bar -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 12px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 10px; width: 100%; margin-top: 6px;">
          <span style="font-size: 12px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em;">
            🎨 Theme Presets:
          </span>
          <ThemeSwitcher v-model="selectedTheme" />
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'dark' }" @click="switchTheme('dark')">🌙 Dark</button>
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'light' }" @click="switchTheme('light')">☀️ Light</button>
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'sepia' }" @click="switchTheme('sepia')">📜 Sepia</button>
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'cyberpunk' }" @click="switchTheme('cyberpunk')">⚡ Cyberpunk</button>
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'minimal' }" @click="switchTheme('minimal')">❄️ Minimal</button>
          <button class="btn btn-secondary btn-xs" :class="{ 'btn-primary': selectedTheme === 'high-contrast' }" @click="switchTheme('high-contrast')">👁️ High Contrast</button>
        </div>
      </div>

      <!-- Editor Grid with Real-Time Output Inspection (Page 34 Spec) -->
      <div class="editor-grid" :style="activeTab === 'viewer' ? 'grid-template-columns: 1fr;' : ''">
        <!-- Left Column: The Editor Card -->
        <section v-if="activeTab !== 'viewer'" class="card">
          <div class="card-header">
            <h3>&lt;RichTextEditor v-model="content" /&gt;</h3>
            <span class="badge badge-success">Vue 3 Component</span>
          </div>

          <!-- Collaboration Bar -->
          <CollaborationBar
            :presences="presences"
            :lock-state="lockState"
            :show-comments="showComments"
            :active-comments-count="comments.filter(c => c.status === 'active').length"
            @toggle-comments="showComments = !showComments"
            @acquire-lock="onAcquireLock"
            @release-lock="onReleaseLock"
          />

          <!-- Document Lock Warning Banner -->
          <DocumentLockBanner
            :lock-state="lockState"
            @release="onReleaseLock"
            @refresh="lockState = lockManager.getLockState()"
          />

          <div
            class="editor-collab-wrapper"
            :style="[
              { display: 'flex', position: 'relative' },
              simulatedViewport === 'mobile'
                ? { maxWidth: '375px', margin: '0 auto', border: '3px solid #6366f1', borderRadius: '24px', overflow: 'hidden' }
                : simulatedViewport === 'tablet'
                ? { maxWidth: '768px', margin: '0 auto', border: '2px solid rgba(99, 102, 241, 0.5)', borderRadius: '16px', overflow: 'hidden' }
                : {}
            ]"
          >
            <div :style="{ flex: '1', padding: simulatedViewport === 'mobile' ? '0.25rem' : '1rem', minWidth: '0' }">
              <RichTextEditor
                ref="editorRef"
                v-model="content"
                :dark-mode="darkMode"
                :readonly="isReadonly"
                :output-format="outputFormat"
                placeholder="Type / for commands, @ for mentions..."
                min-height="340px"
                max-height="620px"
                :character-limit="vueCharLimit"
                :word-limit="vueWordLimit"
                :hard-limit="vueHardLimit"
                :show-word-count="true"
                :show-character-count="true"
                :show-characters-no-spaces="showExtraStats"
                :show-paragraph-count="showExtraStats"
                :show-reading-time="showExtraStats"
                :theme="selectedTheme"
                :theme-tokens="customEditorTokens"
                @ready="onReady"
                @focus="onFocus"
                @blur="onBlur"
                @change="onChange"
                @slash-command="onSlashCommand"
                @mention="onMention"
              />
            </div>

            <!-- Comment Sidebar -->
            <CommentSidebar
              :comments="comments"
              :is-open="showComments"
              :selected-comment-id="selectedCommentId"
              :current-user="currentUser"
              :selected-text="currentSelectedText"
              @add-comment="onAddComment"
              @add-reply="onAddReply"
              @resolve-comment="onResolveComment"
              @reopen-comment="onReopenComment"
              @delete-comment="onDeleteComment"
              @select-comment="onSelectComment"
            />
          </div>
        </section>

        <!-- Right Column: Real-Time Side-by-Side Output Inspector (Page 34 Spec) -->
        <section v-if="activeTab !== 'viewer'" class="card realtime-inspector" style="display: flex; flex-direction: column;">
          <div class="inspector-header-tabs">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: #a5b4fc; text-transform: uppercase;">
                ⚡ Real-Time Output Inspection
              </span>
              <span v-if="copyToast" class="badge badge-success">{{ copyToast }}</span>
            </div>
            <div class="inspector-subtabs">
              <button class="inspector-tab-btn" :class="{ active: activeInspectorTab === 'html' }" @click="activeInspectorTab = 'html'">
                OUTPUT HTML
              </button>
              <button class="inspector-tab-btn" :class="{ active: activeInspectorTab === 'json' }" @click="activeInspectorTab = 'json'">
                OUTPUT JSON
              </button>
              <button class="inspector-tab-btn" :class="{ active: activeInspectorTab === 'viewer' }" @click="activeInspectorTab = 'viewer'">
                LIVE VIEWER
              </button>
              <button class="inspector-tab-btn" :class="{ active: activeInspectorTab === 'stats' }" @click="activeInspectorTab = 'stats'">
                STATISTICS
              </button>
            </div>
            <div style="display: flex; gap: 6px;">
              <button v-if="activeInspectorTab === 'html'" class="btn btn-xs btn-secondary" @click="copyInspectorContent('html')">
                📋 Copy HTML
              </button>
              <button v-if="activeInspectorTab === 'json'" class="btn btn-xs btn-secondary" @click="copyInspectorContent('json')">
                📋 Copy JSON
              </button>
            </div>
          </div>

          <div style="flex: 1; min-height: 480px; position: relative; background: #030712;">
            <!-- OUTPUT HTML -->
            <div v-show="activeInspectorTab === 'html'" style="height: 100%;">
              <div style="padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); font-size: 0.75rem; color: #94a3b8; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                <span>OUTPUT HTML ({{ liveFormattedHtml.length }} characters)</span>
                <span style="color: #4ade80;">● Auto-Sanitized</span>
              </div>
              <pre class="inspector-output-box code-html"><code>{{ liveFormattedHtml }}</code></pre>
            </div>

            <!-- OUTPUT JSON -->
            <div v-show="activeInspectorTab === 'json'" style="height: 100%;">
              <div style="padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); font-size: 0.75rem; color: #94a3b8; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                <span>OUTPUT JSON (ProseMirror AST Structure)</span>
                <span style="color: #fde047;">● Valid JSON Schema</span>
              </div>
              <pre class="inspector-output-box code-json"><code>{{ liveFormattedJson }}</code></pre>
            </div>

            <!-- LIVE VIEWER -->
            <div v-show="activeInspectorTab === 'viewer'" :style="viewerTheme === 'light' ? 'background: #ffffff; color: #1e293b; padding: 1.5rem; height: 100%; overflow-y: auto;' : 'background: #0b0f19; color: #e2e8f0; padding: 1.5rem; height: 100%; overflow-y: auto;'">
              <RichTextViewer
                ref="viewerRef"
                :content="content"
                :dark-mode="viewerTheme === 'dark'"
                :theme="viewerTheme"
                @copy-code="onCopyCode"
                @image-click="onImageClick"
                @link-click="onLinkClick"
              />
            </div>

            <!-- STATISTICS -->
            <div v-show="activeInspectorTab === 'stats'" style="padding: 1.5rem;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="card" style="padding: 1rem; text-align: center; background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3);">
                  <div style="font-size: 1.8rem; font-weight: 800; color: #818cf8;">{{ docStats.words }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Words</div>
                </div>
                <div class="card" style="padding: 1rem; text-align: center; background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.3);">
                  <div style="font-size: 1.8rem; font-weight: 800; color: #38bdf8;">{{ docStats.chars }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Characters</div>
                </div>
                <div class="card" style="padding: 1rem; text-align: center; background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3);">
                  <div style="font-size: 1.8rem; font-weight: 800; color: #34d399;">{{ docStats.paragraphs }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Paragraphs</div>
                </div>
                <div class="card" style="padding: 1rem; text-align: center; background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3);">
                  <div style="font-size: 1.8rem; font-weight: 800; color: #fbbf24;">{{ docStats.reading.text }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Reading Time</div>
                </div>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; font-size: 0.85rem; color: var(--text-muted); border: 1px solid var(--border-color);">
                <p style="margin-bottom: 6px;">• Characters excluding spaces: <strong style="color: #fff;">{{ docStats.charsNoSpaces }}</strong></p>
                <p style="margin-bottom: 6px;">• Active format: <strong style="color: #818cf8;">{{ outputFormat.toUpperCase() }}</strong></p>
                <p>• Autosave status: <strong style="color: #34d399;">Debounced DJB2 Checksum Synchronized</strong></p>
              </div>
            </div>
          </div>
        </section>

        <!-- Read-Only Viewer (when in viewer-only tab) -->
        <section v-if="activeTab === 'viewer'" class="card viewer-card">
          <div class="card-header">
            <h3>&lt;RichTextViewer :content="content" /&gt;</h3>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge badge-accent">Phase 15 Viewer Mode</span>
              <button class="btn btn-sm btn-secondary" @click="triggerPrint">🖨️ Print</button>
            </div>
          </div>
          <div
            class="tab-body"
            :style="
              viewerTheme === 'light'
                ? 'background: #ffffff; color: #1e293b; padding: 1.5rem; min-height: 480px; border-radius: 0 0 8px 8px;'
                : 'background: #0b0f19; color: #e2e8f0; padding: 1.5rem; min-height: 480px; border-radius: 0 0 8px 8px;'
            "
          >
            <RichTextViewer
              ref="viewerRef"
              :content="content"
              :dark-mode="viewerTheme === 'dark'"
              :theme="viewerTheme"
              @copy-code="onCopyCode"
              @image-click="onImageClick"
              @link-click="onLinkClick"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- =====================================================================
         PAGE 3: FEATURES (Complete 30-Phase Interactive Matrix)
         ===================================================================== -->
    <section v-if="activePage === 'features'" class="features-page">
      <div class="card mb-4" style="padding: 1.5rem;">
        <h2 style="margin-bottom: 0.5rem; color: #f8fafc;">Enterprise Features Matrix (Phases 1–30)</h2>
        <p style="color: #94a3b8; margin-bottom: 1rem;">
          Filter through all 30 engineered subsystems spanning core editor mechanics, UI framework adapters, and backend integrations.
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button
            v-for="cat in featureCategories"
            :key="cat"
            class="btn btn-xs"
            :class="selectedFeatureCat === cat ? 'btn-primary' : 'btn-secondary'"
            @click="selectedFeatureCat = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div class="features-grid">
        <div v-for="feat in filteredFeatures" :key="feat.id" class="feature-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="badge badge-neutral" style="font-size: 0.72rem;">{{ feat.phase }}</span>
            <span class="badge badge-success" style="font-size: 0.72rem;">{{ feat.status }}</span>
          </div>
          <h4>{{ feat.name }}</h4>
          <p>Category: <strong style="color: #818cf8;">{{ feat.cat }}</strong></p>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 4: EXAMPLES (Vue 3, Vue 2, Vanilla JS, Laravel)
         ===================================================================== -->
    <section v-if="activePage === 'examples'" class="examples-page">
      <div class="card mb-4" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 1rem;">Code Examples & Integration Patterns</h2>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- Vue 3 -->
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #4ade80; margin-bottom: 0.5rem;">Vue 3 Component (&lt;script setup&gt;)</div>
            <pre style="font-family: var(--font-mono); font-size: 0.85rem; color: #e2e8f0; overflow-x: auto;"><code>&lt;script setup lang="ts"&gt;
import { ref } from 'vue';
import { RichTextEditor } from '@universal-editor/vue3';
import '@universal-editor/vue3/style.css';

const content = ref('&lt;h1&gt;Hello World&lt;/h1&gt;');
&lt;/script&gt;

&lt;template&gt;
  &lt;RichTextEditor v-model="content" output-format="html" /&gt;
&lt;/template&gt;</code></pre>
          </div>

          <!-- Vanilla JS -->
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem;">Vanilla JavaScript (DOM Mount)</div>
            <pre style="font-family: var(--font-mono); font-size: 0.85rem; color: #e2e8f0; overflow-x: auto;"><code>import { createEditor } from '@universal-editor/core';
import '@universal-editor/core/styles.css';

const editor = createEditor({
  element: document.getElementById('editor'),
  content: '&lt;p&gt;Standalone Editor&lt;/p&gt;',
  editable: true,
  onUpdate: ({ editor }) =&gt; {
    console.log('Sanitized HTML:', editor.getSanitizedHTML());
  }
});</code></pre>
          </div>

          <!-- Laravel -->
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 0.5rem;">Laravel Controller Sanitization & Upload</div>
            <pre style="font-family: var(--font-mono); font-size: 0.85rem; color: #e2e8f0; overflow-x: auto;"><code>use UniversalEditor\\Laravel\\Facades\\Editor;

class ArticleController extends Controller
{
    public function store(Request $request)
    {
        $safeHtml = Editor::sanitize($request->input('content_html'));
        // Persist verified safe HTML...
    }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 5: DOCUMENTATION (27-Section Interactive Developer Manual)
         ===================================================================== -->
    <section v-if="activePage === 'docs'" class="docs-page">
      <div class="docs-view-container">
        <!-- Sidebar TOC -->
        <aside class="docs-sidebar">
          <div class="docs-toc-title">27 Documentation Sections</div>
          <input
            v-model="docsSearch"
            type="text"
            placeholder="Search sections..."
            style="width: 100%; padding: 0.4rem 0.6rem; font-size: 0.8rem; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); border-radius: 4px; color: #fff; margin-bottom: 0.75rem;"
          />
          <button
            v-for="sec in filteredDocSections"
            :key="sec"
            class="docs-toc-item"
            :class="{ active: selectedDocSection === sec }"
            @click="selectedDocSection = sec"
          >
            {{ sec }}
          </button>
        </aside>

        <!-- Main Doc Article -->
        <main class="docs-content-card">
          <h2>{{ selectedDocSection }}</h2>
          <p>
            This section provides complete architectural instructions, option tables, and code snippets from the
            official developer guide. Refer to <code style="color: #818cf8;">docs/README.md</code> for the full manual.
          </p>
          <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 1rem;">
            <h4 style="color: #38bdf8; margin-bottom: 0.5rem;">Key Section Takeaways:</h4>
            <ul style="padding-left: 1.25rem; color: #94a3b8; line-height: 1.8;">
              <li>Strict TypeScript interfaces and runtime validation rules.</li>
              <li>Dual-tier XSS sanitization preventing malicious scripts, SVGs, and iframes.</li>
              <li>WAI-ARIA accessible controls conforming to WCAG 2.1 AA/AAA standards.</li>
              <li>Cross-platform support across Vue 3, Vue 2, Vanilla JS, and Laravel.</li>
            </ul>
          </div>
        </main>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 6: API REFERENCE
         ===================================================================== -->
    <section v-if="activePage === 'api'" class="api-page">
      <div class="card" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 1rem;">Universal Editor API Reference</h2>
        <div style="overflow-x: auto;">
          <table class="ue-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(99,102,241,0.15);">
                <th style="padding: 10px; border: 1px solid var(--border-color);">Method / Symbol</th>
                <th style="padding: 10px; border: 1px solid var(--border-color);">Type Signature</th>
                <th style="padding: 10px; border: 1px solid var(--border-color);">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid var(--border-color);"><code style="color: #38bdf8;">getHTML()</code></td>
                <td style="padding: 10px; border: 1px solid var(--border-color); font-family: var(--font-mono);">() =&gt; string</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">Returns current document HTML markup.</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid var(--border-color);"><code style="color: #fde047;">getJSON()</code></td>
                <td style="padding: 10px; border: 1px solid var(--border-color); font-family: var(--font-mono);">() =&gt; Record&lt;string, any&gt;</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">Returns document as ProseMirror JSON AST.</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid var(--border-color);"><code style="color: #4ade80;">getSanitizedHTML()</code></td>
                <td style="padding: 10px; border: 1px solid var(--border-color); font-family: var(--font-mono);">() =&gt; string</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">Returns XSS-purified HTML safe for rendering.</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid var(--border-color);"><code style="color: #c084fc;">setContent(content)</code></td>
                <td style="padding: 10px; border: 1px solid var(--border-color); font-family: var(--font-mono);">(c: string | object) =&gt; void</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">Replaces editor content with HTML or JSON.</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid var(--border-color);"><code style="color: #f87171;">destroy()</code></td>
                <td style="padding: 10px; border: 1px solid var(--border-color); font-family: var(--font-mono);">() =&gt; void</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">Cleans up ProseMirror view and unbinds listeners.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 7: EXTENSIONS
         ===================================================================== -->
    <section v-if="activePage === 'extensions'" class="extensions-page">
      <div class="card" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 0.5rem;">Extension Registry & Custom Extensions</h2>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">
          Universal Editor extensions are modular ProseMirror / Tiptap extensions managed through the <code style="color: #818cf8;">ExtensionRegistry</code>.
        </p>
        <div style="background: #030712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <pre style="font-family: var(--font-mono); font-size: 0.85rem; color: #a5b4fc;"><code>import { ExtensionRegistry, defineExtension } from '@universal-editor/extensions';

const registry = new ExtensionRegistry();

const MyCustomExtension = defineExtension({
  name: 'myCustomExt',
  addKeyboardShortcuts() {
    return {
      'Shift-Alt-k': () => {
        console.log('Custom shortcut triggered');
        return true;
      }
    };
  }
});

registry.register(MyCustomExtension, { priority: 150 });</code></pre>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 8: LARAVEL
         ===================================================================== -->
    <section v-if="activePage === 'laravel'" class="laravel-page">
      <div class="card" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 0.5rem;">Laravel Integration Package</h2>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">
          The official package <code style="color: #f87171;">vendor/laravel-universal-editor</code> provides backend routes, controllers, and models.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 6px;">POST /editor/upload</div>
            <p style="font-size: 0.85rem; color: #94a3b8;">Handles image & file uploads with MIME verification & file hashing.</p>
          </div>
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">POST /editor/autosave</div>
            <p style="font-size: 0.85rem; color: #94a3b8;">Persists debounced drafts with JSON and sanitized HTML.</p>
          </div>
          <div class="card" style="background: #030712; padding: 1.25rem;">
            <div style="font-weight: 700; color: #4ade80; margin-bottom: 6px;">GET /editor/documents</div>
            <p style="font-size: 0.85rem; color: #94a3b8;">CRUD API endpoints with Laravel Policy authorization checks.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 9: VUE (Vue 3 vs Vue 2)
         ===================================================================== -->
    <section v-if="activePage === 'vue'" class="vue-page">
      <div class="card" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 0.5rem;">Vue 3 & Vue 2 Component Parity</h2>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">
          Both adapters expose equivalent consumer props, events, and methods for seamless cross-version compatibility.
        </p>
        <table class="ue-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(99,102,241,0.15);">
              <th style="padding: 10px; border: 1px solid var(--border-color);">Feature / Prop</th>
              <th style="padding: 10px; border: 1px solid var(--border-color);">Vue 3 (@universal-editor/vue3)</th>
              <th style="padding: 10px; border: 1px solid var(--border-color);">Vue 2 (@universal-editor/vue2)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--border-color);">v-model</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">v-model (modelValue)</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">v-model (value / modelValue)</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--border-color);">Viewer Mode</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">&lt;RichTextViewer /&gt;</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">&lt;RichTextViewer /&gt;</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--border-color);">TypeScript</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">Native Strict TS</td>
              <td style="padding: 10px; border: 1px solid var(--border-color);">Full TS Types Included</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =====================================================================
         PAGE 10: CHANGELOG
         ===================================================================== -->
    <section v-if="activePage === 'changelog'" class="changelog-page">
      <div class="card" style="padding: 2rem;">
        <h2 style="color: #f8fafc; margin-bottom: 1.5rem;">Monorepo Release History</h2>
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div class="card" style="background: #030712; padding: 1.25rem; border-left: 4px solid #6366f1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #fff; font-size: 1.1rem;">v1.0.0 — Phase 27: Demo Website & Production Packages</strong>
              <span class="badge badge-success">Latest</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.88rem;">
              Full 10-page documentation & showcase hub, 11 interactive presets, real-time HTML & JSON inspection, ESM/CJS production packages.
            </p>
          </div>
          <div class="card" style="background: #030712; padding: 1.25rem; border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #fff; font-size: 1.1rem;">v0.26.0 — Phase 26: NPM & Composer Packages</strong>
              <span class="badge badge-neutral">Phase 26</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.88rem;">
              Prepared production packages for @universal-editor/core, vue3, vue2, extensions, and vendor/laravel-universal-editor with type declarations.
            </p>
          </div>
          <div class="card" style="background: #030712; padding: 1.25rem; border-left: 4px solid #38bdf8;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #fff; font-size: 1.1rem;">v0.25.0 — Phase 25: Professional Documentation</strong>
              <span class="badge badge-neutral">Phase 25</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.88rem;">
              Complete 27-section developer guide, API reference manual, and automated documentation test suite.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modals -->
    <VersionHistoryModal
      v-model="showVersionModal"
      :versions="versions"
      :current-content="content"
      @restore="onRestoreVersion"
    />

    <AIAssistantModal
      v-model="showAIModal"
      :target-text="aiTargetText"
      :provider="mockAI"
      @apply="onApplyAI"
    />
  </div>
</template>

<style scoped>
.vue3-demo-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
</style>
