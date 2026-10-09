<template>
  <aside class="ue-comment-sidebar">
    <!-- Header -->
    <div class="ue-comment-header">
      <div class="ue-comment-title-group">
        <span class="ue-comment-title">💬 Document Comments</span>
        <span class="ue-comment-active-count">{{ activeCount }} active</span>
      </div>
      <button class="ue-comment-close-btn" @click="$emit('close')" title="Close comments">
        ✕
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="ue-comment-filters">
      <button
        class="ue-comment-tab"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        All ({{ comments.length }})
      </button>
      <button
        class="ue-comment-tab"
        :class="{ active: filter === 'active' }"
        @click="filter = 'active'"
      >
        Active ({{ activeCount }})
      </button>
      <button
        class="ue-comment-tab"
        :class="{ active: filter === 'resolved' }"
        @click="filter = 'resolved'"
      >
        Resolved ({{ resolvedCount }})
      </button>
    </div>

    <!-- New Comment Box -->
    <div class="ue-comment-compose">
      <div v-if="selectedText" class="ue-compose-quote">
        <span>Anchor:</span> "{{ truncateText(selectedText, 60) }}"
      </div>
      <textarea
        v-model="newCommentText"
        class="ue-compose-input"
        placeholder="Add a comment... (Type @ to mention)"
        rows="2"
        @keydown.enter.ctrl.prevent="submitComment"
      />
      <div class="ue-compose-footer">
        <span class="ue-compose-hint">Ctrl + Enter to send</span>
        <button
          class="ue-compose-btn"
          :disabled="!newCommentText.trim()"
          @click="submitComment"
        >
          Comment
        </button>
      </div>
    </div>

    <!-- Comments List -->
    <div class="ue-comment-list">
      <div v-if="filteredComments.length === 0" class="ue-comment-empty">
        <span>No {{ filter === 'all' ? '' : filter }} comments yet.</span>
      </div>

      <div
        v-for="comment in filteredComments"
        :key="comment.id"
        class="ue-comment-card"
        :class="{
          'is-resolved': comment.status === 'resolved',
          'is-selected': selectedCommentId === comment.id,
        }"
        @click="$emit('select-comment', comment)"
      >
        <!-- Author & Status Header -->
        <div class="ue-card-header">
          <div class="ue-card-author">
            <span class="ue-author-avatar">{{ getInitials(comment.userName || 'Anonymous') }}</span>
            <div class="ue-author-info">
              <span class="ue-author-name">{{ comment.userName || 'Anonymous' }}</span>
              <span class="ue-comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
          </div>
          <span
            class="ue-card-badge"
            :class="comment.status"
          >
            {{ comment.status }}
          </span>
        </div>

        <!-- Anchored Quote -->
        <div v-if="comment.selectedText" class="ue-comment-quote">
          "{{ comment.selectedText }}"
        </div>

        <!-- Comment Content -->
        <div class="ue-card-body" v-html="highlightMentions(comment.content)" />

        <!-- Actions -->
        <div class="ue-card-actions">
          <button class="ue-action-btn" @click.stop="toggleReplyBox(comment.id)">
            Reply ({{ comment.replies?.length || 0 }})
          </button>
          <button
            v-if="comment.status === 'active'"
            class="ue-action-btn resolve"
            @click.stop="$emit('resolve-comment', comment.id)"
          >
            ✓ Resolve
          </button>
          <button
            v-else
            class="ue-action-btn reopen"
            @click.stop="$emit('reopen-comment', comment.id)"
          >
            ↺ Reopen
          </button>
          <button
            class="ue-action-btn delete"
            @click.stop="$emit('delete-comment', comment.id)"
          >
            🗑
          </button>
        </div>

        <!-- Threaded Replies -->
        <div v-if="comment.replies && comment.replies.length > 0" class="ue-comment-replies">
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="ue-reply-item"
          >
            <div class="ue-reply-header">
              <span class="ue-reply-avatar">{{ getInitials(reply.userName || 'A') }}</span>
              <span class="ue-reply-author">{{ reply.userName || 'Anonymous' }}</span>
              <span class="ue-reply-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="ue-reply-body" v-html="highlightMentions(reply.content)" />
          </div>
        </div>

        <!-- Reply Input Box -->
        <div v-if="activeReplyId === comment.id" class="ue-reply-compose">
          <input
            v-model="replyText"
            class="ue-reply-input"
            placeholder="Reply to thread..."
            @keydown.enter.prevent="submitReply(comment.id)"
          />
          <button
            class="ue-reply-send-btn"
            :disabled="!replyText.trim()"
            @click.stop="submitReply(comment.id)"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import type { CommentItem } from '@universal-editor/core';

