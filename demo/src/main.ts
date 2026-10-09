import { createApp } from 'vue';
import { createEditor, UniversalEditor, DEFAULT_TOOLBAR, AutosaveIndicator, VersionHistoryManager } from '@universal-editor/core';
import { computeDiff } from '@universal-editor/utils';
import '@universal-editor/core/styles.css';
import VueDemo from './VueDemo.vue';

// Mount Vue 3 Application
const vueAppEl = document.getElementById('vue-app');
if (vueAppEl) {
  const app = createApp(VueDemo);
  app.mount(vueAppEl);
}

// View switcher logic
const showVue3Btn = document.getElementById('showVue3View');
const showVanillaBtn = document.getElementById('showVanillaView');
const vue3Section = document.getElementById('vue3-section');
const vanillaSection = document.getElementById('vanilla-section');

showVue3Btn?.addEventListener('click', () => {
  document.querySelectorAll('.ue-mention-list, .ue-slash-menu').forEach(el => ((el as HTMLElement).style.display = 'none'));
  showVue3Btn.className = 'btn btn-primary';
  if (showVanillaBtn) showVanillaBtn.className = 'btn btn-secondary';
  if (vue3Section) vue3Section.style.display = 'block';
  if (vanillaSection) vanillaSection.style.display = 'none';
});

showVanillaBtn?.addEventListener('click', () => {
  document.querySelectorAll('.ue-mention-list, .ue-slash-menu').forEach(el => ((el as HTMLElement).style.display = 'none'));
  if (showVanillaBtn) showVanillaBtn.className = 'btn btn-primary';
  if (showVue3Btn) showVue3Btn.className = 'btn btn-secondary';
  if (vue3Section) vue3Section.style.display = 'none';
  if (vanillaSection) vanillaSection.style.display = 'flex';
});

// DOM elements
const editorContainer = document.getElementById('editor-container') as HTMLElement;
const outputHtml = document.getElementById('outputHtml') as HTMLElement;
const outputSanitized = document.getElementById('outputSanitized') as HTMLElement;
const outputJson = document.getElementById('outputJson') as HTMLElement;
const outputText = document.getElementById('outputText') as HTMLElement;
const statsBadge = document.getElementById('statsBadge') as HTMLElement;
const editorStatus = document.getElementById('editorStatus') as HTMLElement;
const eventLogList = document.getElementById('eventLogList') as HTMLElement;

let editor: UniversalEditor;

const sampleContent = `
  <h1>Universal Rich Text Editor — Phase 21: AI Assistant Integration</h1>
  <p>Type <code>@</code> anywhere to trigger the <strong>Enterprise Mention Autocomplete</strong> dropdown. Type <code>/</code> for <strong>Slash Commands</strong>, and click <strong>✨ AI Assistant</strong> to improve, fix grammar, rewrite, summarize, or translate content.</p>

  <p>Collaborating team: <span data-type="mention" data-id="1" data-label="Shamim Linktech" data-username="shamim" data-avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" data-role="Lead Architect" class="ue-mention">@Shamim Linktech</span> and <span data-type="mention" data-id="2" data-label="Sarah Connor" data-username="sarah" data-role="Senior Engineer" class="ue-mention">@Sarah Connor</span> are actively collaborating on Phase 21.</p>

  <blockquote>
    <p>✨ <strong>Phase 21 AI Assistant Active:</strong> Decoupled pluggable AI engine (MockAIProvider &amp; HttpAIProvider), writing enhancement, grammar repair, tone rewriting, multi-lingual translations (Bangla, Arabic, Spanish, French), and custom LLM prompts.</p>
  </blockquote>

  <h2>Embedded Media Demonstration (Phase 10)</h2>
  <div data-type="embed" data-provider="youtube" data-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" data-original-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" width="100%" height="420px" data-title="YouTube Video" data-alignment="center" class="ue-embed-wrapper ue-embed-align-center" style="max-width: 100%;">
    <div class="ue-embed-responsive">
      <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="YouTube Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="true" class="ue-embed-iframe" style="width: 100%; height: 420px; border: none;"></iframe>
    </div>
  </div>

  <h2>Table Architecture & Features (Phases 1 — 19)</h2>
  <table class="ue-table">
    <thead>
      <tr>
        <th style="width: 25%;">Feature Module</th>
        <th style="width: 45%;">Description</th>
        <th style="width: 30%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Version History &amp; Diff (Phase 19)</strong></td>
        <td>editor_document_versions table, immutable snapshots, LCS word diff engine (+/-), and rollback restoration</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Laravel Database (Phase 18)</strong></td>
        <td>EditorDocument model, auto-sanitization, word count accessor, policies, and RESTful API</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Vanilla JS API (Phase 17)</strong></td>
        <td>@universal-editor/core standalone, createEditor('#editor'), on/off bus, zero Vue</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Vue 2 Adapter (Phase 16)</strong></td>
        <td>@universal-editor/vue2, Vue 2.6/2.7 v-model, RichTextViewer, 100% method parity</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Viewer Mode (Phase 15)</strong></td>
        <td>Zero editing chrome, print optimization, one-click code copy, image lightbox</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Word &amp; Char Counter (Phase 14)</strong></td>
        <td>Real-time stats, reading time, max limits, 90% warning, and input blocking</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Autosave &amp; Drafts (Phase 13)</strong></td>
        <td>1500ms debounce, DJB2 checksums, local/session storage &amp; backend draft API</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Mentions (Phase 12)</strong></td>
        <td>@ trigger autocomplete, search, avatar &amp; role chips, keyboard nav</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Slash Commands (Phase 11)</strong></td>
        <td>Notion-style / command palette, keyboard nav, search &amp; groups</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Media Embeds (Phase 10)</strong></td>
        <td>YouTube, Vimeo, Google Maps, HTML5 Video, privacy nocookie &amp; whitelist</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Code Blocks &amp; HLJS</strong></td>
        <td>13 languages, lowlight tokenization, terminal window header</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Active</span></td>
      </tr>
      <tr>
        <td><strong>Table Grid Matrix</strong></td>
        <td>Interactive 8×8 hover grid picker + custom row/column inputs</td>
        <td><span style="color: #10b981; font-weight: 600;">✓ Ready</span></td>
      </tr>
    </tbody>
  </table>
`;

