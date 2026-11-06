// Runs automatically after `npm run build` (the "postbuild" script).
//
// Next's standalone output contains the server but deliberately leaves out
// public/ and .next/static/, expecting a CDN to serve them. On Hostinger the
// standalone server.js serves everything itself, so both are copied in next
// to it. Without this, pages render with no CSS, JS, icons or sw.js.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  // Not a standalone build (or tracing put server.js elsewhere): do nothing
  // rather than fail a build that `next start` could still serve.
  console.warn('[postbuild] .next/standalone/server.js not found; skipping asset copy.');
  process.exit(0);
}

const copies = [
  [path.join(root, 'public'), path.join(standalone, 'public')],
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, to, { recursive: true, force: true });
  console.log(`[postbuild] copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}
