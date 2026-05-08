// Minimal static server that mimics GitHub Pages serving semantics:
//   - Directory-index matching (`/game` → `/game/index.html`)
//   - 404.html fallback for unknown URLs
//
// Used by Playwright as the e2e web server, since `vite preview` does not
// match directory indexes for our prerendered route HTMLs.
//
// Dev/test only — DO NOT deploy as a public-facing server.
//
// Zero external dependencies — Node-only.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function contentTypeFor(filePath) {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function tryServe(res, filePath, status = 200) {
  const data = await readFile(filePath);
  res.writeHead(status, { 'Content-Type': contentTypeFor(filePath) });
  res.end(data);
}

const DIST_PREFIX = DIST_DIR + sep;

function resolveSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  // join() normalizes `..` segments; the resolve() guarantees an absolute
  // path that we can compare prefix-wise against DIST_DIR.
  const candidate = resolve(join(DIST_DIR, decoded));
  if (candidate !== DIST_DIR && !candidate.startsWith(DIST_PREFIX)) return null;
  return candidate;
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const candidate = resolveSafePath(urlPath);

  if (candidate) {
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) {
        await tryServe(res, join(candidate, 'index.html'));
        return;
      }
      await tryServe(res, candidate);
      return;
    } catch {
      // fall through
    }
  }

  try {
    await tryServe(res, join(DIST_DIR, '404.html'), 404);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Static server (GitHub Pages mimic) listening on http://localhost:${PORT}`);
});
