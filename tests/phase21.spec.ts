import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  MockAIProvider,
  HttpAIProvider,
  AIAssistantManager,
  AIExtension,
  AIProvider,
} from '@universal-editor/core';
import { AIAssistantModal } from '@universal-editor/vue3';

describe('Phase 21: AI Assistant Integration', () => {
  describe('1. MockAIProvider', () => {
    let provider: MockAIProvider;

    beforeEach(() => {
      provider = new MockAIProvider({ simulatedDelayMs: 0 });
    });

    it('has expected identifier and name', () => {
      expect(provider.id).toBe('mock-ai-provider');
      expect(provider.name).toContain('Universal AI Assistant');
    });

    it('improves writing style and clarity', async () => {
      const input = 'in order to make better content due to the fact that we have a lot of readers';
      const output = await provider.improveWriting(input);
      expect(output).toContain('Enhanced:');
      expect(output).toContain('because');
      expect(output).toContain('numerous');
      expect(output).toContain('elevate');
    });

    it('fixes spelling and grammar errors', async () => {
      const input = 'teh developer will recieve teh seperate module untill friday';
      const output = await provider.fixGrammar(input);
      expect(output).toBe('The developer will receive the separate module until friday.');
    });

    it('rewrites text in professional tone', async () => {
      const input = 'we make the app fast';
      const output = await provider.rewrite(input, 'professional');
      expect(output).toContain('From an operational perspective');
      expect(output).toContain('optimizing overall organizational effectiveness');
    });

    it('rewrites text in casual tone', async () => {
      const input = 'we make the app fast';
      const output = await provider.rewrite(input, 'casual');
      expect(output).toContain('Hey there! Basically');
      expect(output).toContain('works like a charm!');
    });

    it('rewrites text in concise tone', async () => {
      const input = 'one two three four five six seven eight nine ten eleven twelve';
      const output = await provider.rewrite(input, 'concise');
      expect(output).toBe('one two three four five six seven eight nine ten.');
    });

    it('makes text shorter', async () => {
      const input = 'Universal Rich Text Editor delivers enterprise-grade architecture for modern web applications across Vue and React ecosystems';
      const output = await provider.makeShorter(input);
      expect(output.length).toBeLessThan(input.length);
      expect(output.endsWith('.')).toBe(true);
    });

    it('makes text longer with enterprise expansion', async () => {
      const input = 'The platform supports rich text';
      const output = await provider.makeLonger(input);
      expect(output.length).toBeGreaterThan(input.length);
      expect(output).toContain('sustained reliability, modular extensibility');
    });

    it('summarizes text into bullet points', async () => {
      const input = 'Document locking prevents simultaneous overwrites. Versioning enables instant rollbacks. AI assistance enhances productivity.';
      const output = await provider.summarize(input);
      expect(output).toContain('Key Summary Takeaways:');
      expect(output).toContain('• Document locking prevents simultaneous overwrites');
    });

    it('translates text into Spanish, Bengali, and Arabic', async () => {
      const input = 'Hello World';
      const es = await provider.translate(input, 'Spanish');
      expect(es).toBe('[Traducción al español] Editor de texto enriquecido universal: Hello World');

      const bn = await provider.translate(input, 'Bengali');
      expect(bn).toContain('[বাংলা অনুবাদ]');

      const ar = await provider.translate(input, 'Arabic');
      expect(ar).toContain('[الترجمة العربية]');
    });

    it('generates titles and descriptions', async () => {
      const input = 'enterprise rich text editing solution for cloud platforms';
      const title = await provider.generateTitle(input);
      expect(title).toContain(': Strategic Overview');

      const desc = await provider.generateDescription(input);
      expect(desc).toContain('An authoritative guide to');
      expect(desc).toContain('Designed for modular enterprise scalability.');
    });

    it('generates custom prompt instructions', async () => {
      const output = await provider.generate('Convert to JSON', { instruction: 'Format as JSON' });
      expect(output).toContain('[AI Generated Response to: "Convert to JSON"]');
    });
  });

  describe('2. HttpAIProvider', () => {
    it('sends correct HTTP POST payload to endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'Server AI Result' }),
      });

      const provider = new HttpAIProvider({
        endpoint: 'https://example.com/api/editor/ai/generate',
        headers: { 'X-Custom-Auth': 'Bearer token123' },
        fetchFn: mockFetch as any,
      });

      const res = await provider.improveWriting('Original text');
      expect(res).toBe('Server AI Result');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://example.com/api/editor/ai/generate');
      expect(init.method).toBe('POST');
      expect(init.headers['X-Custom-Auth']).toBe('Bearer token123');

      const body = JSON.parse(init.body);
      expect(body.action).toBe('improve');
      expect(body.text).toBe('Original text');
    });

    it('handles server error responses gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const provider = new HttpAIProvider({
        endpoint: 'https://example.com/api/editor/ai/generate',
        fetchFn: mockFetch as any,
      });

      await expect(provider.fixGrammar('test')).rejects.toThrow('AI Request Failed (500)');
    });
  });

  describe('3. AIAssistantManager', () => {
    it('provides list of available AI actions', () => {
      const manager = new AIAssistantManager();
      const actions = manager.getAvailableActions();
      expect(actions.length).toBe(10);
      expect(actions.map((a) => a.id)).toContain('improve');
      expect(actions.map((a) => a.id)).toContain('grammar');
      expect(actions.map((a) => a.id)).toContain('translate');
      expect(actions.map((a) => a.id)).toContain('custom');
    });

    it('allows swapping AI providers', () => {
      const customProvider: AIProvider = {
        id: 'custom-ai',
        name: 'Custom AI',
        generate: vi.fn(),
        improveWriting: vi.fn(),
        fixGrammar: vi.fn(),
        rewrite: vi.fn(),
        makeShorter: vi.fn(),
        makeLonger: vi.fn(),
        summarize: vi.fn(),
        translate: vi.fn(),
        generateTitle: vi.fn(),
        generateDescription: vi.fn(),
      };

      const manager = new AIAssistantManager();
      expect(manager.getProvider().id).toBe('mock-ai-provider');

      manager.setProvider(customProvider);
      expect(manager.getProvider().id).toBe('custom-ai');
    });

    it('emits loading events during execution', async () => {
      const manager = new AIAssistantManager({
        provider: new MockAIProvider({ simulatedDelayMs: 10 }),
      });

      const loadingStates: boolean[] = [];
      const unsubscribe = manager.onLoading((loading) => {
        loadingStates.push(loading);
      });

      const result = await manager.executeAction('improve', 'test text to improve');
      expect(result.action).toBe('improve');
      expect(result.resultText).toContain('Enhanced:');
      expect(loadingStates).toEqual([true, false]);

      unsubscribe();
    });

    it('rejects execution when text is empty for non-custom actions', async () => {
      const manager = new AIAssistantManager();
      await expect(manager.executeAction('improve', '')).rejects.toThrow(
        'Please select or provide text'
      );
    });

    it('executes custom actions with instructions', async () => {
      const manager = new AIAssistantManager({
        provider: new MockAIProvider({ simulatedDelayMs: 0 }),
      });

      const res = await manager.executeAction('custom', 'Context data', {
        instruction: 'Translate into bullets',
      });
      expect(res.action).toBe('custom');
      expect(res.resultText).toContain('[AI Generated Response to: "Translate into bullets');
    });

    it('notifies error listeners on failure', async () => {
      const failingProvider: AIProvider = {
        id: 'failing',
        name: 'Failing Provider',
        generate: vi.fn().mockRejectedValue(new Error('LLM Quota Exceeded')),
        improveWriting: vi.fn().mockRejectedValue(new Error('LLM Quota Exceeded')),
        fixGrammar: vi.fn(),
        rewrite: vi.fn(),
        makeShorter: vi.fn(),
        makeLonger: vi.fn(),
        summarize: vi.fn(),
        translate: vi.fn(),
        generateTitle: vi.fn(),
        generateDescription: vi.fn(),
      };

      const manager = new AIAssistantManager({ provider: failingProvider });
      const errorSpy = vi.fn();
      manager.onError(errorSpy);

      await expect(manager.executeAction('improve', 'Sample text')).rejects.toThrow('LLM Quota Exceeded');
      expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('4. AIExtension (Tiptap)', () => {
    it('defines extension name and storage defaults', () => {
      expect(AIExtension.name).toBe('aiExtension');
      const ext = AIExtension.configure();
      expect(ext.name).toBe('aiExtension');
    });
  });

  describe('5. AIAssistantModal.vue Component', () => {
    it('renders modal when modelValue is true', () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
          targetText: 'Selected sample content to test',
        },
      });

      expect(wrapper.find('.ue-ai-modal').exists()).toBe(true);
      expect(wrapper.find('.ue-ai-title').text()).toContain('Universal AI Assistant');
      expect(wrapper.find('.ue-ai-quote-content').text()).toContain('Selected sample content to test');
    });

    it('does not render modal when modelValue is false', () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: false,
        },
      });

      expect(wrapper.find('.ue-ai-modal').exists()).toBe(false);
    });

    it('renders AI action cards', () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
        },
      });

      const cards = wrapper.findAll('.ue-ai-action-card');
      expect(cards.length).toBeGreaterThanOrEqual(9);
      expect(wrapper.text()).toContain('Improve writing');
      expect(wrapper.text()).toContain('Fix grammar & spelling');
    });

    it('executes action on click and displays generated result', async () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
          targetText: 'teh recieve seperate untill',
          provider: new MockAIProvider({ simulatedDelayMs: 0 }),
        },
      });

      const grammarCard = wrapper
        .findAll('.ue-ai-action-card')
        .find((c) => c.text().includes('Fix grammar'));
      expect(grammarCard).toBeDefined();

      await grammarCard?.trigger('click');

      // Wait for async execution
      await vi.waitFor(() => {
        expect(wrapper.find('.ue-ai-preview-box').exists()).toBe(true);
      });

      expect(wrapper.find('.ue-ai-preview-box').text()).toContain('The receive separate until.');
    });

    it('executes custom prompt via input field', async () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
          targetText: 'Some text',
          provider: new MockAIProvider({ simulatedDelayMs: 0 }),
        },
      });

      const input = wrapper.find<HTMLInputElement>('.ue-ai-prompt-input');
      await input.setValue('Summarize into one sentence');

      const askBtn = wrapper.find('.ue-ai-prompt-btn');
      await askBtn.trigger('click');

      await vi.waitFor(() => {
        expect(wrapper.find('.ue-ai-preview-box').exists()).toBe(true);
      });

      expect(wrapper.find('.ue-ai-preview-box').text()).toContain('[AI Generated Response');
    });

    it('emits apply with replace and insertBelow modes', async () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
          targetText: 'hello world',
          provider: new MockAIProvider({ simulatedDelayMs: 0 }),
        },
      });

      const improveCard = wrapper
        .findAll('.ue-ai-action-card')
        .find((c) => c.text().includes('Improve writing'));
      await improveCard?.trigger('click');

      await vi.waitFor(() => {
        expect(wrapper.find('.ue-ai-preview-box').exists()).toBe(true);
      });

      const replaceBtn = wrapper.find('.ue-btn-primary');
      await replaceBtn.trigger('click');

      const applyEmits = wrapper.emitted('apply');
      expect(applyEmits).toBeDefined();
      expect(applyEmits![0][0]).toEqual({
        text: expect.stringContaining('Enhanced:'),
        insertMode: 'replace',
      });
      expect(wrapper.emitted('update:modelValue')![0][0]).toBe(false);
    });

    it('emits update:modelValue false on cancel', async () => {
      const wrapper = mount(AIAssistantModal, {
        props: {
          modelValue: true,
        },
      });

      const cancelBtn = wrapper.find('.ue-btn-cancel');
      await cancelBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')![0][0]).toBe(false);
    });
  });
});
