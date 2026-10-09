import {
  AIProvider,
  AIActionType,
  AIActionDefinition,
  AIOptions,
  AIActionResult,
} from './types';
import { MockAIProvider } from './MockAIProvider';

export const AI_ACTIONS: AIActionDefinition[] = [
  {
    id: 'improve',
    title: 'Improve writing',
    description: 'Enhance vocabulary, flow, and clarity',
    icon: '✨',
  },
  {
    id: 'grammar',
    title: 'Fix grammar & spelling',
    description: 'Correct typos and punctuation errors',
    icon: '✅',
  },
  {
    id: 'rewrite',
    title: 'Rewrite with tone',
    description: 'Adapt tone to professional, casual, or concise',
    icon: '🔄',
    requiresInput: true,
    inputPlaceholder: 'Select tone (professional, casual, concise, creative)...',
  },
  {
    id: 'shorter',
    title: 'Make shorter',
    description: 'Condense into brief, punchy sentences',
    icon: '✂️',
  },
  {
    id: 'longer',
    title: 'Make longer',
    description: 'Elaborate with more depth and explanation',
    icon: '📝',
  },
  {
    id: 'summarize',
    title: 'Summarize',
    description: 'Extract key takeaways and bullet points',
    icon: '📋',
  },
  {
    id: 'translate',
    title: 'Translate',
    description: 'Translate into Bangla, Arabic, Spanish, French, etc.',
    icon: '🌐',
    requiresInput: true,
    inputPlaceholder: 'Target language (e.g. Spanish, Bengali, Arabic, French)...',
  },
  {
    id: 'title',
    title: 'Generate title',
    description: 'Create an engaging headline',
    icon: '🏷️',
  },
  {
    id: 'description',
    title: 'Generate description',
    description: 'Create an executive summary or meta description',
    icon: '📄',
  },
  {
    id: 'custom',
    title: 'Custom AI Prompt',
    description: 'Instruct AI to perform any custom transformation',
    icon: '💡',
    requiresInput: true,
    inputPlaceholder: 'e.g. Convert into a bulleted FAQ list...',
  },
];

export interface AIAssistantManagerOptions {
  provider?: AIProvider;
  defaultTone?: string;
  defaultLanguage?: string;
}

/**
 * AIAssistantManager
 *
 * Central coordinator connecting the editor to the configured AIProvider.
 */
export class AIAssistantManager {
  protected provider: AIProvider;
  protected loadingListeners: Set<(loading: boolean) => void> = new Set();
  protected errorListeners: Set<(err: Error) => void> = new Set();

  constructor(options: AIAssistantManagerOptions = {}) {
    this.provider = options.provider || new MockAIProvider();
  }

  public setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  public getProvider(): AIProvider {
    return this.provider;
  }

  public getAvailableActions(): AIActionDefinition[] {
    return AI_ACTIONS;
  }

  /**
   * Execute an AI action on the provided text.
   */
  public async executeAction(
    action: AIActionType,
    text: string,
    options: AIOptions = {}
  ): Promise<AIActionResult> {
    if (!text && action !== 'custom') {
      throw new Error('Please select or provide text to execute this AI action.');
    }

    this.setLoading(true);

    try {
      let resultText = '';

      switch (action) {
        case 'improve':
          resultText = await this.provider.improveWriting(text, options);
          break;
        case 'grammar':
          resultText = await this.provider.fixGrammar(text, options);
          break;
        case 'rewrite':
          resultText = await this.provider.rewrite(text, options.tone || options.instruction, options);
          break;
        case 'shorter':
          resultText = await this.provider.makeShorter(text, options);
          break;
        case 'longer':
          resultText = await this.provider.makeLonger(text, options);
          break;
        case 'summarize':
          resultText = await this.provider.summarize(text, options);
          break;
        case 'translate':
          resultText = await this.provider.translate(
            text,
            options.targetLanguage || 'Spanish',
            options
          );
          break;
        case 'title':
          resultText = await this.provider.generateTitle(text, options);
          break;
        case 'description':
          resultText = await this.provider.generateDescription(text, options);
          break;
        case 'custom':
          resultText = await this.provider.generate(
            options.instruction ? `${options.instruction}\n\nContext:\n${text}` : text,
            options
          );
          break;
        default:
          throw new Error(`Unsupported AI action: ${action}`);
      }

      const result: AIActionResult = {
        action,
        originalText: text,
        resultText,
        timestamp: Date.now(),
        provider: this.provider.name,
      };

      return result;
    } catch (err: any) {
      this.notifyError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  public onLoading(callback: (loading: boolean) => void): () => void {
    this.loadingListeners.add(callback);
    return () => this.loadingListeners.delete(callback);
  }

  public onError(callback: (err: Error) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  protected setLoading(loading: boolean): void {
    for (const listener of this.loadingListeners) {
      listener(loading);
    }
  }

  protected notifyError(err: Error): void {
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }
}
