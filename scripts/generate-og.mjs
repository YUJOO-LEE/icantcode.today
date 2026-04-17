/**
 * OG 이미지 재생성 스크립트 (일회성)
 *
 * 사용법:
 *   1. 일회성으로 sharp 설치:  npm install --save-dev sharp
 *   2. 실행:                   npm run generate:og
 *   3. 생성된 public/og.png 확인 후 commit
 *   4. sharp 제거:             npm uninstall sharp
 *
 * 이유: Chrome CLI의 `--screenshot`은 viewport region crop을 지원하지 않음.
 *       macOS headless Chrome은 window-size보다 viewport가 ~87px 작아서
 *       window-size=1200x717로 찍고 sharp로 하단 87px를 잘라내 1200x630 획득.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/og.svg');
const pngPath = resolve(__dirname, '../public/og.png');
const cacheDir = resolve(__dirname, '../.cache');
const htmlPath = resolve(cacheDir, 'og.html');
const tmpPngPath = resolve(cacheDir, 'og-raw.png');

const CHROME_PATH =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!existsSync(CHROME_PATH)) {
  console.error(`✗ Chrome not found at ${CHROME_PATH}`);
  process.exit(1);
}

if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

const svg = readFileSync(svgPath, 'utf-8');

const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'MulmaruMono';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-4@1.1/MulmaruMono.woff2') format('woff2');
    font-display: block;
  }
  html, body { margin: 0; padding: 0; background: #121519; overflow: hidden; line-height: 0; }
  svg { display: block; width: 1200px; height: 630px; font-family: 'MulmaruMono', 'Courier New', monospace; }
</style>
</head><body>${svg}</body></html>`;

writeFileSync(htmlPath, html);

execFileSync(
  CHROME_PATH,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=3000',
    '--window-size=1200,717',
    `--screenshot=${tmpPngPath}`,
    `file://${htmlPath}`,
  ],
  { stdio: 'inherit' },
);

await sharp(tmpPngPath).extract({ left: 0, top: 0, width: 1200, height: 630 }).toFile(pngPath);

unlinkSync(htmlPath);
unlinkSync(tmpPngPath);
console.log('✓ og.png generated (1200×630) — cropped from 1200×717 Chrome screenshot');
