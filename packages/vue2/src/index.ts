import { RichTextEditor } from './RichTextEditor';
import { RichTextViewer } from './RichTextViewer';

export * from './types';
export * from './RichTextEditor';
export * from './RichTextViewer';

export {
  RichTextEditor,
  RichTextEditor as richTextEditor,
  RichTextViewer,
  RichTextViewer as richTextViewer,
};

export const VUE2_ADAPTER_VERSION = '1.0.0';

/**
 * Vue 2 Plugin installer for Universal Rich Text Editor
 */
export const UniversalEditorVue2Plugin = {
  install(Vue: any, _options: Record<string, any> = {}) {
    Vue.component('RichTextEditor', RichTextEditor);
    Vue.component('rich-text-editor', RichTextEditor);
    Vue.component('RichTextViewer', RichTextViewer);
    Vue.component('rich-text-viewer', RichTextViewer);
  },
};

export default UniversalEditorVue2Plugin;
