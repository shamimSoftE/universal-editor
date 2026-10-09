import {
  CollaborationProvider,
  CollaborationUser,
  CommentItem,
} from './types';

export interface CommentManagerOptions {
  provider?: CollaborationProvider;
  currentUser: CollaborationUser;
  documentId: string | number;
  initialComments?: CommentItem[];
  onCommentsChange?: (comments: CommentItem[]) => void;
  onCommentSelected?: (comment: CommentItem) => void;
}

export interface AddCommentOptions {
  selectedText?: string;
  fromPos?: number;
  toPos?: number;
}

/**
 * CommentManager
 *
 * Threaded inline comments engine anchored to document text selections.
 * Supports realtime provider synchronization, reply chains, mention detection, and resolution states.
 */
export class CommentManager {
  protected provider?: CollaborationProvider;
  protected currentUser: CollaborationUser;
  protected documentId: string | number;
  protected comments: Map<string | number, CommentItem> = new Map();
  protected listeners: Set<(comments: CommentItem[]) => void> = new Set();
  protected onCommentSelectedCallback?: (comment: CommentItem) => void;

  constructor(options: CommentManagerOptions) {
    this.provider = options.provider;
    this.currentUser = options.currentUser;
    this.documentId = options.documentId;
    this.onCommentSelectedCallback = options.onCommentSelected;

    if (options.onCommentsChange) {
      this.listeners.add(options.onCommentsChange);
    }

    if (options.initialComments) {
      this.loadComments(options.initialComments);
    }

    this.bindProviderEvents();
  }

  protected bindProviderEvents(): void {
    if (!this.provider) return;

    this.provider.on('comment-created', (comment) => {
      this.comments.set(comment.id, comment);
      this.notifyChange();
    });

    this.provider.on('comment-replied', (reply) => {
      if (reply.parentId && this.comments.has(reply.parentId)) {
        const parent = this.comments.get(reply.parentId)!;
        parent.replies = parent.replies || [];
        // Avoid duplicate replies
        if (!parent.replies.some((r) => String(r.id) === String(reply.id))) {
          parent.replies.push(reply);
        }
      }
      this.notifyChange();
    });

    this.provider.on('comment-resolved', (comment) => {
      if (this.comments.has(comment.id)) {
        const target = this.comments.get(comment.id)!;
        target.status = 'resolved';
        target.resolvedBy = comment.resolvedBy;
        target.resolvedAt = comment.resolvedAt;
        if (target.replies) {
          target.replies.forEach((r) => (r.status = 'resolved'));
        }
      }
      this.notifyChange();
    });

    this.provider.on('comment-reopened', (comment) => {
      if (this.comments.has(comment.id)) {
        const target = this.comments.get(comment.id)!;
        target.status = 'active';
        target.resolvedBy = null;
        target.resolvedAt = null;
      }
      this.notifyChange();
    });

    this.provider.on('comment-deleted', (commentId) => {
      this.comments.delete(commentId);
      // Also check if deleted comment was a reply inside another thread
      for (const item of this.comments.values()) {
        if (item.replies) {
          item.replies = item.replies.filter((r) => String(r.id) !== String(commentId));
        }
      }
      this.notifyChange();
    });
  }

  /**
   * Add a top-level anchored comment to the document.
   */
  public addComment(content: string, options: AddCommentOptions = {}): CommentItem {
    if (!content || !content.trim()) {
      throw new Error('Comment content cannot be empty.');
    }

    const mentions = this.extractMentions(content);
    const id = 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const comment: CommentItem = {
      id,
      documentId: this.documentId,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      selectedText: options.selectedText || null,
      fromPos: options.fromPos ?? null,
      toPos: options.toPos ?? null,
      content: content.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      replies: [],
      mentions,
    };

    this.comments.set(id, comment);
    this.provider?.broadcastComment('created', comment);
    this.notifyChange();

    return comment;
  }

