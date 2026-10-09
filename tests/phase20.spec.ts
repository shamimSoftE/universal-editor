import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  MockCollaborationProvider,
  PresenceManager,
  CommentManager,
  DocumentLockManager,
  CollaborationUser,
} from '@universal-editor/core';
import {
  CollaborationBar,
  CommentSidebar,
  DocumentLockBanner,
} from '@universal-editor/vue3';

describe('Phase 20: Collaboration, Cursors, Comments & Concurrency Locking', () => {
  const userAlice: CollaborationUser = {
    id: 1,
    name: 'Alice Developer',
    color: '#3b82f6',
    role: 'Editor',
  };

  const userBob: CollaborationUser = {
    id: 2,
    name: 'Bob Reviewer',
    color: '#10b981',
    role: 'Reviewer',
  };

  describe('1. MockCollaborationProvider', () => {
    let provider: MockCollaborationProvider;

    beforeEach(() => {
      provider = new MockCollaborationProvider();
    });

    it('connects and registers current user presence', async () => {
      expect(provider.isConnected()).toBe(false);

      await provider.connect(100, userAlice);

      expect(provider.isConnected()).toBe(true);
      expect(provider.getDocumentId()).toBe(100);
      expect(provider.getUser()?.name).toBe('Alice Developer');

      const presences = provider.getPresences();
      expect(presences.length).toBe(1);
      expect(presences[0].user.name).toBe('Alice Developer');
    });

    it('broadcasts and listens to cursor movements', async () => {
      await provider.connect(100, userAlice);
      const cursorSpy = vi.fn();
      provider.on('cursor-move', cursorSpy);

      provider.broadcastCursor({
        userId: 1,
        userName: 'Alice Developer',
        userColor: '#3b82f6',
        from: 10,
        to: 15,
        head: 15,
        anchor: 10,
        timestamp: Date.now(),
      });

      expect(cursorSpy).toHaveBeenCalledTimes(1);
      expect(cursorSpy.mock.calls[0][0].from).toBe(10);
      expect(cursorSpy.mock.calls[0][0].to).toBe(15);
    });

    it('simulates remote peers joining, typing, and leaving', async () => {
      await provider.connect(100, userAlice);
      const joinSpy = vi.fn();
      const leaveSpy = vi.fn();
      const cursorSpy = vi.fn();

      provider.on('user-joined', joinSpy);
      provider.on('user-left', leaveSpy);
      provider.on('cursor-move', cursorSpy);

      // Peer joins
      provider.simulateRemotePeer(userBob);
      expect(joinSpy).toHaveBeenCalledWith(userBob);
      expect(provider.getPresences().length).toBe(2);

      // Peer types
      provider.simulateRemoteCursor(userBob.id, 25, 30);
      expect(cursorSpy).toHaveBeenCalledTimes(1);
      expect(cursorSpy.mock.calls[0][0].userId).toBe(2);

      // Peer leaves
      provider.simulateRemotePeerLeave(userBob.id);
      expect(leaveSpy).toHaveBeenCalledWith(2);
      expect(provider.getPresences().length).toBe(1);
    });

    it('disconnects and clears state cleanly', async () => {
      await provider.connect(100, userAlice);
      expect(provider.isConnected()).toBe(true);

      provider.disconnect();
      expect(provider.isConnected()).toBe(false);
      expect(provider.getUser()).toBeNull();
      expect(provider.getDocumentId()).toBeNull();
    });
  });

  describe('2. PresenceManager', () => {
    let provider: MockCollaborationProvider;
    let presenceManager: PresenceManager;

    beforeEach(async () => {
      provider = new MockCollaborationProvider();
      presenceManager = new PresenceManager({
        provider,
        currentUser: userAlice,
        documentId: 200,
        idleTimeoutMs: 1000,
      });
      await presenceManager.init();
    });

    it('returns online users including local user', () => {
      const online = presenceManager.getOnlineUsers();
      expect(online.length).toBe(1);
      expect(online[0].name).toBe('Alice Developer');
    });

    it('updates cursor and broadcast position', () => {
      const cursorSpy = vi.fn();
      provider.on('cursor-move', cursorSpy);

      presenceManager.updateCursor(42, 50);

      expect(cursorSpy).toHaveBeenCalledTimes(1);
      expect(cursorSpy.mock.calls[0][0].head).toBe(50);
    });

    it('identifies remote users when peers join', () => {
      provider.simulateRemotePeer(userBob);

      const remote = presenceManager.getRemoteUsers();
      expect(remote.length).toBe(1);
      expect(remote[0].id).toBe(2);
      expect(remote[0].name).toBe('Bob Reviewer');
    });
  });

  describe('3. CommentManager', () => {
    let provider: MockCollaborationProvider;
    let commentManager: CommentManager;

    beforeEach(async () => {
      provider = new MockCollaborationProvider();
      await provider.connect(300, userAlice);
      commentManager = new CommentManager({
        provider,
        currentUser: userAlice,
        documentId: 300,
      });
    });

    it('adds an anchored top-level comment', () => {
      const comment = commentManager.addComment('This introduction needs more citations @bob', {
        selectedText: 'Universal Rich Text Editor architecture',
        fromPos: 0,
        toPos: 38,
      });

      expect(comment.id).toBeDefined();
      expect(comment.selectedText).toBe('Universal Rich Text Editor architecture');
      expect(comment.fromPos).toBe(0);
      expect(comment.toPos).toBe(38);
      expect(comment.status).toBe('active');
      expect(comment.mentions).toEqual(['bob']);

      expect(commentManager.getActiveComments().length).toBe(1);
      expect(commentManager.getResolvedComments().length).toBe(0);
    });

    it('adds threaded replies to existing comments', () => {
      const comment = commentManager.addComment('Initial comment');
      const reply = commentManager.addReply(comment.id, 'I have added the citations requested.');

      expect(reply.parentId).toBe(comment.id);
      expect(comment.replies?.length).toBe(1);
      expect(comment.replies?.[0].content).toBe('I have added the citations requested.');
    });

    it('resolves and reopens comment threads', () => {
      const comment = commentManager.addComment('Review needed');
      commentManager.addReply(comment.id, 'Working on it');

      expect(commentManager.getActiveComments().length).toBe(1);
      expect(commentManager.getResolvedComments().length).toBe(0);

      // Resolve
      commentManager.resolveComment(comment.id);
      expect(commentManager.getActiveComments().length).toBe(0);
      expect(commentManager.getResolvedComments().length).toBe(1);
      expect(comment.status).toBe('resolved');
      expect(comment.replies?.[0].status).toBe('resolved');

      // Reopen
      commentManager.reopenComment(comment.id);
      expect(commentManager.getActiveComments().length).toBe(1);
      expect(commentManager.getResolvedComments().length).toBe(0);
      expect(comment.status).toBe('active');
    });

    it('deletes comment threads and individual replies', () => {
      const comment = commentManager.addComment('Delete me');
      const reply = commentManager.addReply(comment.id, 'Delete reply');

      // Delete reply first
      const replyDeleted = commentManager.deleteComment(reply.id);
      expect(replyDeleted).toBe(true);
      expect(comment.replies?.length).toBe(0);

      // Delete root comment
      const rootDeleted = commentManager.deleteComment(comment.id);
      expect(rootDeleted).toBe(true);
      expect(commentManager.getComments().length).toBe(0);
    });

    it('extracts multiple @mentions from text', () => {
      const mentions = commentManager.extractMentions('Hello @alice, cc @bob and @carol_123!');
      expect(mentions).toEqual(['alice', 'bob', 'carol_123']);
    });
  });

  describe('4. DocumentLockManager', () => {
    let provider: MockCollaborationProvider;
    let lockManager: DocumentLockManager;

    beforeEach(async () => {
      provider = new MockCollaborationProvider();
      await provider.connect(400, userAlice);
      lockManager = new DocumentLockManager({
        provider,
        currentUser: userAlice,
        documentId: 400,
        lockTtlMs: 60000,
      });
    });

    it('acquires exclusive edit lock for current user', () => {
      expect(lockManager.isLocked()).toBe(false);

      const acquired = lockManager.acquireLock();
      expect(acquired).toBe(true);
      expect(lockManager.isLocked()).toBe(true);
      expect(lockManager.isOwner()).toBe(true);

      const state = lockManager.getLockState();
      expect(state.lockedBy?.name).toBe('Alice Developer');
      expect(state.expiresAt).toBeDefined();
    });

    it('renews heartbeat without changing lock ownership', () => {
      lockManager.acquireLock();
      const firstExpiry = lockManager.getLockState().expiresAt;
      expect(firstExpiry).toBeDefined();

      const renewed = lockManager.renewHeartbeat();
      expect(renewed).toBe(true);
      expect(lockManager.isOwner()).toBe(true);
    });

    it('releases lock cleanly', () => {
      lockManager.acquireLock();
      expect(lockManager.isLocked()).toBe(true);

      const released = lockManager.releaseLock();
      expect(released).toBe(true);
      expect(lockManager.isLocked()).toBe(false);
      expect(lockManager.isOwner()).toBe(false);
    });

    it('syncs remote peer lock acquisitions', () => {
      provider.broadcastLock({
        isLocked: true,
        lockedBy: userBob,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      expect(lockManager.isLocked()).toBe(true);
      expect(lockManager.isOwner()).toBe(false);
      expect(lockManager.getLockState().lockedBy?.name).toBe('Bob Reviewer');

      // Attempting to acquire lock while held by peer should fail
      const tryAcquire = lockManager.acquireLock();
      expect(tryAcquire).toBe(false);
    });
  });

  describe('5. Vue 3 Collaboration Components', () => {
    it('mounts CollaborationBar with avatars and lock status', () => {
      const wrapper = mount(CollaborationBar, {
        props: {
          presences: [
            { user: userAlice, lastActive: Date.now(), isEditing: true },
            { user: userBob, lastActive: Date.now(), isEditing: false },
          ],
          lockState: {
            isLocked: true,
            isCurrentOwner: true,
            lockedBy: userAlice,
          },
          activeCommentsCount: 3,
        },
      });

      expect(wrapper.find('.ue-collab-avatar').attributes('title')).toContain('Alice Developer');
      expect(wrapper.text()).toContain('AD');
      expect(wrapper.text()).toContain('BR');
      expect(wrapper.text()).toContain('2 active users');
      expect(wrapper.text()).toContain('You hold edit lock');
      expect(wrapper.text()).toContain('Comments');
      expect(wrapper.text()).toContain('3');
    });

    it('mounts CommentSidebar and emits comment events', async () => {
      const wrapper = mount(CommentSidebar, {
        props: {
          comments: [
            {
              id: 'c1',
              documentId: 1,
              userName: 'Alice',
              content: 'Please verify paragraph 3',
              selectedText: 'paragraph 3',
              status: 'active',
              createdAt: new Date().toISOString(),
              replies: [],
            },
          ],
          selectedText: 'Highlighted line for new comment',
        },
      });

      expect(wrapper.text()).toContain('Document Comments');
      expect(wrapper.text()).toContain('Please verify paragraph 3');
      expect(wrapper.text()).toContain('"paragraph 3"');

      // Check anchor preview in compose
      expect(wrapper.text()).toContain('Highlighted line for new comment');

      // Compose and emit
      const textarea = wrapper.find('.ue-compose-input');
      await textarea.setValue('Looks fantastic!');
      const btn = wrapper.find('.ue-compose-btn');
      await btn.trigger('click');

      expect(wrapper.emitted('add-comment')).toBeTruthy();
      expect(wrapper.emitted('add-comment')![0][0]).toEqual({
        content: 'Looks fantastic!',
        selectedText: 'Highlighted line for new comment',
      });
    });

    it('mounts DocumentLockBanner for owner and peer states', () => {
      // Owner state
      const ownerWrapper = mount(DocumentLockBanner, {
        props: {
          lockState: {
            isLocked: true,
            isCurrentOwner: true,
            lockedBy: userAlice,
          },
        },
      });
      expect(ownerWrapper.text()).toContain('Exclusive Editing Lock Active');
      expect(ownerWrapper.find('.ue-lock-banner-btn.release').exists()).toBe(true);

      // Peer state
      const peerWrapper = mount(DocumentLockBanner, {
        props: {
          lockState: {
            isLocked: true,
            isCurrentOwner: false,
            lockedBy: userBob,
          },
        },
      });
      expect(peerWrapper.text()).toContain('Currently being edited by Bob Reviewer');
      expect(peerWrapper.text()).toContain('You are in read-only mode');
    });
  });
});
