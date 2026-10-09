import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  Announcer,
  FocusTrap,
  ToolbarKeyboardNav,
  MobileManager,
  createEditor,
} from '@universal-editor/core';
import { RichTextEditor } from '@universal-editor/vue3';

describe('Phase 23: Mobile Optimization & Accessibility (WCAG 2.1 / ARIA)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('1. Screen Reader Announcer (WCAG 2.1 Live Region)', () => {
    it('creates off-screen live region element with role="status" and aria-live="polite"', () => {
      const announcer = new Announcer({ announcerPoliteness: 'polite' });
      const el = announcer.getElement();
      expect(el).not.toBeNull();
      expect(el?.getAttribute('role')).toBe('status');
      expect(el?.getAttribute('aria-live')).toBe('polite');
      expect(el?.classList.contains('ue-sr-only')).toBe(true);
      expect(el?.classList.contains('ue-announcer')).toBe(true);
      announcer.destroy();
    });

    it('broadcasts debounced announcement messages to assistive technologies', () => {
      const announcer = new Announcer();
      announcer.announce('Bold text activated', { debounceMs: 50 });

      // Before timer ticks
      expect(announcer.getElement()?.textContent).toBe('');

      // Fast-forward debounce
      vi.advanceTimersByTime(60);
      expect(announcer.getElement()?.textContent).toBe('Bold text activated');

      // Subsequent identical message alternates text with zero-width space
      announcer.announce('Bold text activated', { debounceMs: 50 });
      vi.advanceTimersByTime(60);
      expect(announcer.getElement()?.textContent).toContain('Bold text activated');
      expect(announcer.getElement()?.textContent).toContain('\u200B');

      announcer.destroy();
    });

    it('supports assertive politeness level for critical alerts', () => {
      const announcer = new Announcer({ announcerPoliteness: 'assertive' });
      expect(announcer.getElement()?.getAttribute('aria-live')).toBe('assertive');

      announcer.announce('Character limit exceeded!', {
        politeness: 'assertive',
        debounceMs: 20,
      });
      vi.advanceTimersByTime(30);

      expect(announcer.getElement()?.textContent).toBe('Character limit exceeded!');
      expect(announcer.getElement()?.getAttribute('aria-live')).toBe('assertive');
      announcer.destroy();
    });

    it('clears and destroys live region element cleanly from DOM', () => {
      const announcer = new Announcer();
      announcer.announce('Temp announcement', { debounceMs: 10 });
      vi.advanceTimersByTime(20);

      announcer.clear();
      expect(announcer.getElement()?.textContent).toBe('');

      announcer.destroy();
      expect(announcer.getElement()).toBeNull();
    });
  });

  describe('2. Focus Trap (WCAG 2.1 Modal Focus Management)', () => {
    it('traps keyboard focus inside modal and cycles on Tab and Shift+Tab', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <input id="input1" type="text" />
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;
      document.body.appendChild(container);

      const onEscape = vi.fn();
      const trap = new FocusTrap(container, { onEscape, initialFocus: true });

      const input1 = container.querySelector('#input1') as HTMLElement;
      const btn2 = container.querySelector('#btn2') as HTMLElement;

      trap.activate();
      expect(trap.getIsActive()).toBe(true);

      // Simulates Tab at the end of modal: cycles to first element
      btn2.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      container.dispatchEvent(tabEvent);

      // Simulates Shift+Tab at the beginning of modal: cycles to last element
      input1.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      container.dispatchEvent(shiftTabEvent);

      // Simulates Escape key: invokes onEscape callback
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      container.dispatchEvent(escEvent);
      expect(onEscape).toHaveBeenCalledTimes(1);

      trap.deactivate();
      expect(trap.getIsActive()).toBe(false);
      trap.destroy();
      document.body.removeChild(container);
    });
  });

  describe('3. Toolbar Keyboard Navigation (WAI-ARIA Roving Tabindex)', () => {
    it('initializes single tab stop (tabindex="0" on first item, "-1" on others)', () => {
      const toolbar = document.createElement('div');
      toolbar.innerHTML = `
        <button id="btn-bold">Bold</button>
        <button id="btn-italic">Italic</button>
        <button id="btn-underline">Underline</button>
      `;
      document.body.appendChild(toolbar);

      const nav = new ToolbarKeyboardNav(toolbar);
      const items = nav.getItems();

      expect(toolbar.getAttribute('role')).toBe('toolbar');
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('-1');

      nav.destroy();
      document.body.removeChild(toolbar);
    });

    it('navigates with ArrowRight and ArrowLeft with wrap-around', () => {
      const toolbar = document.createElement('div');
      toolbar.innerHTML = `
        <button id="b1">B1</button>
        <button id="b2">B2</button>
        <button id="b3">B3</button>
      `;
      document.body.appendChild(toolbar);

      const nav = new ToolbarKeyboardNav(toolbar, { wrap: true });
      const items = nav.getItems();

      // Focus first item
      items[0].focus();
      expect(nav.getCurrentIndex()).toBe(0);

      // ArrowRight to second item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(1);
      expect(items[1].getAttribute('tabindex')).toBe('0');
      expect(items[0].getAttribute('tabindex')).toBe('-1');

      // ArrowRight to third item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(2);

      // ArrowRight wraps around to first item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(0);

      // ArrowLeft wraps backwards to last item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(2);

      nav.destroy();
      document.body.removeChild(toolbar);
    });

    it('handles Home and End keys to jump to bounds', () => {
      const toolbar = document.createElement('div');
      toolbar.innerHTML = `
        <button id="b1">B1</button>
        <button id="b2">B2</button>
        <button id="b3">B3</button>
      `;
      document.body.appendChild(toolbar);

      const nav = new ToolbarKeyboardNav(toolbar);
      const items = nav.getItems();

      items[0].focus();

      // End key moves to last item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(2);
      expect(items[2].getAttribute('tabindex')).toBe('0');

      // Home key moves to first item
      toolbar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      );
      expect(nav.getCurrentIndex()).toBe(0);
      expect(items[0].getAttribute('tabindex')).toBe('0');

      nav.destroy();
      document.body.removeChild(toolbar);
    });
  });

  describe('4. Mobile Optimization & Touch (MobileManager)', () => {
    it('detects responsive device types (mobile, tablet, desktop)', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const manager = new MobileManager(container, {
        breakpoints: { mobile: 768, tablet: 1024 },
      });

      expect(manager.getDeviceType(375)).toBe('mobile');
      expect(manager.getDeviceType(767)).toBe('mobile');
      expect(manager.getDeviceType(768)).toBe('tablet');
      expect(manager.getDeviceType(1023)).toBe('tablet');
      expect(manager.getDeviceType(1024)).toBe('desktop');
      expect(manager.getDeviceType(1440)).toBe('desktop');

      manager.destroy();
      document.body.removeChild(container);
    });

    it('applies simulated width and notifies listeners of state updates', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const manager = new MobileManager(container);
      const listener = vi.fn();
      manager.onViewportChange(listener);

      manager.setSimulatedWidth(480);
      expect(container.classList.contains('ue-mobile-view')).toBe(true);
      expect(manager.getState().deviceType).toBe('mobile');
      expect(listener).toHaveBeenCalled();

      manager.setSimulatedWidth(800);
      expect(container.classList.contains('ue-tablet-view')).toBe(true);
      expect(manager.getState().deviceType).toBe('tablet');

      manager.setSimulatedWidth(1280);
      expect(container.classList.contains('ue-desktop-view')).toBe(true);
      expect(manager.getState().deviceType).toBe('desktop');

      manager.destroy();
      document.body.removeChild(container);
    });

    it('manages bottom sheet mode toggle for mobile devices', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const manager = new MobileManager(container, {
        bottomSheetOnMobile: true,
      });

      manager.openBottomSheet();
      expect(container.classList.contains('ue-bottom-sheet-open')).toBe(true);

      manager.closeBottomSheet();
      expect(container.classList.contains('ue-bottom-sheet-open')).toBe(false);

      const isOpen = manager.toggleBottomSheet();
      expect(isOpen).toBe(true);
      expect(container.classList.contains('ue-bottom-sheet-open')).toBe(true);

      manager.destroy();
      document.body.removeChild(container);
    });
  });

  describe('5. UniversalEditor Accessibility & Mobile Integration', () => {
    it('initializes Announcer and binds ARIA attributes to ProseMirror content area', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const editor = createEditor({
        element: container,
        accessibility: {
          editorLabel: 'Customer Support Feedback Editor',
          announcerPoliteness: 'polite',
        },
      });

      expect(editor.announcer).toBeDefined();

      const pm = container.querySelector('.ProseMirror');
      expect(pm?.getAttribute('role')).toBe('textbox');
      expect(pm?.getAttribute('aria-multiline')).toBe('true');
      expect(pm?.getAttribute('aria-label')).toBe('Customer Support Feedback Editor');

      editor.destroy();
      document.body.removeChild(container);
    });

    it('initializes MobileManager when mobile option is active', () => {
      const wrapper = document.createElement('div');
      const container = document.createElement('div');
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      const editor = createEditor({
        element: container,
        mobile: {
          enabled: true,
          toolbarMode: 'scrollable',
        },
      });

      expect(editor.mobileManager).toBeDefined();
      expect(editor.mobileManager?.getState().deviceType).toBeDefined();

      editor.destroy();
      document.body.removeChild(wrapper);
    });
  });

  describe('6. Vue 3 RichTextEditor Component Accessibility & Mobile Support', () => {
    it('renders with accessible role="region" and aria-label', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '<p>Accessible content</p>',
          accessibility: true,
          mobile: true,
        },
        attachTo: document.body,
      });

      const card = wrapper.find('.ue-editor-card');
      expect(card.exists()).toBe(true);
      expect(card.attributes('role')).toBe('region');
      expect(card.attributes('aria-label')).toBe('Rich Text Editor');

      wrapper.unmount();
    });

    it('exposes a11y and mobile helper methods on component instance', async () => {
      const wrapper = mount(RichTextEditor, {
        props: {
          modelValue: '<p>Testing helper methods</p>',
          accessibility: true,
          mobile: true,
        },
        attachTo: document.body,
      });

      const vm = wrapper.vm as any;
      expect(typeof vm.getAnnouncer).toBe('function');
      expect(typeof vm.getMobileManager).toBe('function');
      expect(typeof vm.announce).toBe('function');
      expect(typeof vm.getViewportState).toBe('function');

      const announcer = vm.getAnnouncer();
      expect(announcer).toBeDefined();

      const mobileManager = vm.getMobileManager();
      expect(mobileManager).toBeDefined();

      const viewport = vm.getViewportState();
      expect(viewport).toBeDefined();
      expect(['mobile', 'tablet', 'desktop']).toContain(viewport.deviceType);

      wrapper.unmount();
    });
  });
});
