import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'UniversalEditor',
      fileName: (format) => `universal-editor.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'styles.css';
          return assetInfo.name || '[name].[ext]';
        },
        globals: {},
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@universal-editor/utils': path.resolve(__dirname, '../utils/src/index.ts'),
      '@shamimsofte/universal-editor-utils': path.resolve(__dirname, '../utils/src/index.ts'),
    },
  },
});
