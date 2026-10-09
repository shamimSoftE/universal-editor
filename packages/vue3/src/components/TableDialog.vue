<script setup lang="ts">
import { ref, computed } from 'vue';
import { icons } from '@universal-editor/core';
import type { UniversalEditor, InsertTableOptions } from '@universal-editor/core';

const props = defineProps<{
  modelValue: boolean;
  editor?: UniversalEditor | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'insert', options: InsertTableOptions): void;
}>();

const rows = ref(3);
const cols = ref(3);
const withHeaderRow = ref(true);
const hoveredRows = ref(3);
const hoveredCols = ref(3);

const maxGridRows = 8;
const maxGridCols = 8;

const gridLabel = computed(() => {
  return `${hoveredRows.value} × ${hoveredCols.value} Table`;
});

function handleCellHover(r: number, c: number) {
  hoveredRows.value = r;
  hoveredCols.value = c;
}

function handleGridLeave() {
  hoveredRows.value = rows.value;
  hoveredCols.value = cols.value;
}

function handleCellClick(r: number, c: number) {
  rows.value = r;
  cols.value = c;
  insertTable();
}

function close() {
  emit('update:modelValue', false);
}

function insertTable() {
  const r = Math.max(1, rows.value || 3);
  const c = Math.max(1, cols.value || 3);
  const opts: InsertTableOptions = {
    rows: r,
    cols: c,
    withHeaderRow: withHeaderRow.value,
  };

  if (props.editor) {
    props.editor.insertTable(opts);
  }

  emit('insert', opts);
  close();
}
</script>

<template>
  <div v-if="modelValue" class="ue-dialog-overlay active" @click.self="close">
    <div class="ue-dialog ue-table-dialog">
      <div class="ue-dialog-title">
        <span v-html="icons.table" />
        <span>Insert Table</span>
      </div>

      <!-- Visual Matrix Grid Picker -->
      <div class="ue-table-grid-section" @mouseleave="handleGridLeave">
        <div class="ue-table-grid-label">{{ gridLabel }}</div>
        <div class="ue-table-grid-matrix">
          <div v-for="r in maxGridRows" :key="'r-' + r" class="ue-grid-row">
            <div
              v-for="c in maxGridCols"
              :key="'c-' + c"
              class="ue-grid-cell"
              :class="{ active: r <= hoveredRows && c <= hoveredCols }"
              @mouseenter="handleCellHover(r, c)"
              @click="handleCellClick(r, c)"
            />
          </div>
        </div>
      </div>

      <!-- Row and Column Inputs -->
      <div class="ue-inputs-row">
        <div class="ue-form-group">
          <label class="ue-form-label" for="vueTableRows">Rows</label>
          <input
            id="vueTableRows"
            v-model.number="rows"
            type="number"
            class="ue-input"
            min="1"
            max="30"
            @input="hoveredRows = Math.min(rows, maxGridRows)"
          />
        </div>
        <div class="ue-form-group">
          <label class="ue-form-label" for="vueTableCols">Columns</label>
          <input
            id="vueTableCols"
            v-model.number="cols"
            type="number"
            class="ue-input"
            min="1"
            max="20"
            @input="hoveredCols = Math.min(cols, maxGridCols)"
          />
        </div>
      </div>

      <!-- Include Header Row Checkbox -->
      <div class="ue-checkbox-group">
        <input
          id="vueTableHeaderCheckbox"
          v-model="withHeaderRow"
          type="checkbox"
          class="ue-checkbox"
        />
        <label for="vueTableHeaderCheckbox" class="ue-checkbox-label">
          Include header row
        </label>
      </div>

      <div class="ue-dialog-actions">
        <button type="button" class="ue-btn ue-btn-secondary" @click="close">
          Cancel
        </button>
        <button type="button" class="ue-btn ue-btn-primary" @click="insertTable">
          Insert Table
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ue-table-dialog {
  max-width: 380px;
}

.ue-inputs-row {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.ue-inputs-row .ue-form-group {
  flex: 1;
  margin-bottom: 0;
}

.ue-checkbox-group {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ue-checkbox {
  accent-color: var(--ue-accent, #6366f1);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.ue-checkbox-label {
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
}
</style>
