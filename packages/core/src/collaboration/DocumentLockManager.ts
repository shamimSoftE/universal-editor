import {
  CollaborationProvider,
  CollaborationUser,
  DocumentLockState,
} from './types';

export interface DocumentLockManagerOptions {
  provider?: CollaborationProvider;
  currentUser: CollaborationUser;
  documentId: string | number;
  lockTtlMs?: number;
  heartbeatIntervalMs?: number;
  initialState?: DocumentLockState;
  onLockChange?: (state: DocumentLockState) => void;
}

/**
 * DocumentLockManager
 *
 * Coordinates document editing concurrency through exclusive locking,
 * automatic background heartbeat renewals, and cross-peer sync.
 */
export class DocumentLockManager {
  protected provider?: CollaborationProvider;
  protected currentUser: CollaborationUser;
  protected documentId: string | number;
  protected lockTtlMs: number;
  protected heartbeatIntervalMs: number;
  protected state: DocumentLockState;
  protected heartbeatTimer: any = null;
  protected listeners: Set<(state: DocumentLockState) => void> = new Set();

  constructor(options: DocumentLockManagerOptions) {
    this.provider = options.provider;
    this.currentUser = options.currentUser;
    this.documentId = options.documentId;
    this.lockTtlMs = options.lockTtlMs ?? 300000; // 5 minutes default
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 60000; // 1 minute default

    this.state = options.initialState || {
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      expiresAt: null,
      isCurrentOwner: false,
    };

    if (options.onLockChange) {
      this.listeners.add(options.onLockChange);
    }

    this.bindProviderEvents();
  }

  protected bindProviderEvents(): void {
    if (!this.provider) return;

    this.provider.on('lock-acquired', (lockState) => {
      this.updateState({
        ...lockState,
        isCurrentOwner: String(lockState.lockedBy?.id) === String(this.currentUser.id),
      });
    });

    this.provider.on('lock-released', (docId) => {
      if (String(docId) === String(this.documentId)) {
        this.updateState({
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          expiresAt: null,
          isCurrentOwner: false,
        });
      }
    });

    this.provider.on('lock-expired', (docId) => {
      if (String(docId) === String(this.documentId)) {
        this.updateState({
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          expiresAt: null,
          isCurrentOwner: false,
        });
      }
    });
  }

  /**
   * Acquire exclusive editing lock for current user.
   */
  public acquireLock(): boolean {
    // If locked by another user and not expired
    if (this.state.isLocked && !this.state.isCurrentOwner && !this.isExpired()) {
      return false;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + this.lockTtlMs);

    const newState: DocumentLockState = {
      isLocked: true,
      lockedBy: this.currentUser,
      lockedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isCurrentOwner: true,
    };

    this.updateState(newState);
    this.provider?.broadcastLock(newState);
    this.startHeartbeat();

    return true;
  }

  /**
   * Release current editing lock.
   */
  public releaseLock(force = false): boolean {
    if (!this.state.isLocked) {
      return true;
    }

    if (!force && !this.state.isCurrentOwner) {
      return false;
    }

    this.stopHeartbeat();

    const releasedState: DocumentLockState = {
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      expiresAt: null,
      isCurrentOwner: false,
    };

    this.updateState(releasedState);
    this.provider?.broadcastLock(releasedState);

    return true;
  }

  /**
   * Send heartbeat to extend expiration time.
   */
  public renewHeartbeat(): boolean {
    if (!this.state.isLocked || !this.state.isCurrentOwner) {
      return false;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + this.lockTtlMs);

    const updatedState: DocumentLockState = {
      ...this.state,
      expiresAt: expires.toISOString(),
    };

    this.updateState(updatedState);
    this.provider?.broadcastLock(updatedState);

    return true;
  }

  public isLocked(): boolean {
    if (!this.state.isLocked) {
      return false;
    }

    if (this.isExpired()) {
      this.releaseLock(true);
      return false;
    }

    return true;
  }

  public isOwner(): boolean {
    return this.isLocked() && Boolean(this.state.isCurrentOwner);
  }

  public getLockState(): DocumentLockState {
    return { ...this.state };
  }

  public isExpired(): boolean {
    if (!this.state.expiresAt) return false;
    return new Date(this.state.expiresAt).getTime() <= Date.now();
  }

  protected startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.renewHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public onLockChange(callback: (state: DocumentLockState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  protected updateState(next: DocumentLockState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public destroy(): void {
    this.stopHeartbeat();
    this.listeners.clear();
  }
}
