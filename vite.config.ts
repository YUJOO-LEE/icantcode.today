import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// Relative paths required: this file runs via esbuild→Node before Vite's `@/` alias is registered.
import { PAGE_META, resolveHead, serializeRouteJsonLd } from './src/constants/pageMeta';
import { applyHeadTokens } from './scripts/prerenderTokens.mjs';

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

export default defineConfig(({ isSsrBuild }) => ({
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
  // SSR 빌드는 단일 번들이라 manualChunks 비적용. 클라이언트 빌드에서만
  // vendor를 라이브러리 family 단위로 쪼개서 첫 chunk가 500 kB를 넘지 않게,
  // 그리고 자주 안 바뀌는 vendor가 별도 hash를 갖도록 한다 (캐시 적중률 ↑).
  build: isSsrBuild
    ? undefined
    : {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler|use-sync-external-store)[\\/]/.test(id)) {
                return 'vendor-react';
              }
              if (/[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/.test(id)) {
                return 'vendor-i18n';
              }
              if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) {
                return 'vendor-query';
              }
              if (/[\\/]node_modules[\\/]zustand[\\/]/.test(id)) {
                return 'vendor-zustand';
              }
              // motion(/react) is bundled into vendor-react by rollup because
              // its hooks share a strong dependency graph with react internals;
              // splitting it explicitly produces an empty chunk. Let it fall
              // into the generic `vendor` bucket instead.
              return 'vendor';
            },
          },
        },
      },
}));
