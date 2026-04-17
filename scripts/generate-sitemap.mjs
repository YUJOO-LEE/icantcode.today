import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const BASE_URL = 'https://icantcode.today';
const NOW = new Date().toISOString().split('T')[0];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${NOW}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="${BASE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/"/>
  </url>
</urlset>`;

writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`✓ sitemap.xml generated (lastmod: ${NOW})`);
