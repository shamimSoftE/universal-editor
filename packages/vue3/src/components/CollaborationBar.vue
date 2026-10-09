<template>
  <div class="ue-collab-bar">
    <!-- Left: Collaborator Avatars & Presence -->
    <div class="ue-collab-left">
      <div class="ue-collab-label">Collaborating:</div>
      <div class="ue-collab-users">
        <div
          v-for="presence in presences"
          :key="presence.user.id"
          class="ue-collab-avatar"
          :style="{ backgroundColor: presence.user.color }"
          :title="`${presence.user.name} (${presence.isEditing ? 'Editing...' : 'Viewing'})`"
        >
          <span>{{ getInitials(presence.user.name) }}</span>
          <span
            class="ue-collab-avatar-status"
            :class="{ 'is-editing': presence.isEditing }"
          />
        </div>
      </div>
      <span class="ue-collab-count">
        {{ presences.length }} active {{ presences.length === 1 ? 'user' : 'users' }}
      </span>
    </div>

    <!-- Right: Concurrency Lock & Comments Drawer Toggle -->
    <div class="ue-collab-right">
      <!-- Lock Controls -->
      <div v-if="lockState" class="ue-lock-control">
        <div v-if="lockState.isLocked && lockState.isCurrentOwner" class="ue-lock-pill is-owner">
          <span class="ue-lock-dot green"></span>
          <span>You hold edit lock</span>
          <button class="ue-lock-btn" @click="$emit('release-lock')" title="Release exclusive lock">
            Release
          </button>
        </div>
        <div v-else-if="lockState.isLocked" class="ue-lock-pill is-peer" :title="`Locked by ${lockState.lockedBy?.name || 'collaborator'}`">
          <span class="ue-lock-dot red"></span>
          <span>Locked by {{ lockState.lockedBy?.name || 'Peer' }}</span>
        </div>
        <button
          v-else
          class="ue-lock-action-btn"
          @click="$emit('acquire-lock')"
          title="Acquire exclusive editing lock"
        >
          🔒 Lock Document
        </button>
      </div>

      <!-- Comments Toggle Button -->
      <button
        class="ue-collab-comments-toggle"
        :class="{ active: showComments }"
        @click="$emit('toggle-comments')"
        title="Toggle comments sidebar"
      >
        💬 Comments
        <span v-if="activeCommentsCount > 0" class="ue-comment-badge">
          {{ activeCommentsCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { UserPresence, DocumentLockState } from '@universal-editor/core';

defineProps({
  presences: {
    type: Array as PropType<UserPresence[]>,
    default: () => [],
  },
  lockState: {
    type: Object as PropType<DocumentLockState | null>,
    default: null,
  },
  showComments: {
    type: Boolean,
    default: false,
  },
  activeCommentsCount: {
    type: Number,
    default: 0,
  },
});

defineEmits<{
  (e: 'toggle-comments'): void;
  (e: 'acquire-lock'): void;
  (e: 'release-lock'): void;
}>();

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
</script>

<style scoped>
.ue-collab-left,
.ue-collab-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ue-collab-label {
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.ue-collab-count {
  color: #94a3b8;
  font-size: 12px;
}

.ue-lock-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.ue-lock-pill.is-owner {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.ue-lock-pill.is-peer {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.ue-lock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.ue-lock-dot.green {
  background: #10b981;
}

.ue-lock-dot.red {
  background: #ef4444;
}

.ue-lock-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ue-lock-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ue-lock-action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ue-lock-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.ue-collab-comments-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ue-collab-comments-toggle:hover,
.ue-collab-comments-toggle.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #a5b4fc;
}

.ue-comment-badge {
  background: #f59e0b;
  color: #0f172a;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 9999px;
}
</style>
