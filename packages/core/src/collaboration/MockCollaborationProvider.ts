import {
  CollaborationProvider,
  CollaborationUser,
  CursorPosition,
  UserPresence,
  CommentItem,
  DocumentLockState,
  CollaborationEvents,
} from './types';

/**
 * MockCollaborationProvider
 *
 * Fully decoupled in-memory collaboration provider.
 * Allows simulating multiple connected users, live cursors, presence sync,
 * comments, and document locking in tests and local preview.
 */
export class MockCollaborationProvider implements CollaborationProvider {
  protected connected: boolean = false;
  protected currentUser: CollaborationUser | null = null;
  protected currentDocId: string | number | null = null;
  protected listeners: Map<string, Set<Function>> = new Map();

  // Simulated peer registry
  protected peers: Map<string | number, UserPresence> = new Map();
  protected activeLock: DocumentLockState = { isLocked: false };

  public async connect(documentId: string | number, user: CollaborationUser): Promise<void> {
    this.currentDocId = documentId;
    this.currentUser = user;
    this.connected = true;

    // Register current user in presence
    this.peers.set(user.id, {
      user,
      lastActive: Date.now(),
      isEditing: false,
    });

    this.emit('connected', user);
    this.emit('user-joined', user);
    this.emit('presence-update', this.getPresences());
  }

  public disconnect(): void {
    if (!this.connected) return;

    if (this.currentUser) {
      this.peers.delete(this.currentUser.id);
      this.emit('user-left', this.currentUser.id);
    }

    this.connected = false;
    this.currentUser = null;
    this.currentDocId = null;
    this.emit('disconnected');
    this.emit('presence-update', this.getPresences());
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getUser(): CollaborationUser | null {
    return this.currentUser;
  }

  public getDocumentId(): string | number | null {
    return this.currentDocId;
  }

  public getPresences(): UserPresence[] {
    return Array.from(this.peers.values());
  }

  public broadcastCursor(cursor: CursorPosition): void {
    if (!this.connected) return;
    this.emit('cursor-move', cursor);
  }

  public broadcastPresence(presence: Partial<UserPresence>): void {
    if (!this.connected || !this.currentUser) return;

    const existing = this.peers.get(this.currentUser.id) || {
      user: this.currentUser,
      lastActive: Date.now(),
      isEditing: false,
    };

    const updated: UserPresence = {
      ...existing,
      ...presence,
      user: this.currentUser,
      lastActive: Date.now(),
    };

    this.peers.set(this.currentUser.id, updated);
    this.emit('presence-update', this.getPresences());
  }

  public broadcastComment(
    action: 'created' | 'replied' | 'resolved' | 'reopened' | 'deleted',
    comment: CommentItem | { id: string | number }
  ): void {
    if (!this.connected) return;

    switch (action) {
      case 'created':
        this.emit('comment-created', comment as CommentItem);
        break;
      case 'replied':
        this.emit('comment-replied', comment as CommentItem);
        break;
      case 'resolved':
        this.emit('comment-resolved', comment as CommentItem);
        break;
      case 'reopened':
        this.emit('comment-reopened', comment as CommentItem);
        break;
      case 'deleted':
        this.emit('comment-deleted', (comment as CommentItem).id);
        break;
    }
  }

  public broadcastLock(lock: DocumentLockState): void {
    if (!this.connected) return;

    this.activeLock = lock;
    if (lock.isLocked) {
      this.emit('lock-acquired', lock);
    } else if (this.currentDocId !== null) {
      this.emit('lock-released', this.currentDocId);
    }
  }

  public on<K extends keyof CollaborationEvents>(event: K, callback: CollaborationEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Function);
  }

  public off<K extends keyof CollaborationEvents>(event: K, callback: CollaborationEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as Function);
    }
  }

  public emit<K extends keyof CollaborationEvents>(event: K, ...args: Parameters<CollaborationEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of set) {
        try {
          listener(...args);
        } catch (err) {
          console.error(`[MockCollaborationProvider] Error in listener for "${String(event)}":`, err);
        }
      }
    }
  }

  /**
   * Helper to simulate a remote peer joining the session.
   */
  public simulateRemotePeer(peer: CollaborationUser): void {
    this.peers.set(peer.id, {
      user: peer,
      lastActive: Date.now(),
      isEditing: false,
    });
    this.emit('user-joined', peer);
    this.emit('presence-update', this.getPresences());
  }

  /**
   * Helper to simulate a remote peer moving their cursor or typing.
   */
  public simulateRemoteCursor(peerId: string | number, from: number, to: number = from): void {
    const peerPresence = this.peers.get(peerId);
    if (!peerPresence) return;

    const cursor: CursorPosition = {
      userId: peerPresence.user.id,
      userName: peerPresence.user.name,
      userColor: peerPresence.user.color,
      from,
      to,
      head: to,
      anchor: from,
      timestamp: Date.now(),
    };

    peerPresence.isEditing = true;
    peerPresence.currentSelection = { from, to };
    peerPresence.lastActive = Date.now();

    this.emit('cursor-move', cursor);
    this.emit('presence-update', this.getPresences());
  }

  /**
   * Helper to simulate a remote peer leaving the session.
   */
  public simulateRemotePeerLeave(peerId: string | number): void {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      this.emit('user-left', peerId);
      this.emit('presence-update', this.getPresences());
    }
  }
}
