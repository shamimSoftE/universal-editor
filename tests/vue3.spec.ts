import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { RichTextEditor } from '@universal-editor/vue3';

describe('Phase 3 — Vue 3 Component (<RichTextEditor />)', () => {
  it('should mount cleanly with default props and emit ready event', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: '<p>Vue 3 Initial Content</p>',
      },
    });

    await nextTick();

    expect(wrapper.find('.ue-editor-card').exists()).toBe(true);
    expect(wrapper.find('.ue-toolbar').exists()).toBe(true);
    expect(wrapper.find('.ue-footer').exists()).toBe(true);
    expect(wrapper.emitted('ready')).toBeTruthy();

    const readyEvent = wrapper.emitted('ready')![0][0] as any;
    expect(readyEvent.editor).toBeDefined();
    expect(readyEvent.editor.getHTML()).toContain('Vue 3 Initial Content');

    wrapper.unmount();
  });

  it('should support custom toolbar configuration array', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        toolbar: ['bold', 'italic', '|', 'undo'],
      },
    });

    await nextTick();

    expect(wrapper.find('.ue-toolbar .ue-btn-bold').exists()).toBe(true);
    expect(wrapper.find('.ue-toolbar .ue-btn-italic').exists()).toBe(true);
    expect(wrapper.find('.ue-toolbar .ue-btn-underline').exists()).toBe(false);

    wrapper.unmount();
  });

  it('should hide toolbar when toolbar prop is false', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        toolbar: false,
      },
    });

    await nextTick();

    expect(wrapper.find('.ue-toolbar').exists()).toBe(false);

    wrapper.unmount();
  });

  it('should apply readonly and disabled states', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        disabled: true,
      },
    });

    await nextTick();

    expect(wrapper.classes()).toContain('is-disabled');

    await wrapper.setProps({ disabled: false, readonly: true });
    expect(wrapper.classes()).toContain('is-readonly');

    wrapper.unmount();
  });

  it('should calculate words and characters in the footer', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: '<p>Three words here</p>',
        characterLimit: 100,
        wordLimit: 20,
      },
    });

    await nextTick();

    const footerText = wrapper.find('.ue-footer').text();
    expect(footerText).toContain('3 words / 20');
    expect(footerText).toContain('characters / 100');

    wrapper.unmount();
  });

  it('should expose public methods via template ref', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: '<p>Test expose</p>',
      },
    });

    await nextTick();

    const vm = wrapper.vm as any;
    expect(typeof vm.getHTML).toBe('function');
    expect(typeof vm.getJSON).toBe('function');
    expect(typeof vm.getText).toBe('function');
    expect(typeof vm.setContent).toBe('function');
    expect(typeof vm.clearContent).toBe('function');

    expect(vm.getText()).toContain('Test expose');

    vm.setContent('<p>Changed text</p>');
    expect(vm.getText()).toContain('Changed text');

    vm.clearContent();
    expect(vm.getText().trim()).toBe('');

    wrapper.unmount();
  });

  it('should support outputFormat json', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: '<p>JSON format</p>',
        outputFormat: 'json',
      },
    });

    await nextTick();

    const vm = wrapper.vm as any;
    const json = vm.getJSON();
    expect(json.type).toBe('doc');
    expect(Array.isArray(json.content)).toBe(true);

    wrapper.unmount();
  });

  it('should support outputFormat text', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        modelValue: '<p>Plain text format</p>',
        outputFormat: 'text',
      },
    });

    await nextTick();

    const vm = wrapper.vm as any;
    expect(vm.getText()).toContain('Plain text format');

    wrapper.unmount();
  });

  it('should apply darkMode class when darkMode is true', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        darkMode: true,
      },
    });

    await nextTick();

    expect(wrapper.classes()).toContain('ue-dark-mode');

    wrapper.unmount();
  });

  it('should apply minHeight and maxHeight styles correctly', async () => {
    const wrapper = mount(RichTextEditor, {
      props: {
        minHeight: 400,
        maxHeight: '600px',
      },
    });

    await nextTick();

    const surface = wrapper.find('.ue-surface-wrapper');
    expect(surface.attributes('style')).toContain('min-height: 400px');
    expect(surface.attributes('style')).toContain('max-height: 600px');

    wrapper.unmount();
  });
});