const props = defineProps({
  comments: {
    type: Array as PropType<CommentItem[]>,
    default: () => [],
  },
  selectedText: {
    type: String,
    default: '',
  },
  selectedCommentId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add-comment', data: { content: string; selectedText?: string }): void;
  (e: 'reply-comment', data: { commentId: string | number; content: string }): void;
  (e: 'resolve-comment', commentId: string | number): void;
  (e: 'reopen-comment', commentId: string | number): void;
  (e: 'delete-comment', commentId: string | number): void;
  (e: 'select-comment', comment: CommentItem): void;
}>();

const filter = ref<'all' | 'active' | 'resolved'>('all');
const newCommentText = ref('');
const replyText = ref('');
const activeReplyId = ref<string | number | null>(null);

const activeCount = computed(() => {
  return props.comments.filter((c) => c.status === 'active').length;
});

const resolvedCount = computed(() => {
  return props.comments.filter((c) => c.status === 'resolved').length;
});

const filteredComments = computed(() => {
  if (filter.value === 'active') {
    return props.comments.filter((c) => c.status === 'active');
  }
  if (filter.value === 'resolved') {
    return props.comments.filter((c) => c.status === 'resolved');
  }
  return props.comments;
});

function toggleReplyBox(id: string | number) {
  if (activeReplyId.value === id) {
    activeReplyId.value = null;
  } else {
    activeReplyId.value = id;
    replyText.value = '';
  }
}

function submitComment() {
  if (!newCommentText.value.trim()) return;

  emit('add-comment', {
    content: newCommentText.value.trim(),
    selectedText: props.selectedText || undefined,
  });

  newCommentText.value = '';
}

function submitReply(commentId: string | number) {
  if (!replyText.value.trim()) return;

  emit('reply-comment', {
    commentId,
    content: replyText.value.trim(),
  });

  replyText.value = '';
  activeReplyId.value = null;
}

function highlightMentions(text: string): string {
  if (!text) return '';
  return text.replace(/@([a-zA-Z0-9_\.\-]+)/g, '<span class="ue-mention-tag">@$1</span>');
}

function truncateText(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTime(isoDate?: string): string {
  if (!isoDate) return 'Just now';
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.ue-comment-sidebar {
  display: flex;
  flex-direction: column;
  background: #0f172a;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  overflow: hidden;
}

.ue-comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ue-comment-title {
  font-weight: 600;
  font-size: 13px;
  color: #f1f5f9;
}

.ue-comment-active-count {
  font-size: 11px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  padding: 2px 6px;
  border-radius: 9999px;
  margin-left: 6px;
}

.ue-comment-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.ue-comment-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.ue-comment-filters {
  display: flex;
  padding: 6px 12px;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ue-comment-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ue-comment-tab.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 600;
}

.ue-comment-compose {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.ue-compose-quote {
  font-size: 11px;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border-left: 2px solid #f59e0b;
  padding: 4px 8px;
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
}

.ue-compose-input {
  width: 100%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  padding: 8px;
  font-size: 12px;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
}

.ue-compose-input:focus {
  outline: none;
  border-color: #6366f1;
}

.ue-compose-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.ue-compose-hint {
  font-size: 10px;
  color: #64748b;
}

.ue-compose-btn {
  background: #6366f1;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ue-compose-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ue-compose-btn:not(:disabled):hover {
  background: #4f46e5;
}

.ue-comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.ue-comment-empty {
  text-align: center;
  color: #64748b;
  font-size: 12px;
  padding: 30px 16px;
}

.ue-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ue-card-author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ue-author-avatar,
.ue-reply-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.ue-author-name {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
}

.ue-comment-time {
  font-size: 10px;
  color: #64748b;
  margin-left: 4px;
}

.ue-card-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
}

.ue-card-badge.active {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

.ue-card-badge.resolved {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.ue-card-body {
  font-size: 12px;
  line-height: 1.5;
  color: #e2e8f0;
  margin-bottom: 8px;
}

:deep(.ue-mention-tag) {
  color: #818cf8;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
}

.ue-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.ue-action-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
}

.ue-action-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.ue-action-btn.resolve {
  color: #34d399;
}

.ue-action-btn.reopen {
  color: #fbbf24;
}

.ue-action-btn.delete {
  color: #f87171;
  margin-left: auto;
}

.ue-reply-item {
  padding: 6px 0;
  font-size: 11px;
}

.ue-reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.ue-reply-author {
  font-weight: 600;
  color: #cbd5e1;
}

.ue-reply-time {
  font-size: 10px;
  color: #64748b;
}

.ue-reply-body {
  color: #94a3b8;
  line-height: 1.4;
}

.ue-reply-compose {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.ue-reply-input {
  flex: 1;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #fff;
}

.ue-reply-input:focus {
  outline: none;
  border-color: #6366f1;
}

.ue-reply-send-btn {
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}
</style>
