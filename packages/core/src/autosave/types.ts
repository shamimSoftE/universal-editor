export type AutosaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface DraftData {
  id?: string;
  documentId?: string | number;
  content: any;
  html?: string;
  text?: string;
  updatedAt: number;
  checksum?: string;
  wordCount?: number;
  characterCount?: number;
  title?: string;
}

export type AutosaveSaveHandler = (draft: DraftData) => Promise<boolean | any> | boolean | any;
export type AutosaveLoadHandler = (documentId?: string | number) => Promise<DraftData | null> | DraftData | null;

export interface AutosaveConfig {
  /**
   * Whether autosave is enabled (default: true)
   */
  enabled?: boolean;

  /**
   * Debounce interval in milliseconds after typing stops before autosaving (default: 1500)
   */
  debounceMs?: number;
  debounce?: number;

  /**
   * Fallback periodic save interval in milliseconds (default: 30000ms / 30s)
   */
  interval?: number;

  /**
   * Remote API endpoint for saving/fetching drafts (default: '/api/drafts')
   */
  endpoint?: string;

  /**
   * Storage key used for local persistence (default: 'ue-draft-default')
   */
  storageKey?: string;
  key?: string;

  /**
   * Client storage engine: 'localStorage' | 'sessionStorage' | 'memory' (default: 'localStorage')
   */
  storageType?: 'localStorage' | 'sessionStorage' | 'memory';
  storage?: 'localStorage' | 'sessionStorage' | 'memory';

  /**
   * Document ID or slug to namespace drafts
   */
  documentId?: string | number;

  /**
   * Format to persist: 'json' | 'html' | 'both' (default: 'both')
   */
  format?: 'json' | 'html' | 'both';

  /**
   * Custom save handler (overrides default local + remote pipeline)
   */
  saveHandler?: AutosaveSaveHandler;

  /**
   * Custom restore/load handler
   */
  loadHandler?: AutosaveLoadHandler;

  /**
   * Whether to prompt / notify when an existing draft is detected on init (default: true)
   */
  promptOnDraftDetected?: boolean;

  /**
   * Intercept Ctrl+S / Cmd+S to perform manual save (default: true)
   */
  enableKeyboardShortcut?: boolean;
}
