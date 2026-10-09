import {
  CollaborationProvider,
  CollaborationUser,
  UserPresence,
  CursorPosition,
} from './types';

const DEFAULT_COLLAB_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export interface PresenceManagerOptions {
  provider: CollaborationProvider;
  currentUser: CollaborationUser;
  documentId: string | number;
  heartbeatIntervalMs?: number;
  idleTimeoutMs?: number;
  onPresenceChange?: (presences: UserPresence[]) => void;
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (userId: string | number) => void;
  onCursorMove?: (cursor: CursorPosition) => void;
}

/**
 * PresenceManager
 *
 * Tracks local presence and synchronizes online collaborators, active cursors,
 * and idle/active statuses across multiple participants.
 */
export class PresenceManager {
  protected provider: CollaborationProvider;
  protected currentUser: CollaborationUser;
  protected documentId: string | number;
  protected heartbeatIntervalMs: number;
  protected idleTimeoutMs: number;
  protected presences: Map<string | number, UserPresence> = new Map();
  protected heartbeatTimer: any = null;

  protected onPresenceChangeCallback?: (presences: UserPresence[]) => void;
  protected onUserJoinedCallback?: (user: CollaborationUser) => void;
  protected onUserLeftCallback?: (userId: string | number) => void;
  protected onCursorMoveCallback?: (cursor: CursorPosition) => void;

  constructor(options: PresenceManagerOptions) {
    this.provider = options.provider;
    this.currentUser = {
      ...options.currentUser,
      color: options.currentUser.color || this.assignRandomColor(),
    };
    this.documentId = options.documentId;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15000;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 60000;

    this.onPresenceChangeCallback = options.onPresenceChange;
    this.onUserJoinedCallback = options.onUserJoined;
    this.onUserLeftCallback = options.onUserLeft;
    this.onCursorMoveCallback = options.onCursorMove;

    this.bindProviderEvents();
  }

  /**
   * Connect to session and begin presence heartbeat.
   */
  public async init(): Promise<void> {
    await this.provider.connect(this.documentId, this.currentUser);

    // Initial local presence entry
    this.presences.set(this.currentUser.id, {
      user: this.currentUser,
      lastActive: Date.now(),
      isEditing: false,
    });

    this.startHeartbeat();
  }

  protected bindProviderEvents(): void {
    this.provider.on('presence-update', (presences) => {
      this.presences.clear();
      for (const p of presences) {
        this.presences.set(p.user.id, p);
      }
      this.onPresenceChangeCallback?.(this.getAllPresences());
    });

    this.provider.on('user-joined', (user) => {
      if (!this.presences.has(user.id)) {
        this.presences.set(user.id, {
          user,
          lastActive: Date.now(),
          isEditing: false,
        });
      }
      this.onUserJoinedCallback?.(user);
      this.onPresenceChangeCallback?.(this.getAllPresences());
    });

    this.provider.on('user-left', (userId) => {
      this.presences.delete(userId);
      this.onUserLeftCallback?.(userId);
      this.onPresenceChangeCallback?.(this.getAllPresences());
    });

    this.provider.on('cursor-move', (cursor) => {
      // Update peer presence timestamp and active position
      const p = this.presences.get(cursor.userId);
      if (p) {
        p.lastActive = Date.now();
        p.currentSelection = { from: cursor.from, to: cursor.to };
      }
      this.onCursorMoveCallback?.(cursor);
    });
  }

  public getCurrentUser(): CollaborationUser {
    return this.currentUser;
  }

  public getAllPresences(): UserPresence[] {
    return Array.from(this.presences.values());
  }

  public getOnlineUsers(): CollaborationUser[] {
    return this.getAllPresences().map((p) => p.user);
  }

  public getRemoteUsers(): CollaborationUser[] {
    return this.getAllPresences()
      .filter((p) => String(p.user.id) !== String(this.currentUser.id))
      .map((p) => p.user);
  }

  public getUserPresence(userId: string | number): UserPresence | undefined {
    return this.presences.get(userId);
  }

  /**
   * Broadcast current user cursor position.
   */
  public updateCursor(from: number, to: number = from): void {
    const cursor: CursorPosition = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userColor: this.currentUser.color,
      from,
      to,
      head: to,
      anchor: from,
      timestamp: Date.now(),
    };

    this.provider.broadcastCursor(cursor);
    this.updateStatus(true, { from, to });
  }

  /**
   * Update active editing state or selection.
   */
  public updateStatus(isEditing: boolean, selection?: { from: number; to: number; text?: string }): void {
    const local = this.presences.get(this.currentUser.id);
    if (local) {
      local.lastActive = Date.now();
      local.isEditing = isEditing;
      if (selection) {
        local.currentSelection = selection;
      }
    }

    this.provider.broadcastPresence({
      isEditing,
      currentSelection: selection,
    });
  }

  protected startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      this.provider.broadcastPresence({
        isEditing: false,
      });
      this.pruneStaleUsers();
    }, this.heartbeatIntervalMs);
  }

  protected pruneStaleUsers(): void {
    const now = Date.now();
    let changed = false;

    for (const [id, presence] of this.presences.entries()) {
      if (String(id) === String(this.currentUser.id)) continue;

      if (now - presence.lastActive > this.idleTimeoutMs) {
        this.presences.delete(id);
        changed = true;
      }
    }

    if (changed) {
      this.onPresenceChangeCallback?.(this.getAllPresences());
    }
  }

  protected assignRandomColor(): string {
    const idx = Math.floor(Math.random() * DEFAULT_COLLAB_COLORS.length);
    return DEFAULT_COLLAB_COLORS[idx];
  }

  public destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.provider.disconnect();
    this.presences.clear();
  }
}