const PRESETS = {
  full: DEFAULT_TOOLBAR,
  standard: [
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'strike',
    '|',
    'bulletList',
    'orderedList',
    'taskList',
    '|',
    'link',
    '|',
    'undo',
    'redo',
  ],
  minimal: ['bold', 'italic', 'underline', '|', 'link', '|', 'undo', 'redo'],
};

function logEvent(name: string, detail?: string) {
  if (!eventLogList) return;
  const item = document.createElement('div');
  item.className = `event-item ${name}`;
  const now = new Date().toLocaleTimeString();
  item.innerHTML = `
    <span class="event-name">${name}${detail ? ` (${detail})` : ''}</span>
    <span class="event-time">${now}</span>
  `;
  eventLogList.prepend(item);
  while (eventLogList.children.length > 40) {
    eventLogList.removeChild(eventLogList.lastChild!);
  }
}

function updateInspectors() {
  if (!editor || editor.isDestroyed) return;
  const html = editor.getHTML();
  const json = editor.getJSON();
  const text = editor.getText();
  const stats = editor.getStatistics();

  if (outputHtml) outputHtml.textContent = html;
  if (outputSanitized) outputSanitized.textContent = editor.getSanitizedHTML();
  if (outputJson) outputJson.textContent = JSON.stringify(json, null, 2);
  if (outputText) outputText.textContent = text;
  if (statsBadge) {
    statsBadge.textContent = `${stats.words} words | ${stats.characters} chars (${stats.charactersExcludingSpaces} no spaces) | ${stats.paragraphs} paras | ${stats.readingTimeString}`;
  }
}

