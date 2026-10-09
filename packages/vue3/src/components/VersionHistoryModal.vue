<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { VersionSnapshot } from '@universal-editor/core';
import { computeDiff, type DiffResult } from '@universal-editor/utils';

const props = defineProps<{
  modelValue: boolean;
  versions?: VersionSnapshot[];
  currentContent?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'restore', version: VersionSnapshot): void;
}>();

const selectedVersion = ref<VersionSnapshot | null>(null);
const viewMode = ref<'preview' | 'diff'>('diff');

const versionList = computed(() => {
  return props.versions || [];
});

watch(
  () => props.versions,
  newVersions => {
    if (newVersions && newVersions.length > 0 && !selectedVersion.value) {
      selectedVersion.value = newVersions[0];
    }
  },
  { immediate: true }
);

const diffResult = computed<DiffResult | null>(() => {
  if (!selectedVersion.value) return null;
  const baseHtml = selectedVersion.value.contentHtml || '';
  const currentHtml = props.currentContent || '';
  return computeDiff(baseHtml, currentHtml);
});

function selectVersion(v: VersionSnapshot) {
  selectedVersion.value = v;
}

function handleRestore() {
  if (selectedVersion.value) {
    emit('restore', selectedVersion.value);
    close();
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>

<template>
  <div v-if="modelValue" class="ue-version-history-modal" @click.self="close">
    <div class="ue-version-history-container">
      <!-- Header -->
      <div class="ue-version-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc;">
            Document Revision History
          </h3>
          <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; font-weight: 600;">
            {{ versionList.length }} Revisions
          </span>
        </div>
        <button
          type="button"
          class="ue-modal-close"
          style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.25rem;"
          @click="close"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="ue-version-body">
        <!-- Sidebar Timeline -->
        <div class="ue-version-sidebar">
          <div
            v-for="ver in versionList"
            :key="ver.id"
            class="ue-version-item"
            :class="{ active: selectedVersion?.id === ver.id }"
            @click="selectVersion(ver)"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; font-size: 0.85rem; color: #60a5fa;">
                v{{ ver.version }}
              </span>
              <span style="font-size: 0.72rem; color: #94a3b8;">
                {{ ver.formattedTime || ver.createdAt }}
              </span>
            </div>
            <div style="font-size: 0.82rem; color: #e2e8f0; margin-bottom: 4px; font-weight: 500;">
              {{ ver.note || 'Revision snapshot' }}
            </div>
            <div style="font-size: 0.72rem; color: #64748b;">
              {{ ver.wordCount || 0 }} words
            </div>
          </div>

          <div v-if="versionList.length === 0" style="padding: 20px; text-align: center; color: #64748b; font-size: 0.85rem;">
            No revision history recorded yet.
          </div>
        </div>

        <!-- Preview & Diff Panel -->
        <div class="ue-version-preview" style="display: flex; flex-direction: column;">
          <!-- Controls Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: flex; gap: 8px;">
              <button
                type="button"
                :style="{
                  background: viewMode === 'diff' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                  color: viewMode === 'diff' ? '#fff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }"
                @click="viewMode = 'diff'"
              >
                Visual Diff (vs Current)
              </button>
              <button
                type="button"
                :style="{
                  background: viewMode === 'preview' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                  color: viewMode === 'preview' ? '#fff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }"
                @click="viewMode = 'preview'"
              >
                Snapshot Preview
              </button>
            </div>

            <!-- Restore Action Button -->
            <button
              v-if="selectedVersion"
              type="button"
              style="background: #10b981; color: #fff; padding: 6px 14px; border-radius: 6px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease;"
              @click="handleRestore"
            >
              🔄 Restore This Version (v{{ selectedVersion.version }})
            </button>
          </div>

          <!-- Diff Statistics Badge Bar -->
          <div v-if="viewMode === 'diff' && diffResult" style="display: flex; gap: 10px; margin-bottom: 16px; align-items: center; font-size: 0.78rem;">
            <span style="color: #4ade80; background: rgba(34, 197, 94, 0.15); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
              +{{ diffResult.additions }} additions
            </span>
            <span style="color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
              -{{ diffResult.deletions }} deletions
            </span>
            <span style="color: #94a3b8;">
              {{ diffResult.unchanged }} unchanged words
            </span>
          </div>

          <!-- Content Render -->
          <div style="flex: 1; overflow-y: auto; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
            <div
              v-if="viewMode === 'diff' && diffResult"
              v-html="diffResult.diffHtml"
            ></div>
            <div
              v-else-if="selectedVersion"
              v-html="selectedVersion.contentHtml"
            ></div>
            <div v-else style="color: #64748b; padding: 40px; text-align: center;">
              Select a version from the left timeline to preview or compare.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
