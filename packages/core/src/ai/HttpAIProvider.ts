import { AIProvider, AIOptions } from './types';

export interface HttpAIProviderConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * HttpAIProvider
 *
 * Pluggable HTTP REST client that delegates AI assistant queries to a backend proxy
 * (e.g. Laravel `/editor/ai/generate`, Next.js API routes, or Python FastAPIs),
 * keeping secret API keys securely on the server.
 */
export class HttpAIProvider implements AIProvider {
  public readonly id = 'http-ai-provider';
  public readonly name = 'Remote AI Proxy';

  protected endpoint: string;
  protected headers: Record<string, string>;
  protected timeoutMs: number;
  protected fetchFn: typeof fetch;

  constructor(config: HttpAIProviderConfig) {
    this.endpoint = config.endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(config.headers || {}),
    };
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.fetchFn = config.fetchFn || (typeof window !== 'undefined' ? window.fetch.bind(window) : (globalThis as any).fetch);
  }

  protected async sendRequest(action: string, text: string, options?: AIOptions): Promise<string> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      const response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action,
          text,
          options: options || {},
        }),
        signal: controller?.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Request Failed (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      return json.result || json.data?.result || json.text || '';
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  public async generate(prompt: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('generate', prompt, options);
  }

  public async improveWriting(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('improve', text, options);
  }

  public async fixGrammar(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('grammar', text, options);
  }

  public async rewrite(text: string, instructionOrTone?: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('rewrite', text, {
      ...options,
      instruction: instructionOrTone,
    });
  }

  public async makeShorter(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('shorter', text, options);
  }

  public async makeLonger(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('longer', text, options);
  }

  public async summarize(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('summarize', text, options);
  }

  public async translate(text: string, targetLanguage: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('translate', text, {
      ...options,
      targetLanguage,
    });
  }

  public async generateTitle(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('title', text, options);
  }

  public async generateDescription(text: string, options?: AIOptions): Promise<string> {
    return this.sendRequest('description', text, options);
  }
}
