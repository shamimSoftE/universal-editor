export interface EditorStatistics {
  /** Total word count */
  words: number;
  /** Total characters including spaces */
  characters: number;
  /** Total characters excluding whitespace */
  charactersExcludingSpaces: number;
  /** Total paragraph and block node count */
  paragraphs: number;
  /** Estimated reading time in minutes (minimum 1) */
  readingTime: number;
  /** Formatted reading time string (e.g. "< 1 min read", "2 min read") */
  readingTimeString: string;
  /** Optional configured character limit */
  characterLimit?: number;
  /** Optional configured word limit */
  wordLimit?: number;
  /** Whether character count is approaching the warning threshold (>= 90%) */
  isCharacterLimitApproaching?: boolean;
  /** Whether character count has exceeded the maximum limit */
  isCharacterLimitExceeded?: boolean;
  /** Whether word count is approaching the warning threshold (>= 90%) */
  isWordLimitApproaching?: boolean;
  /** Whether word count has exceeded the maximum limit */
  isWordLimitExceeded?: boolean;
}

export interface StatisticsConfig {
  /** Maximum allowed characters */
  maxCharacters?: number;
  characterLimit?: number;
  /** Maximum allowed words */
  maxWords?: number;
  wordLimit?: number;
  /** Whether to strictly block further input when max limit is exceeded (default: false) */
  hardLimit?: boolean;
  blockOnLimit?: boolean;
  /** Threshold percentage (0.0 to 1.0) to emit warning / show approaching state (default: 0.9 / 90%) */
  warningThreshold?: number;
  /** Words read per minute for reading time estimate (default: 200) */
  wordsPerMinute?: number;
}

export interface LimitEventPayload {
  type: 'characters' | 'words';
  current: number;
  limit: number;
  percentage: number;
}
