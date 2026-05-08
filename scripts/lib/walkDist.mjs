import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Recursively collect every `index.html` under `dir` (including the root one).
// Used by post-build inject scripts to walk all prerendered route HTMLs.
export async function findIndexHtmls(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await findIndexHtmls(full)));
    else if (entry.name === 'index.html') found.push(full);
  }
  return found;
}
