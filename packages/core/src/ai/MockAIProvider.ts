import { AIProvider, AIOptions } from './types';

/**
 * MockAIProvider
 *
 * Intelligent offline/test AI Provider delivering realistic, deterministic
 * text improvements, grammar fixes, tone rewrites, translations, and summaries.
 */
export class MockAIProvider implements AIProvider {
  public readonly id = 'mock-ai-provider';
  public readonly name = 'Universal AI Assistant (Local)';

  protected simulatedDelayMs: number;

  constructor(options: { simulatedDelayMs?: number } = {}) {
    this.simulatedDelayMs = options.simulatedDelayMs ?? 0;
  }

  protected async delay(): Promise<void> {
    if (this.simulatedDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.simulatedDelayMs));
    }
  }

  public async generate(prompt: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return '';
    return `[AI Generated Response to: "${cleanPrompt}"]\nUniversal Rich Text Editor provides an extensible, framework-independent architecture designed for high-performance content management across enterprise workflows.`;
  }

  public async improveWriting(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    let improved = text.trim();
    // Polish common clunky phrases
    improved = improved
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\bdue to the fact that\b/gi, 'because')
      .replace(/\bat this point in time\b/gi, 'currently')
      .replace(/\ba lot of\b/gi, 'numerous')
      .replace(/\bvery good\b/gi, 'exceptional')
      .replace(/\bmake better\b/gi, 'elevate');

    // Capitalize first letter and ensure ending punctuation
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (!/[.!?]$/.test(improved)) {
      improved += '.';
    }

    return `Enhanced: ${improved}`;
  }

  public async fixGrammar(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    let fixed = text.trim();
    // Common grammatical and spelling corrections
    fixed = fixed
      .replace(/\bteh\b/g, 'the')
      .replace(/\brecieve\b/g, 'receive')
      .replace(/\bseperate\b/g, 'separate')
      .replace(/\buntill\b/g, 'until')
      .replace(/\bi\b/g, 'I')
      .replace(/\bdont\b/g, "don't")
      .replace(/\bcant\b/g, "can't")
      .replace(/\bwont\b/g, "won't")
      .replace(/\s+,/g, ',')
      .replace(/\s+\./g, '.')
      .replace(/([.!?])\s*([a-z])/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`);

    // Ensure initial capital and ending period
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
    if (!/[.!?]$/.test(fixed)) {
      fixed += '.';
    }

    return fixed;
  }

  public async rewrite(text: string, instructionOrTone?: string, options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const tone = (instructionOrTone || options?.tone || 'professional').toLowerCase();

    switch (tone) {
      case 'professional':
        return `From an operational perspective, ${text.trim().toLowerCase().replace(/[.]+$/, '')}, thereby optimizing overall organizational effectiveness.`;
      case 'casual':
        return `Hey there! Basically, ${text.trim().toLowerCase().replace(/[.]+$/, '')} — and it works like a charm!`;
      case 'concise':
        return text.trim().split(/\s+/).slice(0, 10).join(' ') + '.';
      case 'creative':
        return `Imagine a transformative realm where ${text.trim().toLowerCase().replace(/[.]+$/, '')}, unlocking limitless potential.`;
      case 'academic':
        return `Empirical evidence indicates that ${text.trim().toLowerCase().replace(/[.]+$/, '')}, correlating with theoretical paradigms.`;
      default:
        return `Rewritten (${instructionOrTone}): ${text.trim()}`;
    }
  }

  public async makeShorter(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const words = text.trim().split(/\s+/);
    if (words.length <= 8) {
      return text.trim();
    }

    // Keep the first 40% of words and wrap cleanly
    const condensedLength = Math.max(5, Math.ceil(words.length * 0.45));
    const condensed = words.slice(0, condensedLength).join(' ');
    return condensed.replace(/[,;:]$/, '') + '.';
  }

  public async makeLonger(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const clean = text.trim().replace(/[.]+$/, '');
    return `${clean}. Furthermore, this foundational design incorporates robust architectural guarantees, ensuring sustained reliability, modular extensibility, and seamless user interaction across enterprise production environments.`;
  }

  public async summarize(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      return `Summary: ${text.trim()}`;
    }

    const bullets = sentences
      .slice(0, 3)
      .map((s) => `• ${s}`)
      .join('\n');

    return `Key Summary Takeaways:\n${bullets}`;
  }

  public async translate(text: string, targetLanguage: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const lang = targetLanguage.toLowerCase().trim();

    // Multilingual dictionary for standard phrases & Unicode support
    if (lang.includes('bengali') || lang.includes('bangla') || lang === 'bn') {
      return `[বাংলা অনুবাদ] ইউনিভার্সাল রিচ টেকস্ট এডিটর: ${text.trim()}`;
    }
    if (lang.includes('arabic') || lang === 'ar') {
      return `[الترجمة العربية] محرر نصوص غني وشامل: ${text.trim()}`;
    }
    if (lang.includes('spanish') || lang === 'es') {
      return `[Traducción al español] Editor de texto enriquecido universal: ${text.trim()}`;
    }
    if (lang.includes('french') || lang === 'fr') {
      return `[Traduction française] Éditeur de texte enrichi universel: ${text.trim()}`;
    }
    if (lang.includes('german') || lang === 'de') {
      return `[Deutsche Übersetzung] Universeller Rich-Text-Editor: ${text.trim()}`;
    }
    if (lang.includes('hindi') || lang === 'hi') {
      return `[हिंदी अनुवाद] यूनिवर्सल रिच टेक्स्ट एडिटर: ${text.trim()}`;
    }

    return `[Translated to ${targetLanguage}]: ${text.trim()}`;
  }

  public async generateTitle(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return 'Untitled Document';

    const words = text
      .trim()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4);

    if (words.length === 0) {
      return 'Enterprise Rich Text Overview';
    }

    const capitalized = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return `${capitalized.join(' ')}: Strategic Overview`;
  }

  public async generateDescription(text: string, _options?: AIOptions): Promise<string> {
    await this.delay();
    if (!text.trim()) return '';

    const words = text.trim().split(/\s+/).slice(0, 20).join(' ');
    return `An authoritative guide to ${words.toLowerCase()}... Designed for modular enterprise scalability.`;
  }
}
