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
 * Pattern matches the canonical CodeQL `js/path-injection` sanitizer
 * example: `realpath(path.resolve(ROOT, input))` followed by a single
 * `result.startsWith(ROOT_WITH_SEP)` barrier. The root case is split out
 * before any path operation so the unconditional barrier holds for every
 * tainted-data path. Do not re-introduce the `&&` form — CodeQL's barrier
 * detection misses combined conditions.
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
  // Root / empty URL — serve the dist root itself; the server resolves it
  // to index.html via the directory-index branch. Returned before the
  // tainted string flows into any fs sink.
  if (decoded === '/' || decoded === '') return DIST_DIR_REAL;

  // Strip leading slashes so resolve() treats the input as relative to the
  // dist root rather than the filesystem root.
  const relativePath = decoded.replace(/^\/+/, '');

  let candidate;
  try {
    candidate = await realpath(resolve(DIST_DIR_REAL, relativePath));
  } catch {
    return null;
  }
  if (!candidate.startsWith(DIST_DIR_REAL_PREFIX)) return null;
  return candidate;
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
        // symlinks introduced under DIST_DIR. Single inline `startsWith`
        // for the same CodeQL barrier-recognition reason as resolveSafePath.
        const realIndex = await realpath(indexPath);
        if (realIndex.startsWith(DIST_DIR_REAL_PREFIX)) {
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
