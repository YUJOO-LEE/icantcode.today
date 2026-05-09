import { copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');
const src = resolve(distDir, 'index.html');
const dest = resolve(distDir, '404.html');

if (!existsSync(src)) {
  console.warn('⚠ dist/index.html not found — skipping 404.html copy.');
  process.exit(0);
}

await copyFile(src, dest);
console.log('✓ 404.html copied from index.html (GitHub Pages SPA fallback)');
