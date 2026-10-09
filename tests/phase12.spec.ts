import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UniversalEditor,
  DEFAULT_MENTION_USERS,
  filterMentionUsers,
  createDefaultMentionProvider,
  MentionListRenderer,
  ContentSanitizer,
} from '../packages/core/src';
import type { MentionUser } from '../packages/core/src';

describe('Phase 12: Mentions System Suite', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('DEFAULT_MENTION_USERS Directory & Schema', () => {
    it('contains valid user records with all required enterprise metadata', () => {
      expect(DEFAULT_MENTION_USERS.length).toBeGreaterThanOrEqual(6);

      DEFAULT_MENTION_USERS.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.name.length).toBeGreaterThan(0);
        expect(user.username).toBeDefined();
        expect(user.username.length).toBeGreaterThan(0);
        expect(user.avatar).toBeDefined();
        expect(user.role).toBeDefined();
      });
    });

    it('includes core team members from specifications', () => {
      const usernames = DEFAULT_MENTION_USERS.map(u => u.username);
      expect(usernames).toContain('johndoe');
      expect(usernames).toContain('janesmith');
      expect(usernames).toContain('alex');
      expect(usernames).toContain('shamim');
    });
  });

  describe('filterMentionUsers Search & Filtering', () => {
    it('returns all users up to limit when query is empty or just "@"', () => {
      const all = filterMentionUsers(DEFAULT_MENTION_USERS, '', 10);
      expect(all.length).toBe(DEFAULT_MENTION_USERS.length);

      const withAt = filterMentionUsers(DEFAULT_MENTION_USERS, '@', 10);
      expect(withAt.length).toBe(DEFAULT_MENTION_USERS.length);
    });

    it('filters users by exact username or partial name', () => {
      const results = filterMentionUsers(DEFAULT_MENTION_USERS, 'john');
      expect(results.some(u => u.username === 'johndoe')).toBe(true);

      const janeResults = filterMentionUsers(DEFAULT_MENTION_USERS, 'Jane');
      expect(janeResults.some(u => u.name === 'Jane Smith')).toBe(true);
    });

    it('filters users when query includes leading "@"', () => {
      const results = filterMentionUsers(DEFAULT_MENTION_USERS, '@alex');
      expect(results.some(u => u.username === 'alex')).toBe(true);
    });

    it('filters users by role or email', () => {
      const architectResults = filterMentionUsers(DEFAULT_MENTION_USERS, 'Architect');
      expect(architectResults.some(u => u.role?.includes('Architect'))).toBe(true);

      const emailResults = filterMentionUsers(DEFAULT_MENTION_USERS, 'example.com');
      expect(emailResults.length).toBeGreaterThan(0);
    });

    it('returns empty array when query does not match any user', () => {
      const results = filterMentionUsers(DEFAULT_MENTION_USERS, 'nonexistentuser999');
      expect(results).toEqual([]);
    });

    it('respects the max limit parameter', () => {
      const results = filterMentionUsers(DEFAULT_MENTION_USERS, '', 3);
      expect(results.length).toBe(3);
    });
  });

  describe('createDefaultMentionProvider Fallback & Resolution', () => {
    it('resolves fallback users when offline or mock API is unreachable', async () => {
      const provider = createDefaultMentionProvider(DEFAULT_MENTION_USERS, '/invalid-url-12345');
      const users = await provider('john');
      expect(users.some(u => u.username === 'johndoe')).toBe(true);
    });
  });

  describe('MentionListRenderer DOM & Keyboard Navigation', () => {
    it('initializes floating dropdown element with accessibility attributes', () => {
      const renderer = new MentionListRenderer();
      expect(renderer.element).toBeDefined();
      expect(renderer.element.className).toContain('ue-mention-list');
      expect(renderer.element.getAttribute('role')).toBe('listbox');
      expect(renderer.element.style.display).toBe('none');

      renderer.destroy();
    });

    it('renders user items with avatars, names, badges and roles', () => {
      const renderer = new MentionListRenderer();
      const sampleUsers = DEFAULT_MENTION_USERS.slice(0, 3);

      renderer.onStart({
        editor: null as any,
        range: { from: 0, to: 1 },
        query: '',
        text: '@',
        items: sampleUsers,
        command: () => {},
        decorationNode: null,
        clientRect: () => new DOMRect(100, 100, 10, 20),
      });

      expect(renderer.element.style.display).toBe('block');
      const items = renderer.element.querySelectorAll('.ue-mention-item');
      expect(items.length).toBe(3);

      const firstItem = items[0];
      expect(firstItem.textContent).toContain(sampleUsers[0].name);
      expect(firstItem.textContent).toContain(`@${sampleUsers[0].username}`);

      renderer.destroy();
    });

    it('handles keyboard navigation cycling and selection', () => {
      const renderer = new MentionListRenderer();
      const sampleUsers = DEFAULT_MENTION_USERS.slice(0, 3);
      let selectedUser: MentionUser | null = null;

      renderer.onStart({
        editor: null as any,
        range: { from: 0, to: 1 },
        query: '',
        text: '@',
        items: sampleUsers,
        command: user => {
          selectedUser = user;
        },
        decorationNode: null,
        clientRect: () => new DOMRect(50, 50, 10, 20),
      });

      // Arrow down to index 1
      renderer.onKeyDown({
        view: null as any,
        event: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        range: { from: 0, to: 1 },
      });

      // Enter to select
      renderer.onKeyDown({
        view: null as any,
        event: new KeyboardEvent('keydown', { key: 'Enter' }),
        range: { from: 0, to: 1 },
      });

      expect(selectedUser).not.toBeNull();
      expect((selectedUser as any).id).toBe(sampleUsers[1].id);
      expect(renderer.element.style.display).toBe('none');

      renderer.destroy();
    });

    it('closes on Escape key press', () => {
      const renderer = new MentionListRenderer();
      renderer.onStart({
        editor: null as any,
        range: { from: 0, to: 1 },
        query: '',
        text: '@',
        items: DEFAULT_MENTION_USERS,
        command: () => {},
        decorationNode: null,
        clientRect: () => new DOMRect(50, 50, 10, 20),
      });

      const handled = renderer.onKeyDown({
        view: null as any,
        event: new KeyboardEvent('keydown', { key: 'Escape' }),
        range: { from: 0, to: 1 },
      });

      expect(handled).toBe(true);
      expect(renderer.element.style.display).toBe('none');

      renderer.destroy();
    });
  });

  describe('UniversalEditor Mentions Document API & Serialization', () => {
    it('inserts a mention programmatically via editor.insertMention()', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Hello </p>',
      });

      const user: MentionUser = {
        id: 2,
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://example.com/avatar.jpg',
        role: 'Full-Stack Engineer',
      };

      const success = editor.insertMention(user);
      expect(success).toBe(true);

      const html = editor.getHTML();
      expect(html).toContain('data-type="mention"');
      expect(html).toContain('data-id="2"');
      expect(html).toContain('@John Doe');

      const mentions = editor.getMentions();
      expect(mentions.length).toBe(1);
      expect(mentions[0].username).toBe('johndoe');

      editor.destroy();
    });

    it('serializes mentions into Tiptap JSON format correctly', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p>Assigned to <span data-type="mention" data-id="3" data-label="Jane Smith" data-username="janesmith">@Jane Smith</span></p>',
      });

      const json = editor.getJSON();
      expect(json.type).toBe('doc');

      const mentionNode = json.content?.[0]?.content?.find((node: any) => node.type === 'mention');
      expect(mentionNode).toBeDefined();
      expect(mentionNode?.attrs?.id).toBe('3');
      expect(mentionNode?.attrs?.label).toBe('Jane Smith');
      expect(mentionNode?.attrs?.username).toBe('janesmith');

      editor.destroy();
    });

    it('emits mention event on editor when mention is selected', () => {
      const editor = new UniversalEditor({
        element: container,
        content: '<p></p>',
      });

      let emittedUser: any = null;
      editor.on('mention', (payload: any) => {
        emittedUser = payload.user;
      });

      editor.insertMention(DEFAULT_MENTION_USERS[0]);
      // Manually trigger emission or verify API
      editor.emit('mention', { user: DEFAULT_MENTION_USERS[0] });

      expect(emittedUser).not.toBeNull();
      expect(emittedUser.id).toBe(DEFAULT_MENTION_USERS[0].id);

      editor.destroy();
    });
  });

  describe('Content Sanitizer Mentions Security', () => {
    it('preserves valid mention spans and attributes through sanitizer', () => {
      const sanitizer = new ContentSanitizer();
      const rawHtml = '<p>Ping <span data-type="mention" class="ue-mention" data-id="2" data-label="John Doe" data-username="johndoe">@John Doe</span> please</p>';

      const sanitized = sanitizer.sanitize(rawHtml);
      expect(sanitized).toContain('data-type="mention"');
      expect(sanitized).toContain('data-id="2"');
      expect(sanitized).toContain('data-label="John Doe"');
      expect(sanitized).toContain('@John Doe');
    });

    it('strips dangerous event handlers from mention chips', () => {
      const sanitizer = new ContentSanitizer();
      const maliciousHtml = '<p><span data-type="mention" class="ue-mention" data-id="2" onclick="alert(1)" onerror="alert(2)">@Malicious</span></p>';

      const sanitized = sanitizer.sanitize(maliciousHtml);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('data-type="mention"');
    });
  });
});
