import type { MentionUser, MentionProvider } from './types';

export const DEFAULT_MENTION_USERS: MentionUser[] = [
  {
    id: 1,
    name: 'Shamim Reza',
    username: 'shamim',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    email: 'shamim@linktechbd.com',
    role: 'Lead Architect',
    badge: 'Owner',
  },
  {
    id: 2,
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    email: 'john.doe@example.com',
    role: 'Full-Stack Engineer',
    badge: 'Core Team',
  },
  {
    id: 3,
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    email: 'jane.smith@example.com',
    role: 'Product Designer',
    badge: 'UI/UX',
  },
  {
    id: 4,
    name: 'Alex Johnson',
    username: 'alex',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    email: 'alex.j@example.com',
    role: 'Security Engineer',
    badge: 'Infra',
  },
  {
    id: 5,
    name: 'Sarah Connor',
    username: 'sarah',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    email: 'sarah.c@example.com',
    role: 'QA Lead',
    badge: 'Automation',
  },
  {
    id: 6,
    name: 'Michael Brown',
    username: 'michael',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    email: 'michael.b@example.com',
    role: 'Backend Developer',
    badge: 'Laravel',
  },
  {
    id: 7,
    name: 'Emily Davis',
    username: 'emily',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    email: 'emily.d@example.com',
    role: 'Frontend Specialist',
    badge: 'Vue 3',
  },
  {
    id: 8,
    name: 'David Wilson',
    username: 'david',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    email: 'david.w@example.com',
    role: 'DevOps Specialist',
    badge: 'SRE',
  },
];

/**
 * Filter users by query string against name, username, or email.
 */
export function filterMentionUsers(
  users: MentionUser[],
  query: string,
  limit = 10
): MentionUser[] {
  const cleanQuery = query.startsWith('@') ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  if (!cleanQuery) {
    return users.slice(0, limit);
  }

  const results = users.filter(user => {
    const displayName = user.name || user.label || '';
    const nameMatch = displayName.toLowerCase().includes(cleanQuery);
    const usernameMatch = (user.username || '').toLowerCase().includes(cleanQuery);
    const emailMatch = user.email ? user.email.toLowerCase().includes(cleanQuery) : false;
    const roleMatch = user.role ? user.role.toLowerCase().includes(cleanQuery) : false;

    return nameMatch || usernameMatch || emailMatch || roleMatch;
  });

  return results.slice(0, limit);
}

/**
 * Create a default mention provider that attempts remote backend fetch with local fallback.
 */
export function createDefaultMentionProvider(
  fallbackUsers: MentionUser[] = DEFAULT_MENTION_USERS,
  apiUrl = '/api/users/search'
): MentionProvider {
  return async (query: string): Promise<MentionUser[]> => {
    const cleanQuery = query.startsWith('@') ? query.slice(1).trim() : query.trim();

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        const url = `${apiUrl}?q=${encodeURIComponent(cleanQuery)}`;
        const res = await window.fetch(url, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data;
          }
          if (data && Array.isArray(data.users)) {
            return data.users;
          }
          if (data && Array.isArray(data.data)) {
            return data.data;
          }
        }
      } catch {
        // Fallback to local filtering on network/CORS error or in test environments
      }
    }

    return filterMentionUsers(fallbackUsers, cleanQuery);
  };
}
