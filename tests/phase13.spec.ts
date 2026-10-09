import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createEditor,
  UniversalEditor,
  AutosaveStorage,
  calculateChecksum,
  AutosaveIndicator,
  type DraftData,
  type AutosaveStatus,
} from '../packages/core/src';

describe('Phase 13: Autosave & Draft System', () => {
  let container: HTMLElement;
  let editor: UniversalEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (editor && !editor.isDestroyed) {
      editor.destroy();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('AutosaveStorage & Checksum Engine', () => {
    it('calculates consistent checksums for string and object content', () => {
      const hash1 = calculateChecksum('<p>Hello World</p>');
      const hash2 = calculateChecksum('<p>Hello World</p>');
      const hash3 = calculateChecksum('<p>Different Content</p>');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('stores, retrieves, and deletes draft records in storage adapter', () => {
      const storage = new AutosaveStorage('memory');
      const testDraft: DraftData = {
        id: 'doc-1',
        documentId: 'doc-1',
        content: { type: 'doc', content: [] },
        html: '<p>Draft content</p>',
        text: 'Draft content',
        updatedAt: Date.now(),
        checksum: 'hash123',
      };

      expect(storage.get('doc-1')).toBeNull();
      expect(storage.has('doc-1')).toBe(false);

      const saved = storage.set('doc-1', testDraft);
      expect(saved).toBe(true);
      expect(storage.has('doc-1')).toBe(true);

      const retrieved = storage.get('doc-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('doc-1');
      expect(retrieved?.html).toBe('<p>Draft content</p>');

      const removed = storage.remove('doc-1');
      expect(removed).toBe(true);
      expect(storage.get('doc-1')).toBeNull();
    });
  });

  describe('AutosaveManager Configuration & Initialization', () => {
    it('initializes with default configuration and saved status', () => {
      editor = createEditor({
        element: container,
        content: '<p>Initial text</p>',
        autosave: {
          storageType: 'memory',
        },
      });

      expect(editor.autosaveManager).toBeDefined();
      expect(editor.getAutosaveStatus()).toBe('saved');
    });

    it('namespaces storage key when documentId is provided', () => {
      editor = createEditor({
        element: container,
        content: '<p>Initial</p>',
        autosave: {
          documentId: 'article-99',
          storageType: 'memory',
        },
      });

      editor.saveDraft(true);
      const draft = editor.getDraft();
      expect(draft).not.toBeNull();
      expect(draft?.documentId).toBe('article-99');
    });

    it('does not autosave when enabled: false', async () => {
      const saveSpy = vi.fn();
      editor = createEditor({
        element: container,
        content: '<p>Initial</p>',
        autosave: {
          enabled: false,
          saveHandler: saveSpy,
        },
      });

      expect(editor.autosaveManager).toBeUndefined();
      const res = await editor.saveDraft();
      expect(res).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('Content Changes, Debounce & Redundancy Prevention', () => {
    it('marks status as unsaved when content changes and saves after debounce', async () => {
      vi.useFakeTimers();

      let statusUpdates: AutosaveStatus[] = [];
      editor = createEditor({
        element: container,
        content: '<p>Initial</p>',
        autosave: {
          debounceMs: 500,
          storageType: 'memory',
        },
      });

      editor.on('autosave:status', ({ status }: { status: AutosaveStatus }) => {
        statusUpdates.push(status);
      });

      // Modify editor content
      editor.setContent('<p>Changed text by user</p>', true);

      expect(editor.getAutosaveStatus()).toBe('unsaved');
      expect(statusUpdates).toContain('unsaved');

      // Fast-forward debounce timer and resolve microtasks
      await vi.advanceTimersByTimeAsync(600);
      await Promise.resolve();
      await Promise.resolve();

      expect(editor.getAutosaveStatus()).toBe('saved');
      expect(editor.getLastSavedTime()).not.toBeNull();

      vi.useRealTimers();
    });

    it('prevents unnecessary saves when content is unchanged', async () => {
      const saveSpy = vi.fn();
      editor = createEditor({
        element: container,
        content: '<p>Static Content</p>',
        autosave: {
          storageType: 'memory',
          saveHandler: saveSpy,
        },
      });

      // Manual save to establish baseline
      await editor.saveDraft(true);
      expect(saveSpy).toHaveBeenCalledTimes(1);

      // Re-trigger automatic save with identical content
      await editor.autosaveManager?.saveDraft(false);
      // Spy should still only have been called once!
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Save & Draft Restoration', () => {
    it('executes immediate manual save when saveDraft(true) is invoked', async () => {
      let savedDraft: DraftData | null = null;
      editor = createEditor({
        element: container,
        content: '<p>Important document</p>',
        autosave: {
          storageType: 'memory',
        },
      });

      editor.on('autosave:saved', ({ draft }: { draft: DraftData }) => {
        savedDraft = draft;
      });

      const success = await editor.saveDraft(true);
      expect(success).toBe(true);
      expect(savedDraft).not.toBeNull();
      expect((savedDraft as any)?.text).toBe('Important document');
      expect(editor.hasDraft()).toBe(true);
    });

    it('restores draft content into editor and updates status', () => {
      editor = createEditor({
        element: container,
        content: '<p>Original Content</p>',
        autosave: {
          storageType: 'memory',
        },
      });

      // Seed a draft into storage
      const draftData: DraftData = {
        id: 'default',
        content: '<p>Recovered Autosaved Draft</p>',
        html: '<p>Recovered Autosaved Draft</p>',
        text: 'Recovered Autosaved Draft',
        updatedAt: Date.now(),
        checksum: calculateChecksum('<p>Recovered Autosaved Draft</p>'),
      };

      let restoredFired = false;
      editor.on('autosave:restored', () => {
        restoredFired = true;
      });

      const restored = editor.restoreDraft(draftData);
      expect(restored).toBe(true);
      expect(restoredFired).toBe(true);
      expect(editor.getHTML()).toContain('Recovered Autosaved Draft');
      expect(editor.getAutosaveStatus()).toBe('saved');
    });

    it('clears stored draft when clearDraft() is called', async () => {
      editor = createEditor({
        element: container,
        content: '<p>Temp content</p>',
        autosave: {
          storageType: 'memory',
        },
      });

      await editor.saveDraft(true);
      expect(editor.hasDraft()).toBe(true);

      const cleared = editor.clearDraft();
      expect(cleared).toBe(true);
      expect(editor.hasDraft()).toBe(false);
      expect(editor.getDraft()).toBeNull();
    });
  });

  describe('Graceful Error Handling', () => {
    it('transitions to error status and emits autosave:error on failure', async () => {
      let errorEmitted = false;
      editor = createEditor({
        element: container,
        content: '<p>Error test</p>',
        autosave: {
          storageType: 'memory',
          saveHandler: () => {
            throw new Error('Database connection failed');
          },
        },
      });

      editor.on('autosave:error', () => {
        errorEmitted = true;
      });

      const res = await editor.saveDraft(true);
      expect(res).toBe(false);
      expect(editor.getAutosaveStatus()).toBe('error');
      expect(errorEmitted).toBe(true);
    });
  });

  describe('AutosaveIndicator UI Component', () => {
    it('creates DOM indicator and reflects saving, saved, unsaved and error states', () => {
      editor = createEditor({
        element: container,
        content: '<p>UI Test</p>',
        autosave: { storageType: 'memory' },
      });

      const indicator = new AutosaveIndicator(editor);
      const el = indicator.getElement();

      expect(el.querySelector('.ue-autosave-status')).not.toBeNull();

      // Test Saved state
      indicator.updateStatus('saved', 'just now');
      expect(el.innerHTML).toContain('Saved');

      // Test Saving state
      indicator.updateStatus('saving');
      expect(el.innerHTML).toContain('Saving...');
      expect(el.querySelector('.ue-autosave-spin')).not.toBeNull();

      // Test Unsaved state
      indicator.updateStatus('unsaved');
      expect(el.innerHTML).toContain('Unsaved changes');

      // Test Error state
      indicator.updateStatus('error');
      expect(el.innerHTML).toContain('Save failed');
      expect(el.querySelector('.ue-autosave-retry')).not.toBeNull();

      indicator.destroy();
    });

    it('renders draft prompt banner when a draft is detected', () => {
      editor = createEditor({
        element: container,
        content: '<p>Prompt Test</p>',
        autosave: { storageType: 'memory' },
      });

      const indicator = new AutosaveIndicator(editor);
      const el = indicator.getElement();

      const testDraft: DraftData = {
        id: 'test',
        content: '<p>Unsaved draft</p>',
        updatedAt: 1700000000000,
      };

      indicator.showDraftPrompt(testDraft);
      expect(el.querySelector('.ue-draft-prompt-inner')).not.toBeNull();
      expect(el.querySelector('.ue-draft-restore-btn')).not.toBeNull();
      expect(el.querySelector('.ue-draft-discard-btn')).not.toBeNull();

      indicator.hideDraftPrompt();
      const promptEl = el.querySelector('.ue-draft-prompt') as HTMLElement;
      expect(promptEl.style.display).toBe('none');

      indicator.destroy();
    });
  });

  describe('Relative Time Formatting', () => {
    it('formats last saved time accurately', async () => {
      editor = createEditor({
        element: container,
        content: '<p>Time format</p>',
        autosave: { storageType: 'memory' },
      });

      await editor.saveDraft(true);
      const timeStr = editor.autosaveManager?.formatLastSavedTime();
      expect(timeStr).toBe('just now');
    });
  });

  describe('Keyboard Shortcuts & Advanced Features', () => {
    it('triggers manual save on Ctrl+S / Cmd+S keydown event', async () => {
      let saved = false;
      editor = createEditor({
        element: container,
        content: '<p>Shortcut test</p>',
        autosave: {
          storageType: 'memory',
          enableKeyboardShortcut: true,
        },
      });

      editor.on('autosave:saved', () => {
        saved = true;
      });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      const editorDom = editor.tiptap?.view?.dom || container;
      editorDom.dispatchEvent(event);

      // Allow async save to settle
      await Promise.resolve();

      expect(saved).toBe(true);
      expect(editor.getAutosaveStatus()).toBe('saved');
    });

    it('persists string HTML format when format is set to html', async () => {
      editor = createEditor({
        element: container,
        content: '<p>HTML format persistence</p>',
        autosave: {
          storageType: 'memory',
          format: 'html',
        },
      });

      await editor.saveDraft(true);
      const draft = editor.getDraft();

      expect(draft).not.toBeNull();
      expect(typeof draft?.content).toBe('string');
      expect(draft?.content).toContain('HTML format persistence');
    });

    it('emits autosave:draft-detected on initialization if an existing draft is present', () => {
      // Pre-seed storage
      const storage = new AutosaveStorage('memory');
      const seedDraft: DraftData = {
        id: 'seed-doc',
        documentId: 'seed-doc',
        content: '<p>Existing previous draft</p>',
        html: '<p>Existing previous draft</p>',
        updatedAt: Date.now() - 5000,
        checksum: 'unique-seed-checksum-123',
      };
      storage.set('ue-draft-seed-doc', seedDraft);

      let detected = false;
      editor = createEditor({
        element: container,
        content: '<p>Initial clean text</p>',
        autosave: {
          documentId: 'seed-doc',
          storageType: 'memory',
          promptOnDraftDetected: true,
        },
      });

      editor.on('autosave:draft-detected', () => {
        detected = true;
      });

      // Directly trigger draft check to verify event
      (editor.autosaveManager as any)?.checkExistingDraft();

      expect(detected).toBe(true);
      expect(editor.hasDraft()).toBe(true);
    });

    it('updates config dynamically via updateConfig()', () => {
      editor = createEditor({
        element: container,
        content: '<p>Config update</p>',
        autosave: {
          storageType: 'memory',
          debounceMs: 1000,
        },
      });

      editor.autosaveManager?.updateConfig({ debounceMs: 200 });
      expect((editor.autosaveManager as any).config.debounceMs).toBe(200);
    });
  });
});

