import { AccessibilityConfig, AnnounceOptions } from './types';

/**
 * Screen Reader Announcer
 *
 * Implements an accessible off-screen live region (aria-live="polite" or "assertive")
 * to broadcast real-time state and formatting announcements to assistive technologies
 * (NVDA, JAWS, VoiceOver, Windows Narrator).
 */
export class Announcer {
  private element: HTMLElement | null = null;
  private config: Required<AccessibilityConfig>;
  private debounceTimer: any = null;
  private lastMessage: string = '';

  constructor(config: AccessibilityConfig = {}) {
    this.config = {
      announcer: config.announcer ?? true,
      announcerPoliteness: config.announcerPoliteness ?? 'polite',
      visibleFocusRings: config.visibleFocusRings ?? true,
      keyboardNavigation: config.keyboardNavigation ?? true,
      editorLabel: config.editorLabel ?? 'Rich Text Editor content area',
      autoAnnounceFormatting: config.autoAnnounceFormatting ?? true,
    };

    if (typeof document !== 'undefined' && this.config.announcer) {
      this.initLiveRegion();
    }
  }

  private initLiveRegion(): void {
    if (this.element || typeof document === 'undefined') return;

    this.element = document.createElement('div');
    this.element.className = 'ue-sr-only ue-announcer';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', this.config.announcerPoliteness);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.setAttribute('aria-relevant', 'additions text');

    document.body.appendChild(this.element);
  }

  /**
   * Broadcast a screen reader announcement.
   */
  public announce(message: string, options: AnnounceOptions = {}): void {
    if (!message || typeof document === 'undefined') return;

    const politeness = options.politeness || this.config.announcerPoliteness;
    const debounceMs = options.debounceMs ?? 100;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (!this.element) {
        this.initLiveRegion();
      }
      if (this.element) {
        if (this.element.getAttribute('aria-live') !== politeness) {
          this.element.setAttribute('aria-live', politeness);
        }

        // Slight text alternation forces screen readers to re-read repeating strings
        const textToAnnounce =
          message === this.lastMessage ? `${message} \u200B` : message;
        this.lastMessage = message;

        this.element.textContent = textToAnnounce;
      }
    }, debounceMs);
  }

  /**
   * Get the DOM live region element.
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Clear current announcement text.
   */
  public clear(): void {
    if (this.element) {
      this.element.textContent = '';
      this.lastMessage = '';
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Remove live region from DOM on cleanup.
   */
  public destroy(): void {
    this.clear();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
