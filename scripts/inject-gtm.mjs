import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndex = resolve(__dirname, '../dist/index.html');

const HEAD_SLOT = /[ \t]*<!--\s*__GTM_HEAD_SLOT__\s*-->\s*\n?/;
const BODY_SLOT = /[ \t]*<!--\s*__GTM_BODY_SLOT__\s*-->\s*\n?/;

const id = process.env.VITE_GTM_ID?.trim();

if (!existsSync(distIndex)) {
  console.warn('⚠ dist/index.html not found — skipping GTM injection.');
  process.exit(0);
}

const html = readFileSync(distIndex, 'utf-8');

if (!HEAD_SLOT.test(html) || !BODY_SLOT.test(html)) {
  console.warn('⚠ GTM slots not found in dist/index.html — skipping.');
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
  console.log(`✓ GTM (${id}) injected.`);
} else {
  console.log('✓ No VITE_GTM_ID set — GTM slots removed (no analytics).');
}

writeFileSync(
  distIndex,
  html.replace(HEAD_SLOT, headReplacement).replace(BODY_SLOT, bodyReplacement),
  'utf-8',
);
