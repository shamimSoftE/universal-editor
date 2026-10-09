import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { computeDiff, tokenize, escapeDiffHtml } from '@universal-editor/utils';
import { VersionHistoryManager, type VersionSnapshot } from '@universal-editor/core';
import { VersionHistoryModal } from '@universal-editor/vue3';

describe('Phase 19: Document Version History & Diff Engine', () => {
  describe('Diff Engine & Utilities (packages/utils)', () => {
    it('tokenizes plain text and HTML tags correctly', () => {
      const input = '<p>Hello <strong>World</strong> 2026!</p>';
      const tokens = tokenize(input);

      expect(tokens).toContain('<p>');
      expect(tokens).toContain('Hello');
      expect(tokens).toContain('<strong>');
      expect(tokens).toContain('World');
      expect(tokens).toContain('</strong>');
      expect(tokens).toContain('2026');
      expect(tokens).toContain('</p>');
    });

    it('escapes dangerous HTML entities in diff markup', () => {
      const malicious = '<script>alert("xss")</script>';
      const escaped = escapeDiffHtml(malicious);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&quot;xss&quot;');
    });

    it('detects word additions, deletions, and unchanged sections', () => {
      const oldText = 'The quick brown fox jumps over the lazy dog.';
      const newText = 'The swift brown fox jumps over the sleeping dog.';

      const result = computeDiff(oldText, newText);

      expect(result.additions).toBeGreaterThan(0);
      expect(result.deletions).toBeGreaterThan(0);
      expect(result.unchanged).toBeGreaterThan(0);
      expect(result.diffHtml).toContain('<ins class="ue-diff-ins">swift</ins>');
      expect(result.diffHtml).toContain('<del class="ue-diff-del">quick</del>');
      expect(result.diffHtml).toContain('<ins class="ue-diff-ins">sleeping</ins>');
      expect(result.diffHtml).toContain('<del class="ue-diff-del">lazy</del>');
    });

    it('handles identical content with zero additions and zero deletions', () => {
      const content = '<p>Identical content throughout</p>';
      const result = computeDiff(content, content);

      expect(result.additions).toBe(0);
      expect(result.deletions).toBe(0);
      expect(result.diffHtml).not.toContain('<ins');
      expect(result.diffHtml).not.toContain('<del');
    });

    it('handles creation from empty content', () => {
      const oldText = '';
      const newText = '<p>First paragraph created</p>';

      const result = computeDiff(oldText, newText);

      expect(result.additions).toBeGreaterThan(0);
      expect(result.deletions).toBe(0);
      expect(result.diffHtml).toContain('<ins class="ue-diff-ins">');
    });

    it('handles complete deletion to empty content', () => {
      const oldText = '<p>To be completely deleted</p>';
      const newText = '';

      const result = computeDiff(oldText, newText);

      expect(result.additions).toBe(0);
      expect(result.deletions).toBeGreaterThan(0);
      expect(result.diffHtml).toContain('<del class="ue-diff-del">');
    });
  });

  describe('VersionHistoryManager (packages/core)', () => {
    it('initializes with document options and empty history', () => {
      const manager = new VersionHistoryManager({
        documentId: 42,
        maxVersions: 10,
        apiEndpoint: '/api/editor/documents/42/versions',
      });

      expect(manager.count).toBe(0);
      expect(manager.getVersions()).toEqual([]);
      expect(manager.apiEndpointUrl).toBe('/api/editor/documents/42/versions');
    });

    it('creates version snapshots with auto-incrementing numbers and word count', () => {
      const manager = new VersionHistoryManager({ documentId: 100 });

      const v1 = manager.createSnapshot(
        '<p>First version with five words here.</p>',
        'Initial commit',
        { type: 'doc' },
        'Project Architecture'
      );

      expect(v1.version).toBe(1);
      expect(v1.note).toBe('Initial commit');
      expect(v1.wordCount).toBe(6);
      expect(v1.documentId).toBe(100);
      expect(v1.title).toBe('Project Architecture');
      expect(manager.count).toBe(1);

      const v2 = manager.createSnapshot(
        '<p>Second version with modified text content.</p>',
        'Added more details'
      );

      expect(v2.version).toBe(2);
      expect(v2.note).toBe('Added more details');
      expect(manager.count).toBe(2);
    });

    it('retrieves versions by snapshot ID or version number', () => {
      const manager = new VersionHistoryManager();
      const v1 = manager.createSnapshot('<p>V1</p>');
      const v2 = manager.createSnapshot('<p>V2</p>');

      const foundByNum = manager.getVersion(1);
      expect(foundByNum?.id).toBe(v1.id);

      const foundById = manager.getVersion(v2.id);
      expect(foundById?.version).toBe(2);

      expect(manager.getVersion(999)).toBeUndefined();
    });

    it('restores previous version and records an audit revision', () => {
      const manager = new VersionHistoryManager();
      manager.createSnapshot('<p>Original Draft Content</p>', 'v1');
      manager.createSnapshot('<p>Accidental Deletions</p>', 'v2');

      const restored = manager.restoreVersion(1);

      expect(restored).toBeDefined();
      expect(restored?.version).toBe(3);
      expect(restored?.note).toContain('Restored from version 1');
      expect(restored?.contentHtml).toBe('<p>Original Draft Content</p>');
      expect(manager.count).toBe(3);
    });

    it('compares two versions in history', () => {
      const manager = new VersionHistoryManager();
      manager.createSnapshot('<p>Alpha Beta Gamma</p>');
      manager.createSnapshot('<p>Alpha Delta Gamma</p>');

      const diff = manager.compareVersions(1, 2);

      expect(diff.additions).toBeGreaterThan(0);
      expect(diff.deletions).toBeGreaterThan(0);
      expect(diff.diffHtml).toContain('<ins class="ue-diff-ins">Delta</ins>');
      expect(diff.diffHtml).toContain('<del class="ue-diff-del">Beta</del>');
    });

    it('enforces maxVersions limit by pruning oldest revisions', () => {
      const manager = new VersionHistoryManager({ maxVersions: 3 });

      manager.createSnapshot('<p>V1</p>');
      manager.createSnapshot('<p>V2</p>');
      manager.createSnapshot('<p>V3</p>');
      manager.createSnapshot('<p>V4</p>');
      manager.createSnapshot('<p>V5</p>');

      expect(manager.count).toBe(3);
      const versions = manager.getVersions();
      expect(versions.map(v => v.version)).toEqual([5, 4, 3]);
      expect(manager.getVersion(1)).toBeUndefined();
    });

    it('loads external snapshot history and updates current version index', () => {
      const manager = new VersionHistoryManager();

      const externalSnapshots: VersionSnapshot[] = [
        {
          id: 'ext-1',
          version: 1,
          contentHtml: '<p>External 1</p>',
          wordCount: 2,
          createdAt: new Date().toISOString(),
          formattedTime: '10:00:00',
        },
        {
          id: 'ext-2',
          version: 2,
          contentHtml: '<p>External 2</p>',
          wordCount: 2,
          createdAt: new Date().toISOString(),
          formattedTime: '10:05:00',
        },
      ];

      manager.loadVersions(externalSnapshots);
      expect(manager.count).toBe(2);

      const next = manager.createSnapshot('<p>External 3</p>');
      expect(next.version).toBe(3);
    });

    it('clears history completely', () => {
      const manager = new VersionHistoryManager();
      manager.createSnapshot('<p>Test</p>');
      expect(manager.count).toBe(1);

      manager.clearHistory();
      expect(manager.count).toBe(0);
      expect(manager.getVersions()).toEqual([]);
    });
  });

  describe('VersionHistoryModal.vue Component (packages/vue3)', () => {
    const sampleVersions: VersionSnapshot[] = [
      {
        id: 'ver-2',
        version: 2,
        title: 'Document Title',
        note: 'Updated section 2',
        contentHtml: '<p>Updated revision content</p>',
        wordCount: 3,
        createdAt: '2026-09-29T10:00:00.000Z',
        formattedTime: '10:00 AM',
      },
      {
        id: 'ver-1',
        version: 1,
        title: 'Document Title',
        note: 'Initial draft',
        contentHtml: '<p>Initial draft content</p>',
        wordCount: 3,
        createdAt: '2026-09-29T09:00:00.000Z',
        formattedTime: '09:00 AM',
      },
    ];

    it('renders modal dialog when modelValue is true', () => {
      const wrapper = mount(VersionHistoryModal, {
        props: {
          modelValue: true,
          versions: sampleVersions,
          currentContent: '<p>Updated revision content</p>',
        },
      });

      expect(wrapper.find('.ue-version-history-modal').exists()).toBe(true);
      expect(wrapper.text()).toContain('Document Revision History');
      expect(wrapper.text()).toContain('2 Revisions');
      expect(wrapper.text()).toContain('v2');
      expect(wrapper.text()).toContain('v1');
    });

    it('does not render dialog when modelValue is false', () => {
      const wrapper = mount(VersionHistoryModal, {
        props: {
          modelValue: false,
          versions: sampleVersions,
        },
      });

      expect(wrapper.find('.ue-version-history-modal').exists()).toBe(false);
    });

    it('switches between visual diff and snapshot preview modes', async () => {
      const wrapper = mount(VersionHistoryModal, {
        props: {
          modelValue: true,
          versions: sampleVersions,
          currentContent: '<p>Live updated content with new words</p>',
        },
      });

      // Default is diff mode
      expect(wrapper.text()).toContain('additions');

      // Click Snapshot Preview button
      const previewBtn = wrapper.findAll('button').find(b => b.text().includes('Snapshot Preview'));
      expect(previewBtn).toBeDefined();
      await previewBtn?.trigger('click');

      expect(wrapper.html()).toContain('Updated revision content');
    });

    it('emits restore event when Restore button is clicked', async () => {
      const wrapper = mount(VersionHistoryModal, {
        props: {
          modelValue: true,
          versions: sampleVersions,
          currentContent: '<p>Current</p>',
        },
      });

      const restoreBtn = wrapper.findAll('button').find(b => b.text().includes('Restore This Version'));
      expect(restoreBtn).toBeDefined();
      await restoreBtn?.trigger('click');

      expect(wrapper.emitted('restore')).toBeTruthy();
      expect(wrapper.emitted('restore')?.[0][0]).toEqual(sampleVersions[0]);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('emits update:modelValue false on close click', async () => {
      const wrapper = mount(VersionHistoryModal, {
        props: {
          modelValue: true,
          versions: sampleVersions,
        },
      });

      const closeBtn = wrapper.find('.ue-modal-close');
      await closeBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });
});
