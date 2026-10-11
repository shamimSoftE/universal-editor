import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'UniversalEditorExtensions',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@tiptap/core', '@universal-editor/core', '@shamimsofte/universal-editor-core'],
      output: {
        exports: 'named',
        globals: {
          '@tiptap/core': 'TiptapCore',
          '@universal-editor/core': 'UniversalEditor',
          '@shamimsofte/universal-editor-core': 'UniversalEditor',
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: '@shamimsofte/universal-editor-core',
        replacement: path.resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: '@universal-editor/core',
        replacement: path.resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: '@shamimsofte/universal-editor-utils',
        replacement: path.resolve(__dirname, '../utils/src/index.ts'),
      },
      {
        find: '@universal-editor/utils',
        replacement: path.resolve(__dirname, '../utils/src/index.ts'),
      },
    ],
  },
});
