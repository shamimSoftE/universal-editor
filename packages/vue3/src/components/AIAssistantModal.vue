<template>
  <div v-if="modelValue" class="ue-ai-modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="ue-ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
      <!-- Header -->
      <div class="ue-ai-header">
        <div class="ue-ai-title" id="ai-modal-title">
          <span class="ue-ai-sparkle">✨</span>
          <span>Universal AI Assistant</span>
        </div>
        <button class="ue-ai-close-btn" @click="$emit('update:modelValue', false)" title="Close AI Assistant">
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="ue-ai-body">
        <!-- Target Selection Quote -->
        <div v-if="targetText" class="ue-ai-target-quote">
          <span class="ue-ai-quote-label">Selected Text:</span>
          <p class="ue-ai-quote-content">"{{ truncate(targetText, 140) }}"</p>
        </div>

        <!-- Custom Prompt Input -->
        <div class="ue-ai-prompt-bar">
          <input
            v-model="customInstruction"
            type="text"
            class="ue-ai-prompt-input"
            placeholder="Ask AI to write, rewrite, expand, translate, or customize..."
            @keydown.enter.prevent="executeCustomPrompt"
          />
          <button
            class="ue-ai-prompt-btn"
            :disabled="!customInstruction.trim() || isLoading"
            @click="executeCustomPrompt"
          >
            Ask AI
          </button>
        </div>

        <!-- Tone & Language Sub-selectors (Conditional) -->
        <div v-if="selectedAction === 'rewrite'" class="ue-ai-suboption">
          <label>Tone:</label>
          <div class="ue-ai-pill-group">
            <button
              v-for="t in tones"
              :key="t"
              class="ue-ai-pill"
              :class="{ active: selectedTone === t }"
              @click="selectedTone = t"
            >
              {{ t }}
            </button>
          </div>
        </div>

        <div v-if="selectedAction === 'translate'" class="ue-ai-suboption">
          <label>Target Language:</label>
          <div class="ue-ai-pill-group">
            <button
              v-for="l in languages"
              :key="l"
              class="ue-ai-pill"
              :class="{ active: selectedLanguage === l }"
              @click="selectedLanguage = l"
            >
              {{ l }}
            </button>
          </div>
        </div>

        <!-- Actions Grid (Visible when no result yet or for changing action) -->
        <div class="ue-ai-action-grid">
          <button
            v-for="action in actions"
            :key="action.id"
            class="ue-ai-action-card"
            :class="{ active: selectedAction === action.id }"
            :disabled="isLoading"
            @click="triggerAction(action.id)"
          >
            <span class="ue-ai-action-icon">{{ action.icon }}</span>
            <div class="ue-ai-action-info">
              <span class="ue-ai-action-title">{{ action.title }}</span>
              <span class="ue-ai-action-desc">{{ action.description }}</span>
            </div>
          </button>
        </div>

        <!-- Loading State Shimmer -->
        <div v-if="isLoading" class="ue-ai-shimmer">
          <span>✨ AI is generating transformation...</span>
        </div>

        <!-- Result Preview Box -->
        <div v-if="resultText && !isLoading" class="ue-ai-result-section">
          <div class="ue-ai-result-header">
            <span>Generated Result:</span>
            <button class="ue-ai-copy-btn" @click="copyResult" title="Copy to clipboard">
              📋 Copy
            </button>
          </div>
          <div class="ue-ai-preview-box">
            {{ resultText }}
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="ue-ai-footer">
        <button class="ue-btn-cancel" @click="$emit('update:modelValue', false)">
          Cancel
        </button>

        <template v-if="resultText && !isLoading">
          <button class="ue-btn-secondary" @click="reRunCurrentAction">
            🔄 Try Again
          </button>
          <button class="ue-btn-secondary" @click="applyResult('insertBelow')">
            ⬇️ Insert Below
          </button>
          <button class="ue-btn-primary" @click="applyResult('replace')">
            ✓ Replace Selection
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import {
  AIAssistantManager,
  AIActionType,
  AI_ACTIONS,
  AIProvider,
} from '@universal-editor/core';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  targetText: {
    type: String,
    default: '',
  },
  provider: {
    type: Object as PropType<AIProvider | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'apply', payload: { text: string; insertMode: 'replace' | 'insertBelow' }): void;
}>();

const manager = computed(() => {
  return new AIAssistantManager({
    provider: props.provider || undefined,
  });
});