function initEditor() {
  if (editor && !editor.isDestroyed) {
    editor.destroy();
  }

  editor = createEditor({
    element: editorContainer,
    content: sampleContent,
    editable: true,
    autofocus: 'end',
    toolbar: PRESETS.full,
    bubbleMenu: true,
    autosave: {
      enabled: true,
      debounce: 1500,
      key: 'universal-editor-vanilla-draft',
    },
    onUpdate: () => {
      logEvent('update');
      updateInspectors();
    },
    onFocus: () => {
      logEvent('focus');
      if (editorStatus) editorStatus.textContent = 'Status: Focused';
    },
    onBlur: () => {
      logEvent('blur');
      if (editorStatus) editorStatus.textContent = 'Status: Blurred';
    },
    onSelectionUpdate: () => {
      logEvent('selectionUpdate');
    },
    onTransaction: () => {
      logEvent('transaction');
    },
    onDestroy: () => {
      logEvent('destroy');
      if (editorStatus) editorStatus.textContent = 'Status: Destroyed';
    },
  });

  editor.on('mention', (user: any) => {
    logEvent('mention', `@${user.label} (${user.role || 'Member'})`);
  });

  editor.on('autosave:status', ({ status, formattedTime }: any) => {
    logEvent('autosave:status', `${status} ${formattedTime || ''}`);
  });
  editor.on('autosave:saved', ({ draft }: any) => {
    logEvent('autosave:saved', `Draft saved at ${draft.formattedTime || draft.timestamp}`);
  });
  editor.on('autosave:restored', ({ draft }: any) => {
    logEvent('autosave:restored', `Restored draft from ${draft.timestamp}`);
  });

  // Phase 14 Statistics & Limits Events
  editor.on('statistics:update', (stats: any) => {
    if (statsBadge) {
      statsBadge.textContent = `${stats.words} words | ${stats.characters} chars (${stats.charactersExcludingSpaces} no spaces) | ${stats.paragraphs} paras | ${stats.readingTimeString}`;
    }
  });
  editor.on('limit:warning', (payload: any) => {
    logEvent('limit:warning', `${payload.type}: ${payload.current}/${payload.limit} (${payload.percentage}%)`);
  });
  editor.on('limit:exceeded', (payload: any) => {
    logEvent('limit:exceeded', `${payload.type}: ${payload.current}/${payload.limit}`);
  });

  const autosaveContainer = document.getElementById('autosaveIndicatorContainer');
  if (autosaveContainer) {
    autosaveContainer.innerHTML = '';
    new AutosaveIndicator(editor, autosaveContainer);
  }

  if (editorStatus) editorStatus.textContent = 'Status: Ready';
  (window as any).editor = editor;
  updateInspectors();
  logEvent('initialized', 'Phase 14 Editor Ready');
}

// Phase 14 Limits control buttons
let hardLimitActive = false;
const btnSetWordLimit = document.getElementById('btnSetWordLimit');
const btnSetCharLimit = document.getElementById('btnSetCharLimit');
const btnToggleHardLimit = document.getElementById('btnToggleHardLimit');
const btnResetLimits = document.getElementById('btnResetLimits');

btnSetWordLimit?.addEventListener('click', () => {
  editor.setLimits({ maxWords: 50 });
  logEvent('limits', 'Set word limit to 50');
});

btnSetCharLimit?.addEventListener('click', () => {
  editor.setLimits({ maxCharacters: 300 });
  logEvent('limits', 'Set character limit to 300');
});

btnToggleHardLimit?.addEventListener('click', () => {
  hardLimitActive = !hardLimitActive;
  editor.setLimits({ hardLimit: hardLimitActive });
  if (btnToggleHardLimit) {
    btnToggleHardLimit.textContent = `🚫 Hard Limit: ${hardLimitActive ? 'ON' : 'Off'}`;
  }
  logEvent('limits', `Hard limit set to ${hardLimitActive}`);
});

btnResetLimits?.addEventListener('click', () => {
  hardLimitActive = false;
  editor.setLimits({ maxWords: undefined, maxCharacters: undefined, hardLimit: false });
  if (btnToggleHardLimit) {
    btnToggleHardLimit.textContent = '🚫 Hard Limit: Off';
  }
  logEvent('limits', 'Limits reset (unlimited)');
});

// Autosave control buttons
document.getElementById('btnManualSave')?.addEventListener('click', () => {
  editor.saveDraft(true);
  logEvent('autosave', 'Manual Draft Saved (Ctrl+S)');
});

document.getElementById('btnRestoreDraft')?.addEventListener('click', () => {
  const restored = editor.restoreDraft();
  if (restored) {
    logEvent('autosave', 'Draft Restored from Storage');
  } else {
    logEvent('autosave', 'No Draft Found to Restore');
  }
});

document.getElementById('btnClearDraft')?.addEventListener('click', () => {
  editor.clearDraft();
  logEvent('autosave', 'Draft Storage Cleared');
});

// Preset buttons
function setActivePresetButton(activeId: string) {
  ['presetFull', 'presetStandard', 'presetMinimal'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (id === activeId) {
      btn.className = 'btn btn-primary';
    } else {
      btn.className = 'btn btn-secondary';
    }
  });
}

document.getElementById('presetFull')?.addEventListener('click', () => {
  if (editor?.toolbar) {
    editor.toolbar.setConfig(PRESETS.full);
    setActivePresetButton('presetFull');
    logEvent('toolbar', 'Loaded Full Preset');
  }
});

