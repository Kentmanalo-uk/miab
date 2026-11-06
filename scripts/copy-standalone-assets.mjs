// Runs automatically after `npm run build` (the "postbuild" script).
//
// Prepares .next/standalone for Hostinger, which reports "Detected Next.js
// standalone server output" and runs .next/standalone/server.js:
//
// 1. Copies public/ and .next/static/ next to server.js. Standalone output
//    leaves them out, expecting a CDN to serve them.
//
// 2. Replaces Next's generated server.js with one that listens the way an
//    Express app does: `server.listen(process.env.PORT)`, value passed through
//    untouched, no hostname. Next's own file does `parseInt(PORT) || 3000` and
//    binds to `process.env.HOSTNAME || '0.0.0.0'`. Under a process manager that
//    hands the app a socket path in PORT, or sets HOSTNAME to the machine name,
//    that listens somewhere the web server isn't looking: every request hangs
//    until the CDN times out, which is exactly what the live site did while
//    the Express app on the same account worked. The original is kept as
//    server.next.js.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const serverFile = path.join(standalone, 'server.js');
const originalFile = path.join(standalone, 'server.next.js');

if (!fs.existsSync(serverFile)) {
  // Not a standalone build (or tracing put server.js elsewhere): do nothing
  // rather than fail a build that `next start` could still serve.
  console.warn('[postbuild] .next/standalone/server.js not found; skipping.');
  process.exit(0);
}

// ── 1. assets ────────────────────────────────────────────────────────────────
const copies = [
  [path.join(root, 'public'), path.join(standalone, 'public')],
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
];
for (const [from, to] of copies) {
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, to, { recursive: true, force: true });
  console.log(`[postbuild] copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

// ── 2. server.js ─────────────────────────────────────────────────────────────
const generated = fs.readFileSync(serverFile, 'utf8');
if (generated.includes('@generated-by copy-standalone-assets')) {
  console.log('[postbuild] server.js already replaced; leaving it.');
  process.exit(0);
}

const match = generated.match(/^const nextConfig = (.*)$/m);
if (!match) {
  console.warn('[postbuild] nextConfig not found in server.js; keeping Next\'s server.');
  process.exit(0);
}

fs.writeFileSync(originalFile, generated);

const wrapper = `// @generated-by copy-standalone-assets (see scripts/copy-standalone-assets.mjs)
// Starts Next the way an Express app starts: listen(process.env.PORT) as given.
const http = require('http')

process.on('uncaughtException', (e) => { console.error('[server] uncaughtException', e); process.exit(1) })
process.on('unhandledRejection', (e) => console.error('[server] unhandledRejection', e))

process.env.NODE_ENV = 'production'
process.chdir(__dirname)

const nextConfig = ${match[1]}
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)

const next = require('next')

const rawPort = process.env.PORT
// A plain number is a TCP port; anything else (a socket or pipe path) is passed
// through unchanged, exactly as Express's app.listen(process.env.PORT) would.
const listenOn = rawPort && /^\\d+$/.test(rawPort) ? Number(rawPort) : rawPort || 3000

console.log('[server] starting', JSON.stringify({
  PORT: rawPort ?? null,
  HOSTNAME: process.env.HOSTNAME ?? null,
  node: process.version,
  cwd: process.cwd(),
}))

const app = next({ dev: false, dir: __dirname, conf: nextConfig })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res))
    const keepAlive = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)
    if (Number.isFinite(keepAlive) && keepAlive >= 0) server.keepAliveTimeout = keepAlive
    server.listen(listenOn, () => {
      console.log('[server] ready, listening on', JSON.stringify(server.address()))
    })
    server.on('error', (err) => {
      console.error('[server] listen error', err)
      process.exit(1)
    })
  })
  .catch((err) => {
    console.error('[server] failed to start', err)
    process.exit(1)
  })
`;

fs.writeFileSync(serverFile, wrapper);
console.log('[postbuild] replaced .next/standalone/server.js (original kept as server.next.js)');
