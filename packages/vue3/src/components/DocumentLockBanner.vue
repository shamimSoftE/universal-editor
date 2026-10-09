<template>
  <div
    v-if="lockState && lockState.isLocked"
    class="ue-lock-banner"
    :class="{ 'is-owner': lockState.isCurrentOwner }"
  >
    <div class="ue-lock-banner-content">
      <span class="ue-lock-banner-icon">
        {{ lockState.isCurrentOwner ? '🔒' : '⚠️' }}
      </span>
      <span v-if="lockState.isCurrentOwner">
        <strong>Exclusive Editing Lock Active:</strong> You hold the edit lock. Other collaborators are in viewer mode.
      </span>
      <span v-else>
        <strong>Document Locked:</strong> Currently being edited by
        <strong>{{ lockState.lockedBy?.name || 'another collaborator' }}</strong>. You are in read-only mode.
      </span>
    </div>

    <div class="ue-lock-banner-actions">
      <button
        v-if="lockState.isCurrentOwner"
        class="ue-lock-banner-btn release"
        @click="$emit('release')"
      >
        Release Lock
      </button>
      <button
        v-else
        class="ue-lock-banner-btn refresh"
        @click="$emit('refresh')"
      >
        Check Status
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { DocumentLockState } from '@universal-editor/core';

defineProps({
  lockState: {
    type: Object as PropType<DocumentLockState | null>,
    default: null,
  },
});

defineEmits<{
  (e: 'release'): void;
  (e: 'refresh'): void;
}>();
</script>

<style scoped>
.ue-lock-banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ue-lock-banner-icon {
  font-size: 14px;
}

.ue-lock-banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ue-lock-banner-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ue-lock-banner-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.ue-lock-banner-btn.release {
  background: rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
}

.ue-lock-banner-btn.release:hover {
  background: rgba(16, 185, 129, 0.5);
}
</style>
