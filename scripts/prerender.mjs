import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ROOT_SLOT,
  applyHeadTokens,
  assertTokensPresent,
} from './prerenderTokens.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');
const distServerDir = resolve(__dirname, '../dist-server');
const serverEntry = resolve(distServerDir, 'entry-server.js');

function routeToOutputPath(route) {
  if (route === '/') return resolve(distDir, 'index.html');
  const segments = route.replace(/^\//, '').replace(/\/$/, '');
  return resolve(distDir, segments, 'index.html');
}

async function main() {
  const template = await readFile(resolve(distDir, 'index.html'), 'utf-8');
  assertTokensPresent(template);
  if (!template.includes(ROOT_SLOT)) {
    throw new Error(
      `prerender: ${ROOT_SLOT} slot not found in dist/index.html — Vite output may have changed`,
    );
  }

  const { renderRoute, PRERENDER_ROUTES, PAGE_META, ROUTE_BY_PATH, SITE_BASE_URL } =
    await import(pathToFileURL(serverEntry).href);

  for (const route of PRERENDER_ROUTES) {
    const { html, head } = await renderRoute(route);
    let out = template.replace(ROOT_SLOT, `<div id="root">${html}</div>`);
    out = applyHeadTokens(out, head);

    const outPath = routeToOutputPath(route);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, out, 'utf-8');
    console.log(`✓ prerendered ${route} → ${outPath.replace(distDir, 'dist')}`);
  }

  const lastmod = new Date().toISOString().split('T')[0];
  const urls = PRERENDER_ROUTES.map((route) => {
    const routeKey = ROUTE_BY_PATH[route];
    const meta = PAGE_META[routeKey];
    const loc = `${SITE_BASE_URL}${route === '/' ? '/' : route}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urls}
</urlset>`;
  await writeFile(resolve(distDir, 'sitemap.xml'), sitemap, 'utf-8');
  console.log(`✓ sitemap.xml generated for ${PRERENDER_ROUTES.length} routes`);

  await rm(distServerDir, { recursive: true, force: true });
}

await main();
// QueryClient(gcTime: 5분) 같은 런타임 핸들이 이벤트 루프를 잡고 있어
// prerender 프로세스가 gcTime이 만료되는 5분 뒤에야 종료된다. 모든 I/O가
// 완료된 이 시점에서 명시적으로 종료해 후속 inject 스크립트가 즉시 시작되게 한다.
process.exit(0);
