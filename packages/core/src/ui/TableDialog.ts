import type { UniversalEditor } from '../UniversalEditor';
import { icons } from '../icons';

export class TableDialog {
  public overlay: HTMLElement;
  private dialog: HTMLElement;
  private editor: UniversalEditor;
  private rowsInput: HTMLInputElement;
  private colsInput: HTMLInputElement;
  private headerCheckbox: HTMLInputElement;
  private gridContainer: HTMLElement;
  private gridLabel: HTMLElement;

  private selectedRows = 3;
  private selectedCols = 3;
  private maxGridRows = 8;
  private maxGridCols = 8;

  constructor(editor: UniversalEditor) {
    this.editor = editor;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ue-dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'ue-dialog ue-table-dialog';
    this.dialog.style.maxWidth = '380px';

    this.dialog.innerHTML = `
      <div class="ue-dialog-title">
        ${icons.table}
        <span>Insert Table</span>
      </div>

      <div class="ue-table-grid-section">
        <div class="ue-table-grid-label" id="ueTableGridLabel">3 × 3 Table</div>
        <div class="ue-table-grid-matrix" id="ueTableGridMatrix"></div>
      </div>

      <div class="ue-table-inputs-row" style="display: flex; gap: 12px; margin-top: 14px;">
        <div class="ue-form-group" style="flex: 1; margin-bottom: 0;">
          <label class="ue-form-label" for="ueTableRowsInput">Rows</label>
          <input type="number" id="ueTableRowsInput" class="ue-input" min="1" max="30" value="3" />
        </div>
        <div class="ue-form-group" style="flex: 1; margin-bottom: 0;">
          <label class="ue-form-label" for="ueTableColsInput">Columns</label>
          <input type="number" id="ueTableColsInput" class="ue-input" min="1" max="20" value="3" />
        </div>
      </div>

      <div style="margin-top: 14px; display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="ueTableHeaderCheckbox" checked style="accent-color: #3b82f6; width: 16px; height: 16px; cursor: pointer;" />
        <label for="ueTableHeaderCheckbox" style="font-size: 13px; color: #cbd5e1; cursor: pointer; user-select: none;">
          Include header row
        </label>
      </div>

      <div class="ue-dialog-actions" style="margin-top: 18px;">
        <button type="button" class="ue-btn ue-btn-secondary" id="ueTableCancelBtn">Cancel</button>
        <button type="button" class="ue-btn ue-btn-primary" id="ueTableInsertBtn">Insert Table</button>
      </div>
    `;

    this.overlay.appendChild(this.dialog);

    this.gridLabel = this.dialog.querySelector('#ueTableGridLabel') as HTMLElement;
    this.gridContainer = this.dialog.querySelector('#ueTableGridMatrix') as HTMLElement;
    this.rowsInput = this.dialog.querySelector('#ueTableRowsInput') as HTMLInputElement;
    this.colsInput = this.dialog.querySelector('#ueTableColsInput') as HTMLInputElement;
    this.headerCheckbox = this.dialog.querySelector('#ueTableHeaderCheckbox') as HTMLInputElement;

    this.buildGridMatrix();
    this.bindEvents();

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.overlay);
    }
  }

  private buildGridMatrix(): void {
    this.gridContainer.innerHTML = '';
    for (let r = 1; r <= this.maxGridRows; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'ue-grid-row';
      for (let c = 1; c <= this.maxGridCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'ue-grid-cell';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);

        cell.addEventListener('mouseenter', () => {
          this.setHighlight(r, c);
        });

        cell.addEventListener('click', () => {
          this.selectedRows = r;
          this.selectedCols = c;
          this.rowsInput.value = String(r);
          this.colsInput.value = String(c);
          this.submit();
        });

        rowEl.appendChild(cell);
      }
      this.gridContainer.appendChild(rowEl);
    }
    this.setHighlight(this.selectedRows, this.selectedCols);
  }

  private setHighlight(rows: number, cols: number): void {
    this.gridLabel.textContent = `${rows} × ${cols} Table`;
    const cells = this.gridContainer.querySelectorAll('.ue-grid-cell');
    cells.forEach(el => {
      const cell = el as HTMLElement;
      const r = parseInt(cell.dataset.row || '1', 10);
      const c = parseInt(cell.dataset.col || '1', 10);
      if (r <= rows && c <= cols) {
        cell.classList.add('active');
      } else {
        cell.classList.remove('active');
      }
    });
  }

  private bindEvents(): void {
    const cancelBtn = this.dialog.querySelector('#ueTableCancelBtn');
    const insertBtn = this.dialog.querySelector('#ueTableInsertBtn');

    cancelBtn?.addEventListener('click', () => this.close());
    insertBtn?.addEventListener('click', () => this.submit());

    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.rowsInput.addEventListener('input', () => {
      const val = parseInt(this.rowsInput.value, 10);
      if (!isNaN(val) && val > 0) {
        this.selectedRows = Math.min(val, 30);
        this.setHighlight(Math.min(this.selectedRows, this.maxGridRows), Math.min(this.selectedCols, this.maxGridCols));
      }
    });

    this.colsInput.addEventListener('input', () => {
      const val = parseInt(this.colsInput.value, 10);
      if (!isNaN(val) && val > 0) {
        this.selectedCols = Math.min(val, 20);
        this.setHighlight(Math.min(this.selectedRows, this.maxGridRows), Math.min(this.selectedCols, this.maxGridCols));
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  public open(): void {
    this.selectedRows = 3;
    this.selectedCols = 3;
    this.rowsInput.value = '3';
    this.colsInput.value = '3';
    this.headerCheckbox.checked = true;
    this.setHighlight(3, 3);

    this.overlay.classList.add('active');
    setTimeout(() => this.rowsInput.focus(), 50);
  }

  public close(): void {
    this.overlay.classList.remove('active');
    this.editor.focus();
  }

  public submit(): void {
    const rows = Math.max(1, parseInt(this.rowsInput.value, 10) || 3);
    const cols = Math.max(1, parseInt(this.colsInput.value, 10) || 3);
    const withHeaderRow = this.headerCheckbox.checked;

    this.editor.insertTable({ rows, cols, withHeaderRow });
    this.close();
  }

  public destroy(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
