/**
 * Accessibility & WCAG 2.1 Types (Phase 23)
 */

export interface AccessibilityConfig {
  /** Enable screen reader live region announcements */
  announcer?: boolean;
  /** Politeness level for ARIA live region */
  announcerPoliteness?: 'polite' | 'assertive';
  /** Ensure visible focus indicator rings on keyboard navigation (:focus-visible) */
  visibleFocusRings?: boolean;
  /** Enable arrow-key roving tabindex navigation across toolbar controls */
  keyboardNavigation?: boolean;
  /** Custom label for the editor content area */
  editorLabel?: string;
  /** Auto-announce formatting changes (bold, headings, lists, links, etc.) */
  autoAnnounceFormatting?: boolean;
}

export interface AnnounceOptions {
  politeness?: 'polite' | 'assertive';
  debounceMs?: number;
}
