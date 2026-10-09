import type { EditorOptions } from '../types';
import type { UniversalEditor } from '../UniversalEditor';
import { createEditor } from '../createEditor';

export interface LazyEditorOptions extends EditorOptions {
  /**
   * If true, delays editor initialization until element enters viewport.
   * Defaults to false (initializes on next tick or on user interaction).
   */
  viewportLazy?: boolean;

  /**
   * Optional loading placeholder HTML shown before editor initializes.
   */
  placeholderHtml?: string;

  /**
   * Callback invoked once the lazy editor finishes initializing.
   */
  onReady?: (editor: UniversalEditor) => void;
}

export interface LazyExtensionOptions {
  name: string;
  loader: () => Promise<any>;
  priority?: number;
}

export class LazyExtensionRegistry {
  private static loadedModules = new Map<string, any>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Dynamically import an extension module on demand with deduplication.
   */
  public static async load(name: string, loader: () => Promise<any>): Promise<any> {
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const loadPromise = loader()
      .then((mod) => {
        const resolved = mod.default || mod;
        this.loadedModules.set(name, resolved);
        this.loadingPromises.delete(name);
        return resolved;
      })
      .catch((err) => {
        this.loadingPromises.delete(name);
        throw err;
      });

    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Check if an extension is already loaded.
   */
  public static isLoaded(name: string): boolean {
    return this.loadedModules.has(name);
  }

  /**
   * Clear cached modules.
   */
  public static clear(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}

export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  public static start(label: string): void {
    if (typeof performance !== 'undefined' && performance.now) {
      this.marks.set(label, performance.now());
    } else {
      this.marks.set(label, Date.now());
    }
  }

  public static end(label: string): number {
    const startTime = this.marks.get(label);
    if (startTime === undefined) return 0;
    const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const duration = now - startTime;
    this.marks.delete(label);
    return parseFloat(duration.toFixed(3));
  }

  public static async measure<T>(label: string, fn: () => Promise<T> | T): Promise<{ result: T; durationMs: number }> {
    this.start(label);
    const result = await fn();
    const durationMs = this.end(label);
    return { result, durationMs };
  }
}

/**
 * Creates an editor instance lazily, either immediately, on idle, or on viewport entry.
 */
export async function createLazyEditor(options: LazyEditorOptions): Promise<UniversalEditor> {
  const targetEl =
    typeof options.element === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(options.element) : null)
      : options.element;

  if (options.placeholderHtml && targetEl && typeof HTMLElement !== 'undefined' && targetEl instanceof HTMLElement) {
    targetEl.innerHTML = options.placeholderHtml;
  }

  if (options.viewportLazy && typeof IntersectionObserver !== 'undefined' && targetEl && targetEl instanceof HTMLElement) {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.disconnect();
              const editor = createEditor(options);
              options.onReady?.(editor);
              resolve(editor);
              break;
            }
          }
        },
        { rootMargin: '100px' }
      );
      observer.observe(targetEl);
    });
  }

  const editor = createEditor(options);
  options.onReady?.(editor);
  return editor;
}
