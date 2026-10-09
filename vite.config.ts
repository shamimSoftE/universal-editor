import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    fs: {
      strict: false,
      allow: ['..', 'E:/laragon/www/WebApp'],
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: '@universal-editor/core/styles.css',
        replacement: path.resolve(__dirname, './packages/core/src/ui/styles.css'),
      },
      {
        find: '@universal-editor/core',
        replacement: path.resolve(__dirname, './packages/core/src/index.ts'),
      },
      {
        find: '@universal-editor/utils',
        replacement: path.resolve(__dirname, './packages/utils/src/index.ts'),
      },
      {
        find: '@universal-editor/extensions',
        replacement: path.resolve(__dirname, './packages/extensions/src/index.ts'),
      },
      {
        find: '@universal-editor/vue3',
        replacement: path.resolve(__dirname, './packages/vue3/src/index.ts'),
      },
      {
        find: '@universal-editor/vue2',
        replacement: path.resolve(__dirname, './packages/vue2/src/index.ts'),
      },
    ],
  },
});