const actions = AI_ACTIONS.filter((a) => a.id !== 'custom');
const selectedAction = ref<AIActionType>('improve');
const customInstruction = ref('');
const selectedTone = ref('professional');
const selectedLanguage = ref('Bengali');
const isLoading = ref(false);
const resultText = ref('');

const tones = ['professional', 'casual', 'concise', 'creative', 'academic'];
const languages = ['Bengali', 'Arabic', 'Spanish', 'French', 'German', 'Hindi', 'English'];

async function triggerAction(actionId: AIActionType) {
  selectedAction.value = actionId;
  const text = props.targetText || 'Universal Rich Text Editor delivers enterprise content editing.';

  isLoading.value = true;
  resultText.value = '';

  try {
    const res = await manager.value.executeAction(actionId, text, {
      tone: selectedTone.value as any,
      targetLanguage: selectedLanguage.value,
    });
    resultText.value = res.resultText;
  } catch (err: any) {
    resultText.value = `Error: ${err.message || 'AI request failed'}`;
  } finally {
    isLoading.value = false;
  }
}

async function executeCustomPrompt() {
  if (!customInstruction.value.trim()) return;

  const text = props.targetText || 'Universal Rich Text Editor';
  isLoading.value = true;
  resultText.value = '';
  selectedAction.value = 'custom';

  try {
    const res = await manager.value.executeAction('custom', text, {
      instruction: customInstruction.value.trim(),
    });
    resultText.value = res.resultText;
  } catch (err: any) {
    resultText.value = `Error: ${err.message || 'AI request failed'}`;
  } finally {
    isLoading.value = false;
  }
}

function reRunCurrentAction() {
  if (selectedAction.value === 'custom') {
    executeCustomPrompt();
  } else {
    triggerAction(selectedAction.value);
  }
}

function applyResult(insertMode: 'replace' | 'insertBelow') {
  if (!resultText.value) return;

  emit('apply', {
    text: resultText.value,
    insertMode,
  });

  emit('update:modelValue', false);
}

function copyResult() {
  if (resultText.value && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(resultText.value);
  }
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}
</script>

<style scoped>
.ue-ai-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.ue-ai-modal {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.2);
  border-radius: 14px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e2e8f0;
  font-family: inherit;
  animation: ueAiModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes ueAiModalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ue-ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.ue-ai-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.ue-ai-sparkle {
  font-size: 18px;
  filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.6));
}

.ue-ai-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ue-ai-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.ue-ai-action-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: inherit;
}

.ue-ai-action-card:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.4);
  transform: translateY(-1px);
}

.ue-ai-action-card.active {
  background: rgba(168, 85, 247, 0.18);
  border-color: #a855f7;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.25);
}

.ue-ai-action-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.ue-ai-action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ue-ai-action-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
}

.ue-ai-action-desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}

.ue-ai-shimmer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.2) 50%, rgba(168, 85, 247, 0.1) 100%);
  background-size: 200% 100%;
  animation: ueShimmer 1.5s infinite;
  border-radius: 8px;
  color: #c084fc;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px dashed rgba(168, 85, 247, 0.4);
}

@keyframes ueShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.ue-ai-preview-box {
  background: #090d16;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  max-height: 220px;
  overflow-y: auto;
}

.ue-ai-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.ue-ai-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.ue-ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.ue-ai-target-quote {
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #a855f7;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
}

.ue-ai-quote-label {
  color: #c084fc;
  font-weight: 600;
  margin-right: 6px;
}

.ue-ai-quote-content {
  color: #cbd5e1;
  font-style: italic;
  margin: 4px 0 0 0;
}

.ue-ai-prompt-bar {
  display: flex;
  gap: 8px;
}

.ue-ai-prompt-input {
  flex: 1;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-size: 13px;
}

.ue-ai-prompt-input:focus {
  outline: none;
  border-color: #a855f7;
}

.ue-ai-prompt-btn {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
}

.ue-ai-prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ue-ai-suboption {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.ue-ai-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ue-ai-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 11px;
  cursor: pointer;
}

.ue-ai-pill.active {
  background: #a855f7;
  border-color: #c084fc;
  color: #fff;
  font-weight: 600;
}

.ue-ai-result-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ue-ai-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #c084fc;
  font-weight: 600;
}

.ue-ai-copy-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}

.ue-ai-copy-btn:hover {
  color: #fff;
}

.ue-btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.ue-btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.ue-btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
</style>
