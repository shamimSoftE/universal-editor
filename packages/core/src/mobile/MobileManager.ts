import { MobileConfig, DeviceType, ViewportState } from './types';

/**
 * MobileManager (Phase 23)
 *
 * Coordinates mobile viewport detection, touch interactions (WCAG 2.5.5 target sizing,
 * 300ms tap delay elimination), virtual keyboard visual viewport adaptation, and
 * mobile bottom-sheet toolbar docking.
 */
export class MobileManager {
  private element: HTMLElement;
  private config: Required<MobileConfig>;
  private listeners: Set<(state: ViewportState) => void> = new Set();
  private currentState: ViewportState;
  private resizeHandler: (() => void) | null = null;
  private visualViewportHandler: (() => void) | null = null;
  private isBottomSheetOpen: boolean = false;

  constructor(element: HTMLElement, config: MobileConfig = {}) {
    this.element = element;
    this.config = {
      enabled: config.enabled ?? true,
      breakpoints: {
        mobile: config.breakpoints?.mobile ?? 768,
        tablet: config.breakpoints?.tablet ?? 1024,
      },
      toolbarMode: config.toolbarMode ?? 'scrollable',
      bottomSheetOnMobile: config.bottomSheetOnMobile ?? false,
      touchTargetMinSize: config.touchTargetMinSize ?? 44,
      eliminateTapDelay: config.eliminateTapDelay ?? true,
      viewportAdaptation: config.viewportAdaptation ?? true,
    };

    this.currentState = this.calculateViewportState();

    if (this.config.enabled && typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    this.applyClasses();

    if (this.config.eliminateTapDelay) {
      this.element.style.touchAction = 'manipulation';
    }

    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    if (this.config.viewportAdaptation && window.visualViewport) {
      this.visualViewportHandler = () => this.handleVisualViewportChange();
      window.visualViewport.addEventListener(
        'resize',
        this.visualViewportHandler,
        { passive: true }
      );
      window.visualViewport.addEventListener(
        'scroll',
        this.visualViewportHandler,
        { passive: true }
      );
    }
  }

  /**
   * Determine device type from viewport width.
   */
  public getDeviceType(width: number): DeviceType {
    const mobileLimit = this.config.breakpoints.mobile ?? 768;
    const tabletLimit = this.config.breakpoints.tablet ?? 1024;

    if (width < mobileLimit) {
      return 'mobile';
    } else if (width < tabletLimit) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Calculate current viewport and touch state.
   */
  public calculateViewportState(): ViewportState {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        width: 1200,
        height: 800,
        isTouch: false,
        isVirtualKeyboardOpen: false,
        viewportHeightOffset: 0,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch =
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

    let isVirtualKeyboardOpen = false;
    let viewportHeightOffset = 0;

    if (window.visualViewport) {
      const vvHeight = window.visualViewport.height;
      if (height - vvHeight > 150) {
        isVirtualKeyboardOpen = true;
        viewportHeightOffset = height - vvHeight;
      }
    }

    return {
      deviceType: this.getDeviceType(width),
      width,
      height,
      isTouch,
      isVirtualKeyboardOpen,
      viewportHeightOffset,
    };
  }

  private applyClasses(): void {
    if (typeof document === 'undefined') return;

    this.element.classList.remove(
      'ue-mobile-view',
      'ue-tablet-view',
      'ue-desktop-view',
      'ue-touch-device',
      'ue-vk-open',
      'ue-bottom-sheet'
    );

    switch (this.currentState.deviceType) {
      case 'mobile':
        this.element.classList.add('ue-mobile-view');
        break;
      case 'tablet':
        this.element.classList.add('ue-tablet-view');
        break;
      case 'desktop':
        this.element.classList.add('ue-desktop-view');
        break;
    }

    if (this.currentState.isTouch) {
      this.element.classList.add('ue-touch-device');
    }

    if (this.currentState.isVirtualKeyboardOpen) {
      this.element.classList.add('ue-vk-open');
    }

    if (
      this.config.bottomSheetOnMobile &&
      this.currentState.deviceType === 'mobile'
    ) {
      this.element.classList.add('ue-bottom-sheet');
    }
  }

  private handleResize(): void {
    const newState = this.calculateViewportState();
    const hasChanged =
      newState.deviceType !== this.currentState.deviceType ||
      newState.width !== this.currentState.width ||
      newState.height !== this.currentState.height ||
      newState.isTouch !== this.currentState.isTouch;

    this.currentState = newState;
    this.applyClasses();

    if (hasChanged) {
      this.notifyListeners();
    }
  }

  private handleVisualViewportChange(): void {
    const newState = this.calculateViewportState();
    const vkChanged =
      newState.isVirtualKeyboardOpen !==
        this.currentState.isVirtualKeyboardOpen ||
      newState.viewportHeightOffset !==
        this.currentState.viewportHeightOffset;

    this.currentState = newState;
    this.applyClasses();

    if (vkChanged) {
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to viewport state changes.
   */
  public onViewportChange(listener: (state: ViewportState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (err) {
        console.error('MobileManager listener error:', err);
      }
    }
  }

  public getState(): ViewportState {
    return { ...this.currentState };
  }

  /**
   * Set simulated viewport width (for testing or preview container).
   */
  public setSimulatedWidth(width: number): void {
    this.currentState.width = width;
    this.currentState.deviceType = this.getDeviceType(width);
    this.applyClasses();
    this.notifyListeners();
  }

  public openBottomSheet(): void {
    this.isBottomSheetOpen = true;
    this.element.classList.add('ue-bottom-sheet-open');
  }

  public closeBottomSheet(): void {
    this.isBottomSheetOpen = false;
    this.element.classList.remove('ue-bottom-sheet-open');
  }

  public toggleBottomSheet(): boolean {
    if (this.isBottomSheetOpen) {
      this.closeBottomSheet();
    } else {
      this.openBottomSheet();
    }
    return this.isBottomSheetOpen;
  }

  public destroy(): void {
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (
      this.visualViewportHandler &&
      typeof window !== 'undefined' &&
      window.visualViewport
    ) {
      window.visualViewport.removeEventListener(
        'resize',
        this.visualViewportHandler
      );
      window.visualViewport.removeEventListener(
        'scroll',
        this.visualViewportHandler
      );
      this.visualViewportHandler = null;
    }
    this.listeners.clear();
  }
}
