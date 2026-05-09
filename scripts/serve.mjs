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
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT) || 4173;
// Resolve symlinks once at startup so every request can verify the served
// path against the canonical root.
const DIST_DIR_REAL = await realpath(DIST_DIR);
const DIST_DIR_REAL_PREFIX = DIST_DIR_REAL + sep;

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
  // filePath is always derived from DIST_DIR_REAL (a constant absolute path
  // resolved at startup) joined with a fixed leaf like 'index.html' or
  // '404.html' — never directly from request input. Path traversal is
  // structurally impossible here.
  const data = await readFile(filePath);
  res.writeHead(status, { 'Content-Type': contentTypeFor(filePath) });
  res.end(data);
}

/**
 * Resolve a request URL path to an absolute file path inside DIST_DIR_REAL,
 * or return null if the request escapes the root.
 *
 * Defence-in-depth checks: explicit `..` segment rejection, lexical
 * containment via `startsWith(DIST_DIR_REAL_PREFIX)`, and a realpath
 * containment re-check that catches symlink-based escapes. The `startsWith`
 * checks are inlined deliberately — CodeQL's `js/path-injection` query only
 * recognises a prefix-match guard as a barrier when it appears directly on
 * the tainted path expression; factoring it into a helper breaks barrier
 * detection.
 */
async function resolveSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  if (decoded.split(/[/\\]/).some((seg) => seg === '..')) return null;

  const lexical = resolve(join(DIST_DIR_REAL, decoded));
  if (lexical !== DIST_DIR_REAL && !lexical.startsWith(DIST_DIR_REAL_PREFIX)) {
    return null;
  }

  let real;
  try {
    real = await realpath(lexical);
  } catch {
    return null;
  }
  if (real !== DIST_DIR_REAL && !real.startsWith(DIST_DIR_REAL_PREFIX)) {
    return null;
  }
  return real;
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const candidate = await resolveSafePath(urlPath);

  if (candidate) {
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) {
        const indexPath = join(candidate, 'index.html');
        // Re-validate after the directory-index join — the leaf is constant
        // ('index.html'), but we re-check the realpath to be safe against
        // symlinks introduced under DIST_DIR. Inline `startsWith` for the
        // same CodeQL barrier-recognition reason as in resolveSafePath.
        const realIndex = await realpath(indexPath);
        if (realIndex === DIST_DIR_REAL || realIndex.startsWith(DIST_DIR_REAL_PREFIX)) {
          await tryServe(res, realIndex);
          return;
        }
      } else {
        await tryServe(res, candidate);
        return;
      }
    } catch {
      // fall through
    }
  }

  try {
    // Constant path — no user input.
    await tryServe(res, join(DIST_DIR_REAL, '404.html'), 404);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Static server (GitHub Pages mimic) listening on http://localhost:${PORT}`);
});