document.getElementById('presetStandard')?.addEventListener('click', () => {
  if (editor?.toolbar) {
    editor.toolbar.setConfig(PRESETS.standard);
    setActivePresetButton('presetStandard');
    logEvent('toolbar', 'Loaded Standard Preset');
  }
});

document.getElementById('presetMinimal')?.addEventListener('click', () => {
  if (editor?.toolbar) {
    editor.toolbar.setConfig(PRESETS.minimal);
    setActivePresetButton('presetMinimal');
    logEvent('toolbar', 'Loaded Minimal Preset');
  }
});

document.getElementById('btnClear')?.addEventListener('click', () => editor.clearContent(true));
document.getElementById('btnSetSample')?.addEventListener('click', () => {
  editor.setContent(sampleContent, true);
});

document.getElementById('btnInsertMention')?.addEventListener('click', () => {
  editor.insertMention({
    id: 1,
    name: 'Shamim Linktech',
    label: 'Shamim Linktech',
    username: 'shamim',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: 'Lead Architect',
  });
  logEvent('mention', 'Inserted @Shamim Linktech');
});

document.getElementById('btnInsertYouTube')?.addEventListener('click', () => {
  editor.insertEmbed({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    width: '100%',
    alignment: 'center',
    title: 'YouTube Video',
  });
  logEvent('embed', 'Inserted YouTube Video');
});

document.getElementById('btnInsertMaps')?.addEventListener('click', () => {
  editor.insertEmbed({
    url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902442430138!2d90.39108031536306!3d23.75085809467615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8bd55555555%3A0x6b2e1a3d6d542387!2sDhaka!5e0!3m2!1sen!2sbd!4v1600000000000!5m2!1sen!2sbd',
    width: '100%',
    alignment: 'center',
    title: 'Google Maps Location',
  });
  logEvent('embed', 'Inserted Google Maps Embed');
});

const multilingualContent = `
  <h1>🌐 Multilingual & Unicode Enterprise Typography</h1>
  <p>The Universal Editor provides first-class Unicode and bidirectional text layout support across world languages.</p>

  <h2>১. বাংলা (Bengali Typography)</h2>
  <p style="font-family: 'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', sans-serif; font-size: 18px; color: #10b981;">
    আমাদের মাতৃভাষা বাংলা — সমৃদ্ধ ইতিহাস ও গভীর অনুভূতির এক অনবদ্য প্রকাশ। বিশ্বকবি রবীন্দ্রনাথ ঠাকুর এবং জাতীয় কবি কাজী নজরুল ইসলামের অমর সাহিত্যের ধারক এই ভাষা।
  </p>

  <h2>2. العربية (Arabic RTL Typography)</h2>
  <p dir="rtl" style="font-family: 'Amiri', 'Noto Naskh Arabic', serif; font-size: 20px; line-height: 1.8; color: #38bdf8;">
    مرحباً بكم في محرر النصوص العالمي! يدعم هذا المحرر اتجاه النص من اليمين إلى اليسار (RTL) بشكل أصيل مع ضبط كامل للخطوط والتنسيقات المتقدمة.
  </p>

  <h2>3. اردو (Urdu RTL Typography)</h2>
  <p dir="rtl" style="font-family: 'Amiri', 'Noto Naskh Arabic', serif; font-size: 19px; line-height: 1.8; color: #f59e0b;">
    یہ ایک انٹرپرائز ریچ ٹیکسٹ ایڈیٹر ہے جو اردو اور دیگر مشرقی زبانوں کے لیے بہترین اور معیاری تحریری ماحول فراہم کرتا ہے۔
  </p>

  <h2>4. हिन्दी (Hindi / Devanagari Typography)</h2>
  <p style="font-family: 'Noto Sans Devanagari', sans-serif; font-size: 18px; color: #ec4899;">
    यूनिवर्सल एडिटर में आपका स्वागत है। यह संपादक देवनागरी लिपि, जटिल संयुक्ताक्षर और उन्नत टेक्स्ट स्वरूपण का पूर्ण समर्थन करता है।
  </p>

  <h2>5. Advanced Math & Chemical Formulas</h2>
  <p>Water formula: <strong>H<sub>2</sub>O</strong> | Carbon Dioxide: <strong>CO<sub>2</sub></strong> | Sulfuric Acid: <strong>H<sub>2</sub>SO<sub>4</sub></strong></p>
  <p>Einstein's equation: <strong>E = mc<sup>2</sup></strong> | Pythagorean theorem: <strong>a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup></strong></p>
`;

