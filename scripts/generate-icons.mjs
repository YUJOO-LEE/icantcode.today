/**
 * PWA / home-screen icon generator (one-off).
 *
 * Renders public/logo.svg onto an opaque themed square at the sizes the
 * manifest and iOS home screen need, using the Chromium that Playwright
 * already installs for e2e — so no extra dependency.
 *
 * Usage:  node scripts/generate-icons.mjs
 * Output: public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 *
 * Re-run only when the logo or brand background changes, then commit the PNGs.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// Dark brand background (matches site.webmanifest background_color); opaque so
// iOS doesn't fill transparent pixels with black and can round the corners.
const BG = '#121519';
// Logo occupies 60% of the square, leaving a maskable safe zone.
const LOGO_RATIO = 0.6;

const targets = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

const rawSvg = readFileSync(resolve(publicDir, 'logo.svg'), 'utf-8');
// Let the SVG fill its container instead of its intrinsic 128px box.
const svg = rawSvg.replace(/<svg([^>]*?)>/, (_m, attrs) => {
  const cleaned = attrs.replace(/\s(width|height)="[^"]*"/g, '');
  return `<svg${cleaned} width="100%" height="100%">`;
});

const browser = await chromium.launch();
try {
  for (const { size, file } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    const logoPx = Math.round(size * LOGO_RATIO);
    await page.setContent(
      `<!doctype html><html><body style="margin:0">
        <div style="width:${size}px;height:${size}px;background:${BG};display:flex;align-items:center;justify-content:center">
          <div style="width:${logoPx}px;height:${logoPx}px">${svg}</div>
        </div>
      </body></html>`,
    );
    await page.screenshot({ path: resolve(publicDir, file), type: 'png', omitBackground: false });
    await page.close();
    console.log(`✓ ${file} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
