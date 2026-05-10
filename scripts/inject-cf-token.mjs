import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findIndexHtmls } from './lib/walkDist.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const SLOT_PATTERN = /[ \t]*<!--\s*__CF_BEACON_SLOT__\s*-->\s*\n?/;
const token = process.env.VITE_CF_BEACON_TOKEN?.trim();

if (!existsSync(distDir)) {
  console.warn('⚠ dist/ not found — skipping Cloudflare beacon injection.');
  process.exit(0);
}

let replacement = '';
if (token) {
  const payload = JSON.stringify({ token });
  replacement = `    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${payload}'></script>\n`;
}

const files = await findIndexHtmls(distDir);
let touched = 0;
for (const file of files) {
  const html = await readFile(file, 'utf-8');
  if (!SLOT_PATTERN.test(html)) continue;
  await writeFile(file, html.replace(SLOT_PATTERN, () => replacement), 'utf-8');
  touched++;
}

if (token) {
  console.log(`✓ Cloudflare Web Analytics beacon injected (${touched} file(s)).`);
} else {
  console.log(`✓ No VITE_CF_BEACON_TOKEN set — beacon slot removed (${touched} file(s)).`);
}
