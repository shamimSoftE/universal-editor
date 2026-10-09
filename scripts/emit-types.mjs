import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

const typeDefinitions = {
  core: `export * from '../src/index';\n`,
  vue3: `import type { App, Plugin, DefineComponent } from 'vue';

export declare const RichTextEditor: DefineComponent<any, any, any>;
export declare const RichTextViewer: DefineComponent<any, any, any>;
export declare const VersionHistoryModal: DefineComponent<any, any, any>;
export declare const CollaborationBar: DefineComponent<any, any, any>;
export declare const CommentSidebar: DefineComponent<any, any, any>;
export declare const DocumentLockBanner: DefineComponent<any, any, any>;
export declare const AIAssistantModal: DefineComponent<any, any, any>;
export declare const ThemeSwitcher: DefineComponent<any, any, any>;
export declare const EditorToolbar: DefineComponent<any, any, any>;
export declare const ToolbarButton: DefineComponent<any, any, any>;
export declare const ToolbarDropdown: DefineComponent<any, any, any>;
export declare const LinkDialog: DefineComponent<any, any, any>;
export declare const ImageDialog: DefineComponent<any, any, any>;
export declare const FileDialog: DefineComponent<any, any, any>;
export declare const TableDialog: DefineComponent<any, any, any>;
export declare const EmbedDialog: DefineComponent<any, any, any>;
export declare const BubbleMenu: DefineComponent<any, any, any>;
export declare const EditorFooter: DefineComponent<any, any, any>;

declare const UniversalEditorPlugin: Plugin;
export default UniversalEditorPlugin;
`,
  vue2: `export * from '../src/types';
export * from '../src/RichTextEditor';
export * from '../src/RichTextViewer';

export declare const RichTextEditor: any;
export declare const richTextEditor: any;
export declare const RichTextViewer: any;
export declare const richTextViewer: any;
export declare const VUE2_ADAPTER_VERSION: string;

export declare const UniversalEditorVue2Plugin: {
  install(Vue: any, options?: Record<string, any>): void;
};

export default UniversalEditorVue2Plugin;
`,
  extensions: `export * from '../src/index';\n`,
  utils: `export * from '../src/index';\nexport * from '../src/diff';\n`,
};

for (const [pkg, defContent] of Object.entries(typeDefinitions)) {
  const distDir = path.join(packagesDir, pkg, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const dtsPath = path.join(distDir, 'index.d.ts');
  fs.writeFileSync(dtsPath, defContent, 'utf-8');
  console.log(`Generated types for @universal-editor/${pkg} -> ${dtsPath}`);
}