  /**
   * Add a reply to an existing comment thread.
   */
  public addReply(commentId: string | number, content: string): CommentItem {
    const parent = this.comments.get(commentId);
    if (!parent) {
      throw new Error(`Parent comment ${commentId} not found.`);
    }

    if (!content || !content.trim()) {
      throw new Error('Reply content cannot be empty.');
    }

    const replyId = 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const mentions = this.extractMentions(content);

    const reply: CommentItem = {
      id: replyId,
      documentId: this.documentId,
      parentId: parent.id,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      content: content.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      mentions,
    };

    parent.replies = parent.replies || [];
    parent.replies.push(reply);

    this.provider?.broadcastComment('replied', reply);
    this.notifyChange();

    return reply;
  }

  /**
   * Mark a comment thread as resolved.
   */
  public resolveComment(commentId: string | number, resolvedBy?: string | number): CommentItem {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found.`);
    }

    comment.status = 'resolved';
    comment.resolvedBy = resolvedBy ?? this.currentUser.id;
    comment.resolvedAt = new Date().toISOString();

    if (comment.replies) {
      comment.replies.forEach((r) => (r.status = 'resolved'));
    }

    this.provider?.broadcastComment('resolved', comment);
    this.notifyChange();

    return comment;
  }

  /**
   * Reopen a resolved comment thread.
   */
  public reopenComment(commentId: string | number): CommentItem {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found.`);
    }

    comment.status = 'active';
    comment.resolvedBy = null;
    comment.resolvedAt = null;

    if (comment.replies) {
      comment.replies.forEach((r) => (r.status = 'active'));
    }

    this.provider?.broadcastComment('reopened', comment);
    this.notifyChange();

    return comment;
  }

  /**
   * Delete a comment thread or reply.
   */
  public deleteComment(commentId: string | number): boolean {
    if (this.comments.has(commentId)) {
      this.comments.delete(commentId);
      this.provider?.broadcastComment('deleted', { id: commentId });
      this.notifyChange();
      return true;
    }

    // Check if reply
    for (const parent of this.comments.values()) {
      if (parent.replies && parent.replies.some((r) => String(r.id) === String(commentId))) {
        parent.replies = parent.replies.filter((r) => String(r.id) !== String(commentId));
        this.provider?.broadcastComment('deleted', { id: commentId });
        this.notifyChange();
        return true;
      }
    }

    return false;
  }

  /**
   * Parse @username mentions in text.
   */
  public extractMentions(text: string): string[] {
    const matches = text.match(/@([a-zA-Z0-9_\.\-]+)/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1))));
  }

  public getComments(includeResolved = true): CommentItem[] {
    const all = Array.from(this.comments.values());
    if (includeResolved) {
      return all;
    }
    return all.filter((c) => c.status === 'active');
  }

  public getActiveComments(): CommentItem[] {
    return this.getComments(false);
  }

  public getResolvedComments(): CommentItem[] {
    return Array.from(this.comments.values()).filter((c) => c.status === 'resolved');
  }

  public getComment(commentId: string | number): CommentItem | undefined {
    return this.comments.get(commentId);
  }

  public selectComment(comment: CommentItem): void {
    this.onCommentSelectedCallback?.(comment);
  }

  public loadComments(comments: CommentItem[]): void {
    this.comments.clear();
    for (const c of comments) {
      // Group flat replies if coming from flat db table
      if (c.parentId) {
        const parent = this.comments.get(c.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          if (!parent.replies.some((r) => String(r.id) === String(c.id))) {
            parent.replies.push(c);
          }
        }
      } else {
        this.comments.set(c.id, {
          ...c,
          replies: c.replies || [],
        });
      }
    }
    this.notifyChange();
  }

  public onCommentsChange(callback: (comments: CommentItem[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  protected notifyChange(): void {
    const list = this.getComments(true);
    for (const listener of this.listeners) {
      listener(list);
    }
  }

  public destroy(): void {
    this.comments.clear();
    this.listeners.clear();
  }
}
