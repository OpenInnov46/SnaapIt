// vite.config.ts
import { defineConfig } from "file:///Users/morenoflavio/Documents/Perso/Snaapit/Extension/node_modules/.pnpm/vite@5.4.20/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/morenoflavio/Documents/Perso/Snaapit/Extension/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.2_svelte@5.39.11_vite@5.4.20/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/morenoflavio/Documents/Perso/Snaapit/Extension";
var vite_config_default = defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__vite_injected_original_dirname, "index.html"),
        background: resolve(__vite_injected_original_dirname, "src/background/background.ts")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "background" ? "[name].js" : "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        format: "es"
        // Important pour Chrome Extension
      }
    },
    // Empêcher Vite de minifier le background script
    minify: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbW9yZW5vZmxhdmlvL0RvY3VtZW50cy9QZXJzby9TbmFhcGl0L0V4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL21vcmVub2ZsYXZpby9Eb2N1bWVudHMvUGVyc28vU25hYXBpdC9FeHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21vcmVub2ZsYXZpby9Eb2N1bWVudHMvUGVyc28vU25hYXBpdC9FeHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSAnQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZSdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbc3ZlbHRlKCldLFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIGluZGV4OiByZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcbiAgICAgICAgYmFja2dyb3VuZDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLnRzJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNodW5rSW5mby5uYW1lID09PSAnYmFja2dyb3VuZCdcbiAgICAgICAgICAgID8gJ1tuYW1lXS5qcydcbiAgICAgICAgICAgIDogJ2Fzc2V0cy9bbmFtZV0uanMnO1xuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2V4dF0nLFxuICAgICAgICBmb3JtYXQ6ICdlcycgIC8vIEltcG9ydGFudCBwb3VyIENocm9tZSBFeHRlbnNpb25cbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIEVtcFx1MDBFQWNoZXIgVml0ZSBkZSBtaW5pZmllciBsZSBiYWNrZ3JvdW5kIHNjcmlwdFxuICAgIG1pbmlmeTogZmFsc2VcbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQWlWLFNBQVMsb0JBQW9CO0FBQzlXLFNBQVMsY0FBYztBQUN2QixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUFBLEVBQ2xCLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE9BQU8sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsUUFDdEMsWUFBWSxRQUFRLGtDQUFXLDhCQUE4QjtBQUFBLE1BQy9EO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGlCQUFPLFVBQVUsU0FBUyxlQUN0QixjQUNBO0FBQUEsUUFDTjtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsUUFBUTtBQUFBO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
