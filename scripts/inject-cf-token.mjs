import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndex = resolve(__dirname, '../dist/index.html');

const SLOT_PATTERN = /[ \t]*<!--\s*__CF_BEACON_SLOT__\s*-->\s*\n?/;
const token = process.env.VITE_CF_BEACON_TOKEN?.trim();

if (!existsSync(distIndex)) {
  console.warn('⚠ dist/index.html not found — skipping Cloudflare beacon injection.');
  process.exit(0);
}

const html = readFileSync(distIndex, 'utf-8');

if (!SLOT_PATTERN.test(html)) {
  console.warn('⚠ CF beacon slot not found in dist/index.html — skipping.');
  process.exit(0);
}

let replacement = '';
if (token) {
  const payload = JSON.stringify({ token });
  replacement = `    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${payload}'></script>\n`;
  console.log('✓ Cloudflare Web Analytics beacon injected.');
} else {
  console.log('✓ No VITE_CF_BEACON_TOKEN set — beacon slot removed (no analytics).');
}

writeFileSync(distIndex, html.replace(SLOT_PATTERN, replacement), 'utf-8');
