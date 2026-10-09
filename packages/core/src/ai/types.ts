/**
 * AI Assistant Integration Types (Phase 21)
 *
 * Fully decoupled and optional AI architecture supporting custom AI providers,
 * server proxies, and client-side models.
 */

export type AIActionType =
  | 'improve'
  | 'grammar'
  | 'rewrite'
  | 'shorter'
  | 'longer'
  | 'summarize'
  | 'translate'
  | 'title'
  | 'description'
  | 'custom';

export type AIRewriteTone =
  | 'professional'
  | 'casual'
  | 'confident'
  | 'friendly'
  | 'concise'
  | 'creative'
  | 'academic';

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  tone?: AIRewriteTone;
  targetLanguage?: string;
  instruction?: string;
  context?: string;
}

export interface AIActionResult {
  action: AIActionType;
  originalText: string;
  resultText: string;
  timestamp: number;
  provider: string;
}

/**
 * Pluggable AI Provider Interface
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Execute an arbitrary prompt
   */
  generate(prompt: string, options?: AIOptions): Promise<string>;

  /**
   * Improve writing style and clarity
   */
  improveWriting(text: string, options?: AIOptions): Promise<string>;

  /**
   * Fix spelling and grammatical mistakes
   */
  fixGrammar(text: string, options?: AIOptions): Promise<string>;

  /**
   * Rewrite text with a specific instruction or tone
   */
  rewrite(text: string, instructionOrTone?: string, options?: AIOptions): Promise<string>;

  /**
   * Condense text into a shorter, punchier version
   */
  makeShorter(text: string, options?: AIOptions): Promise<string>;

  /**
   * Expand text with more detail and elaboration
   */
  makeLonger(text: string, options?: AIOptions): Promise<string>;

  /**
   * Summarize text into key takeaways or executive summary
   */
  summarize(text: string, options?: AIOptions): Promise<string>;

  /**
   * Translate text into target language
   */
  translate(text: string, targetLanguage: string, options?: AIOptions): Promise<string>;

  /**
   * Generate an engaging document or section title
   */
  generateTitle(text: string, options?: AIOptions): Promise<string>;

  /**
   * Generate a concise meta description or abstract
   */
  generateDescription(text: string, options?: AIOptions): Promise<string>;
}

export interface AIActionDefinition {
  id: AIActionType;
  title: string;
  description: string;
  icon: string;
  shortcut?: string;
  requiresInput?: boolean;
  inputPlaceholder?: string;
}
