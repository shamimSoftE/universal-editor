import type { DraftData } from './types';

/**
 * In-memory storage fallback for SSR, test environments, or restricted browsers
 */
class MemoryStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const memoryStore = new MemoryStorage();

/**
 * Safely resolves the storage mechanism without throwing security exceptions
 */
export function getStorageEngine(type: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage'): Storage | MemoryStorage {
  if (type === 'memory' || typeof window === 'undefined') {
    return memoryStore;
  }

  try {
    const engine = type === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    // Test write permission
    const testKey = '__ue_storage_test__';
    engine.setItem(testKey, '1');
    engine.removeItem(testKey);
    return engine;
  } catch {
    return memoryStore;
  }
}

/**
 * Calculate a fast string checksum for change detection
 */
export function calculateChecksum(content: any): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content || '');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Storage adapter for saving and retrieving draft data
 */
export class AutosaveStorage {
  private engine: Storage | MemoryStorage;

  constructor(type: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage') {
    this.engine = getStorageEngine(type);
  }

  public setStorageType(type: 'localStorage' | 'sessionStorage' | 'memory'): void {
    this.engine = getStorageEngine(type);
  }

  public get(key: string): DraftData | null {
    try {
      const raw = this.engine.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  }

  public set(key: string, draft: DraftData): boolean {
    try {
      const serialized = JSON.stringify(draft);
      this.engine.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }

  public remove(key: string): boolean {
    try {
      this.engine.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }
}
