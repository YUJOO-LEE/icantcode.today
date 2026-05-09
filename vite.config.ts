import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// Relative path required: vite.config.ts loads via esbuild→Node before the `@/` alias is registered.
import { PAGE_META, resolveHead, serializeRouteJsonLd } from './src/constants/pageMeta';
import { applyHeadTokens } from './scripts/prerenderTokens.mjs';

// Fills index.html prerender markers with home/prerenderLang defaults from pageMeta.ts in dev and build.
// scripts/prerender.mjs overrides per route for non-home pages.
function pageMetaInjector(): Plugin {
  return {
    name: 'page-meta-injector',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const resolved = resolveHead('home', PAGE_META.home.prerenderLang);
        return applyHeadTokens(html, {
          ...resolved,
          routeJsonLd: serializeRouteJsonLd(resolved.routeJsonLd),
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pageMetaInjector()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
