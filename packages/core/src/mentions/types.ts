export interface MentionUser {
  id: string | number;
  name: string;
  label?: string;
  username: string;
  avatar?: string;
  email?: string;
  role?: string;
  badge?: string;
}

export type MentionProvider = (
  query: string
) => Promise<MentionUser[]> | MentionUser[];

export interface MentionConfig {
  /**
   * Whether mentions are enabled (default: true)
   */
  enabled?: boolean;

  /**
   * Trigger character to invoke mentions (default: '@')
   */
  triggerChar?: string;

  /**
   * Data provider function for searching users
   */
  provider?: MentionProvider;

  /**
   * Default/fallback list of users
   */
  defaultUsers?: MentionUser[];

  /**
   * Maximum number of suggestions to display (default: 10)
   */
  maxSuggestions?: number;

  /**
   * Callback fired when a mention is chosen/executed
   */
  onMentionSelected?: (user: MentionUser) => void;
}
