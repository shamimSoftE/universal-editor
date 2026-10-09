/**
 * Mobile Optimization & Touch Types (Phase 23)
 */

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export type ToolbarMode = 'fixed' | 'sticky' | 'bottom-sheet' | 'scrollable';

export interface MobileBreakpoints {
  /** Maximum width in px for mobile viewport (default: 768) */
  mobile?: number;
  /** Maximum width in px for tablet viewport (default: 1024) */
  tablet?: number;
}

export interface MobileConfig {
  /** Enable mobile & touch optimizations */
  enabled?: boolean;
  /** Responsive screen width breakpoints */
  breakpoints?: MobileBreakpoints;
  /** Toolbar display mode on mobile devices */
  toolbarMode?: ToolbarMode;
  /** Automatically dock toolbar as bottom-sheet on mobile devices */
  bottomSheetOnMobile?: boolean;
  /** Minimum touch target size in pixels (WCAG 2.5.5 / 2.5.8 requires >= 44px) */
  touchTargetMinSize?: number;
  /** Eliminate 300ms tap delay via touch-action: manipulation */
  eliminateTapDelay?: boolean;
  /** Adapt editor layout to virtual keyboard using visualViewport API */
  viewportAdaptation?: boolean;
}

export interface ViewportState {
  deviceType: DeviceType;
  width: number;
  height: number;
  isTouch: boolean;
  isVirtualKeyboardOpen: boolean;
  viewportHeightOffset: number;
}
