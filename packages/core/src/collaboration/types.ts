/**
 * Collaboration & Comments Type Definitions (Phase 20)
 *
 * Decoupled from editor core, supporting WebSocket, Laravel Reverb, Pusher,
 * and custom broadcast providers.
 */

export interface CollaborationUser {
  id: string | number;
  name: string;
  color: string;
  avatar?: string;
  role?: string;
  status?: 'active' | 'idle' | 'away';
}

export interface CursorPosition {
  userId: string | number;
  userName: string;
  userColor: string;
  head: number;
  anchor: number;
  from: number;
  to: number;
  timestamp: number;
}

export interface UserPresence {
  user: CollaborationUser;
  lastActive: number;
  isEditing: boolean;
  currentSelection?: {
    from: number;
    to: number;
    text?: string;
  };
}

export interface CommentItem {
  id: string | number;
  documentId: string | number;
  userId?: string | number | null;
  userName?: string;
  userAvatar?: string;
  parentId?: string | number | null;
  selectedText?: string | null;
  fromPos?: number | null;
  toPos?: number | null;
  content: string;
  status: 'active' | 'resolved';
  resolvedBy?: string | number | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  replies?: CommentItem[];
  mentions?: string[];
}

export interface DocumentLockState {
  isLocked: boolean;
  lockedBy?: CollaborationUser | null;
  lockedAt?: string | null;
  expiresAt?: string | null;
  isCurrentOwner?: boolean;
}

export interface CollaborationEvents {
  'connected': (user: CollaborationUser) => void;
  'disconnected': () => void;
  'presence-update': (presences: UserPresence[]) => void;
  'user-joined': (user: CollaborationUser) => void;
  'user-left': (userId: string | number) => void;
  'cursor-move': (cursor: CursorPosition) => void;
  'comment-created': (comment: CommentItem) => void;
  'comment-replied': (reply: CommentItem) => void;
  'comment-resolved': (comment: CommentItem) => void;
  'comment-reopened': (comment: CommentItem) => void;
  'comment-deleted': (commentId: string | number) => void;
  'lock-acquired': (lock: DocumentLockState) => void;
  'lock-released': (documentId: string | number) => void;
  'lock-expired': (documentId: string | number) => void;
  'error': (error: Error) => void;
}

export interface CollaborationProvider {
  connect(documentId: string | number, user: CollaborationUser): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getUser(): CollaborationUser | null;
  getDocumentId(): string | number | null;
  broadcastCursor(cursor: CursorPosition): void;
  broadcastPresence(presence: Partial<UserPresence>): void;
  broadcastComment(action: 'created' | 'replied' | 'resolved' | 'reopened' | 'deleted', comment: CommentItem | { id: string | number }): void;
  broadcastLock(lock: DocumentLockState): void;
  on<K extends keyof CollaborationEvents>(event: K, callback: CollaborationEvents[K]): void;
  off<K extends keyof CollaborationEvents>(event: K, callback: CollaborationEvents[K]): void;
  emit<K extends keyof CollaborationEvents>(event: K, ...args: Parameters<CollaborationEvents[K]>): void;
}
