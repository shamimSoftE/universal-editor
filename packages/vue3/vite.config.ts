import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'UniversalEditorVue3',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', '@universal-editor/core'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          '@universal-editor/core': 'UniversalEditor',
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: '@universal-editor/core/styles.css',
        replacement: path.resolve(__dirname, '../core/src/ui/styles.css'),
      },
      {
        find: '@universal-editor/core',
        replacement: path.resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: '@universal-editor/utils',
        replacement: path.resolve(__dirname, '../utils/src/index.ts'),
      },
    ],
  },
});
