export interface FocusTrapOptions {
  /** Callback fired when user presses Escape key */
  onEscape?: () => void;
  /** Whether to automatically focus the first focusable element on activation */
  initialFocus?: boolean;
  /** Whether to restore focus to previously active element on deactivation */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * FocusTrap (Phase 23)
 *
 * Implements WCAG 2.1 modal focus trapping. Constrains Tab navigation
 * strictly inside dialogs/modals and restores previous focus upon close.
 */
export class FocusTrap {
  private container: HTMLElement;
  private options: Required<FocusTrapOptions>;
  private previouslyFocusedElement: HTMLElement | null = null;
  private isActive: boolean = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      onEscape: options.onEscape ?? (() => {}),
      initialFocus: options.initialFocus ?? true,
      restoreFocus: options.restoreFocus ?? true,
    };
  }

  /**
   * Get all focusable elements inside the trap container.
   */
  public getFocusableElements(): HTMLElement[] {
    const elements = Array.from(
      this.container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    return elements.filter(
      (el) =>
        el.offsetParent !== null &&
        window.getComputedStyle(el).visibility !== 'hidden'
    );
  }

  /**
   * Activate the focus trap.
   */
  public activate(): void {
    if (this.isActive || typeof document === 'undefined') return;

    this.isActive = true;
    this.previouslyFocusedElement = document.activeElement as HTMLElement | null;

    const focusables = this.getFocusableElements();
    if (this.options.initialFocus && focusables.length > 0) {
      focusables[0].focus();
    }

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.container.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Deactivate the focus trap and restore previous focus.
   */
  public deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (
      this.options.restoreFocus &&
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  /**
   * Handle Tab and Escape keys within the trapped container.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.options.onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = this.getFocusableElements();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public destroy(): void {
    this.deactivate();
  }
}
