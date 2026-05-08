import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');
const distServerDir = resolve(__dirname, '../dist-server');
const serverEntry = resolve(distServerDir, 'entry-server.js');
const SITE_BASE_URL = 'https://icantcode.today';

function routeToOutputPath(route) {
  if (route === '/') return resolve(distDir, 'index.html');
  const segments = route.replace(/^\//, '').replace(/\/$/, '');
  return resolve(distDir, segments, 'index.html');
}

async function main() {
  const template = await readFile(resolve(distDir, 'index.html'), 'utf-8');
  const { renderRoute, PRERENDER_ROUTES } = await import(pathToFileURL(serverEntry).href);

  const ROOT_SLOT = '<div id="root"></div>';
  if (!template.includes(ROOT_SLOT)) {
    throw new Error(
      `prerender: ${ROOT_SLOT} slot not found in dist/index.html — Vite output may have changed`,
    );
  }

  for (const route of PRERENDER_ROUTES) {
    const { html } = await renderRoute(route);
    const out = template.replace(ROOT_SLOT, `<div id="root">${html}</div>`);
    const outPath = routeToOutputPath(route);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, out, 'utf-8');
    console.log(`✓ prerendered ${route} → ${outPath.replace(distDir, 'dist')}`);
  }

  const lastmod = new Date().toISOString().split('T')[0];
  const urls = PRERENDER_ROUTES.map((route) => {
    const loc = `${SITE_BASE_URL}${route === '/' ? '/' : route}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
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
