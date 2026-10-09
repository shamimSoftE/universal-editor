// vite.config.ts
import { defineConfig } from "file:///E:/laragon/www/WebApp/M.W-AI/textEditor/node_modules/vite/dist/node/index.js";
import vue from "file:///E:/laragon/www/WebApp/M.W-AI/textEditor/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "E:\\laragon\\www\\WebApp\\M.W-AI\\textEditor\\demo";
var vite_config_default = defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    fs: {
      strict: false,
      allow: ["..", "E:/laragon/www/WebApp"]
    }
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: "@universal-editor/core/styles.css",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/core/src/ui/styles.css")
      },
      {
        find: "@universal-editor/core",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/core/src/index.ts")
      },
      {
        find: "@universal-editor/utils",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/utils/src/index.ts")
      },
      {
        find: "@universal-editor/extensions",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/extensions/src/index.ts")
      },
      {
        find: "@universal-editor/vue3",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/vue3/src/index.ts")
      },
      {
        find: "@universal-editor/vue2",
        replacement: path.resolve(__vite_injected_original_dirname, "../packages/vue2/src/index.ts")
      }
    ]
  },
  optimizeDeps: {
    exclude: [
      "@universal-editor/core",
      "@universal-editor/utils",
      "@universal-editor/extensions",
      "@universal-editor/vue3",
      "@universal-editor/vue2"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxXZWJBcHBcXFxcTS5XLUFJXFxcXHRleHRFZGl0b3JcXFxcZGVtb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcbGFyYWdvblxcXFx3d3dcXFxcV2ViQXBwXFxcXE0uVy1BSVxcXFx0ZXh0RWRpdG9yXFxcXGRlbW9cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2xhcmFnb24vd3d3L1dlYkFwcC9NLlctQUkvdGV4dEVkaXRvci9kZW1vL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiBmYWxzZSxcbiAgICAgIGFsbG93OiBbJy4uJywgJ0U6L2xhcmFnb24vd3d3L1dlYkFwcCddLFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzOiB0cnVlLFxuICAgIGFsaWFzOiBbXG4gICAgICB7XG4gICAgICAgIGZpbmQ6ICdAdW5pdmVyc2FsLWVkaXRvci9jb3JlL3N0eWxlcy5jc3MnLFxuICAgICAgICByZXBsYWNlbWVudDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL2NvcmUvc3JjL3VpL3N0eWxlcy5jc3MnKSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGZpbmQ6ICdAdW5pdmVyc2FsLWVkaXRvci9jb3JlJyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9wYWNrYWdlcy9jb3JlL3NyYy9pbmRleC50cycpLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmluZDogJ0B1bml2ZXJzYWwtZWRpdG9yL3V0aWxzJyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9wYWNrYWdlcy91dGlscy9zcmMvaW5kZXgudHMnKSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGZpbmQ6ICdAdW5pdmVyc2FsLWVkaXRvci9leHRlbnNpb25zJyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9wYWNrYWdlcy9leHRlbnNpb25zL3NyYy9pbmRleC50cycpLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmluZDogJ0B1bml2ZXJzYWwtZWRpdG9yL3Z1ZTMnLFxuICAgICAgICByZXBsYWNlbWVudDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL3Z1ZTMvc3JjL2luZGV4LnRzJyksXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBmaW5kOiAnQHVuaXZlcnNhbC1lZGl0b3IvdnVlMicsXG4gICAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vcGFja2FnZXMvdnVlMi9zcmMvaW5kZXgudHMnKSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogW1xuICAgICAgJ0B1bml2ZXJzYWwtZWRpdG9yL2NvcmUnLFxuICAgICAgJ0B1bml2ZXJzYWwtZWRpdG9yL3V0aWxzJyxcbiAgICAgICdAdW5pdmVyc2FsLWVkaXRvci9leHRlbnNpb25zJyxcbiAgICAgICdAdW5pdmVyc2FsLWVkaXRvci92dWUzJyxcbiAgICAgICdAdW5pdmVyc2FsLWVkaXRvci92dWUyJyxcbiAgICBdLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9VLFNBQVMsb0JBQW9CO0FBQ2pXLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLElBQUksQ0FBQztBQUFBLEVBQ2YsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsT0FBTyxDQUFDLE1BQU0sdUJBQXVCO0FBQUEsSUFDdkM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxrQkFBa0I7QUFBQSxJQUNsQixPQUFPO0FBQUEsTUFDTDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLFFBQVEsa0NBQVcsb0NBQW9DO0FBQUEsTUFDM0U7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxrQ0FBVywrQkFBK0I7QUFBQSxNQUN0RTtBQUFBLE1BQ0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGFBQWEsS0FBSyxRQUFRLGtDQUFXLGdDQUFnQztBQUFBLE1BQ3ZFO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLFFBQVEsa0NBQVcscUNBQXFDO0FBQUEsTUFDNUU7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxrQ0FBVywrQkFBK0I7QUFBQSxNQUN0RTtBQUFBLE1BQ0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGFBQWEsS0FBSyxRQUFRLGtDQUFXLCtCQUErQjtBQUFBLE1BQ3RFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
