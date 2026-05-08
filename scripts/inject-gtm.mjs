import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findIndexHtmls } from './lib/walkDist.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const HEAD_SLOT = /[ \t]*<!--\s*__GTM_HEAD_SLOT__\s*-->\s*\n?/;
const BODY_SLOT = /[ \t]*<!--\s*__GTM_BODY_SLOT__\s*-->\s*\n?/;

const id = process.env.VITE_GTM_ID?.trim();

if (!existsSync(distDir)) {
  console.warn('⚠ dist/ not found — skipping GTM injection.');
  process.exit(0);
}

let headReplacement = '';
let bodyReplacement = '';

if (id) {
  headReplacement =
    `    <!-- Google Tag Manager -->\n` +
    `    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n` +
    `    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n` +
    `    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n` +
    `    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n` +
    `    })(window,document,'script','dataLayer','${id}');</script>\n` +
    `    <!-- End Google Tag Manager -->\n`;
  bodyReplacement =
    `    <!-- Google Tag Manager (noscript) -->\n` +
    `    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}"\n` +
    `    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n` +
    `    <!-- End Google Tag Manager (noscript) -->\n`;
}

const files = await findIndexHtmls(distDir);
let touched = 0;
for (const file of files) {
  const html = await readFile(file, 'utf-8');
  if (!HEAD_SLOT.test(html) && !BODY_SLOT.test(html)) continue;
  await writeFile(
    file,
    html.replace(HEAD_SLOT, headReplacement).replace(BODY_SLOT, bodyReplacement),
    'utf-8',
  );
  touched++;
}

if (id) {
  console.log(`✓ GTM (${id}) injected (${touched} file(s)).`);
} else {
  console.log(`✓ No VITE_GTM_ID set — GTM slots removed (${touched} file(s)).`);
}
