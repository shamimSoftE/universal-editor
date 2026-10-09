export interface ToolbarKeyboardNavOptions {
  /** Selector for focusable toolbar items */
  itemSelector?: string;
  /** Whether to wrap around from end to beginning */
  wrap?: boolean;
  /** Orientation of the toolbar ('horizontal' | 'vertical' | 'both') */
  orientation?: 'horizontal' | 'vertical' | 'both';
}

/**
 * ToolbarKeyboardNav (Phase 23)
 *
 * Implements the WAI-ARIA Toolbar Design Pattern roving tabindex.
 * Allows users to navigate toolbar buttons via Arrow keys (Left/Right/Up/Down),
 * Home, and End, while maintaining a single Tab stop for the entire toolbar.
 */
export class ToolbarKeyboardNav {
  private container: HTMLElement;
  private options: Required<ToolbarKeyboardNavOptions>;
  private currentIndex: number = 0;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private focusinHandler: ((e: FocusEvent) => void) | null = null;

  constructor(
    container: HTMLElement,
    options: ToolbarKeyboardNavOptions = {}
  ) {
    this.container = container;
    this.options = {
      itemSelector:
        options.itemSelector ??
        'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), select:not([disabled]), input:not([disabled])',
      wrap: options.wrap ?? true,
      orientation: options.orientation ?? 'horizontal',
    };

    this.init();
  }

  private init(): void {
    if (typeof document === 'undefined') return;

    // Ensure role="toolbar" is set
    if (!this.container.getAttribute('role')) {
      this.container.setAttribute('role', 'toolbar');
    }

    this.updateTabIndices();

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.focusinHandler = (e: FocusEvent) => this.handleFocusIn(e);

    this.container.addEventListener('keydown', this.keydownHandler);
    this.container.addEventListener('focusin', this.focusinHandler);
  }

  /**
   * Get all active focusable items inside toolbar.
   */
  public getItems(): HTMLElement[] {
    return Array.from(
      this.container.querySelectorAll<HTMLElement>(this.options.itemSelector)
    ).filter(
      (el) =>
        el.offsetParent !== null &&
        window.getComputedStyle(el).visibility !== 'hidden' &&
        window.getComputedStyle(el).display !== 'none'
    );
  }

  /**
   * Synchronize roving tabindex across all items:
   * Current index gets tabindex="0", all other items get tabindex="-1".
   */
  public updateTabIndices(): void {
    const items = this.getItems();
    if (items.length === 0) return;

    if (this.currentIndex >= items.length) {
      this.currentIndex = 0;
    }

    items.forEach((item, index) => {
      if (index === this.currentIndex) {
        item.setAttribute('tabindex', '0');
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Move focus to an item by index.
   */
  public focusItem(index: number): void {
    const items = this.getItems();
    if (items.length === 0) return;

    if (this.options.wrap) {
      this.currentIndex = (index + items.length) % items.length;
    } else {
      this.currentIndex = Math.max(0, Math.min(index, items.length - 1));
    }

    this.updateTabIndices();
    items[this.currentIndex]?.focus();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const items = this.getItems();
    if (items.length === 0) return;

    // Only handle if current active element is an item in toolbar
    const activeEl = document.activeElement as HTMLElement;
    const activeIdx = items.indexOf(activeEl);
    if (activeIdx === -1) return;

    const isHorizontal =
      this.options.orientation === 'horizontal' ||
      this.options.orientation === 'both';
    const isVertical =
      this.options.orientation === 'vertical' ||
      this.options.orientation === 'both';

    let handled = false;

    if (
      (isHorizontal && e.key === 'ArrowRight') ||
      (isVertical && e.key === 'ArrowDown')
    ) {
      this.focusItem(activeIdx + 1);
      handled = true;
    } else if (
      (isHorizontal && e.key === 'ArrowLeft') ||
      (isVertical && e.key === 'ArrowUp')
    ) {
      this.focusItem(activeIdx - 1);
      handled = true;
    } else if (e.key === 'Home') {
      this.focusItem(0);
      handled = true;
    } else if (e.key === 'End') {
      this.focusItem(items.length - 1);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private handleFocusIn(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    const items = this.getItems();
    const idx = items.indexOf(target);
    if (idx !== -1 && idx !== this.currentIndex) {
      this.currentIndex = idx;
      this.updateTabIndices();
    }
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public destroy(): void {
    if (this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.focusinHandler) {
      this.container.removeEventListener('focusin', this.focusinHandler);
      this.focusinHandler = null;
    }
  }
}
