import { UniversalEditor } from './UniversalEditor';
import type { EditorOptions } from './types';

/**
 * Factory function to create a new framework-independent Universal Editor instance.
 *
 * Example 1 (Standard Options Object):
 * ```ts
 * const editor = createEditor({
 *   element: '#editor',
 *   content: '<p>Hello World</p>',
 *   editable: true,
 * });
 * ```
 *
 * Example 2 (Element selector / HTMLElement first):
 * ```ts
 * const editor = createEditor('#editor', {
 *   content: '<p>Hello World</p>'
 * });
 * ```
 */
export function createEditor(options?: EditorOptions): UniversalEditor;
export function createEditor(
  element: string | HTMLElement,
  options?: Omit<EditorOptions, 'element'>
): UniversalEditor;
export function createEditor(
  elementOrOptions: string | HTMLElement | EditorOptions = {},
  options: Omit<EditorOptions, 'element'> = {}
): UniversalEditor {
  if (
    typeof elementOrOptions === 'string' ||
    (typeof HTMLElement !== 'undefined' && elementOrOptions instanceof HTMLElement)
  ) {
    return new UniversalEditor({
      element: elementOrOptions,
      ...options,
    });
  }
  return new UniversalEditor(elementOrOptions);
}