document.getElementById('btnSetMultilingual')?.addEventListener('click', () => {
  editor.setContent(multilingualContent, true);
  logEvent('multilingual', 'Loaded Bangla, Arabic (RTL), Hindi, Urdu showcase');
});

const xssPayload = `
  <h2>🛡️ Phase 6: Security & Sanitization Active</h2>
  <p>Testing enterprise content sanitization engine against multi-vector XSS attacks:</p>
  <p><strong>Safe Element:</strong> This bold text is preserved normally.</p>
  <script>alert("XSS Attack: Script Execution Attempt");</script>
  <img src="invalid-file.jpg" onerror="alert('XSS Attack: Inline Event Handler Attempt')">
  <p><a href="javascript:alert('XSS Attack: javascript: URI Scheme')">Click Malicious Link</a></p>
  <iframe src="https://evil-hacker-site.example.com"></iframe>
  <p style="color: red; width: expression(alert('XSS Attack: CSS Expression'));">Safe Styled Element</p>
`;

document.getElementById('btnInjectXss')?.addEventListener('click', () => {
  editor.setContent(xssPayload, true);
  logEvent('security', 'Injected XSS test payloads');
  const sanitizedTabBtn = document.querySelector('[data-tab="tab-sanitized"]') as HTMLButtonElement;
  sanitizedTabBtn?.click();
});

let isEditableState = true;
document.getElementById('btnToggleEditable')?.addEventListener('click', () => {
  isEditableState = !isEditableState;
  editor.setEditable(isEditableState);
  const btn = document.getElementById('btnToggleEditable');
  if (btn) btn.textContent = isEditableState ? 'Toggle Read-Only' : 'Enable Editing';
  if (editorStatus)
    editorStatus.textContent = `Status: ${isEditableState ? 'Editable' : 'Read-Only'}`;
});

document.getElementById('btnClearEvents')?.addEventListener('click', () => {
  if (eventLogList) eventLogList.innerHTML = '';
});

// Phase 19 Version History & Diff Engine for Vanilla View
const vanillaHistory = new VersionHistoryManager();
vanillaHistory.createSnapshot(
  '<h1>Universal Rich Text Editor — Phase 18</h1><p>Previous baseline version without Phase 19 versioning features.</p>',
  'Baseline v18 snapshot'
);

document.getElementById('btnCreateSnapshot')?.addEventListener('click', () => {
  const currentHtml = editor.getHTML();
  const snap = vanillaHistory.createSnapshot(
    currentHtml,
    `Manual snapshot taken at ${new Date().toLocaleTimeString()}`
  );
  logEvent('versioning', `Created snapshot v${snap.version} (${snap.wordCount} words)`);
  if (editorStatus) editorStatus.textContent = `Status: Created snapshot v${snap.version}`;
});

document.getElementById('btnVersionHistory')?.addEventListener('click', () => {
  const baseVer = vanillaHistory.getVersion(1);
  const baseHtml = baseVer ? baseVer.contentHtml : '';
  const currentHtml = editor.getHTML();
  const diff = computeDiff(baseHtml, currentHtml);

  const diffBadgeEl = document.getElementById('diffSummaryBadge');
  if (diffBadgeEl) {
    diffBadgeEl.innerHTML = `
      <span style="color: #4ade80; background: rgba(34, 197, 94, 0.15); padding: 2px 8px; border-radius: 4px; font-weight: 600;">+${diff.additions} additions</span>
      <span style="color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 2px 8px; border-radius: 4px; font-weight: 600;">-${diff.deletions} deletions</span>
      <span style="color: #94a3b8; padding: 2px 8px;">${diff.unchanged} unchanged</span>
    `;
  }

  const outputDiffEl = document.getElementById('outputDiff');
  if (outputDiffEl) {
    outputDiffEl.innerHTML = diff.diffHtml;
  }

  logEvent('versioning', `Compared current content with v1: +${diff.additions} / -${diff.deletions}`);
  const diffTabBtn = document.querySelector('[data-tab="tab-diff"]') as HTMLButtonElement;
  diffTabBtn?.click();
});

// Tab switching
const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const tabPanes = document.querySelectorAll<HTMLElement>('.tab-pane');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab');
    if (targetId) {
      document.getElementById(targetId)?.classList.add('active');
    }
  });
});

// Initialize on page load
initEditor();
