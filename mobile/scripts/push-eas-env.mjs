#!/usr/bin/env node
/**
 * Uploads the values in mobile/.env to EAS, for all three build environments.
 *
 * Why this is needed at all: EAS builds from a git archive, so `.env` — which
 * is gitignored, correctly — never reaches the build server. Without this, a
 * cloud build produces an app with no Firebase configuration, which starts and
 * then fails on the first read with no obvious cause.
 *
 * Run it once, and again whenever a value changes:
 *
 *   node scripts/push-eas-env.mjs            # all three environments
 *   node scripts/push-eas-env.mjs production # just one
 *   node scripts/push-eas-env.mjs --dry-run  # print what it would do
 *
 * On visibility: every variable here is EXPO_PUBLIC_*, which Expo inlines into
 * the JavaScript bundle at build time. They are readable by anyone who unzips
 * the app, so they are uploaded as `plaintext` — marking them `secret` would
 * claim a protection that does not exist. That is fine for what they are: a
 * Firebase web config is public by design, and what actually protects the data
 * is the Firestore security rules plus API-key restrictions in Google Cloud.
 * If you ever add a genuine secret here, give it `--visibility secret` and do
 * not prefix it with EXPO_PUBLIC_.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const envPath = join(projectRoot, '.env');

const ALL_ENVIRONMENTS = ['development', 'preview', 'production'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const chosen = args.filter((a) => !a.startsWith('--'));
const environments = chosen.length ? chosen : ALL_ENVIRONMENTS;

for (const env of environments) {
  if (!ALL_ENVIRONMENTS.includes(env)) {
    console.error(
      `Unknown environment "${env}". Expected one of: ${ALL_ENVIRONMENTS.join(', ')}`
    );
    process.exit(1);
  }
}

if (!existsSync(envPath)) {
  console.error(`No .env found at ${envPath}`);
  console.error('Copy .env.example and fill it in first.');
  process.exit(1);
}

/** Minimal dotenv parse — enough for KEY=value with optional quotes. */
function parseEnv(text) {
  const out = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (name && value) out.push([name, value]);
  }
  return out;
}

const vars = parseEnv(readFileSync(envPath, 'utf8'));

if (vars.length === 0) {
  console.error('.env parsed but contained no KEY=value pairs.');
  process.exit(1);
}

console.log(
  `Pushing ${vars.length} variable(s) to: ${environments.join(', ')}\n`
);

let failures = 0;

for (const env of environments) {
  for (const [name, value] of vars) {
    // Values are never printed. Knowing which name is being set is enough to
    // follow along, and a terminal scrollback full of credentials is its own
    // small leak.
    process.stdout.write(`  ${env.padEnd(12)} ${name} ... `);

    if (dryRun) {
      console.log('(dry run)');
      continue;
    }

    try {
      execFileSync(
        'eas',
        [
          'env:set',
          '--name', name,
          '--value', value,
          '--environment', env,
          '--visibility', 'plaintext',
          '--scope', 'project',
          '--type', 'string',
          // No --force: env:set is create-or-update by design. The flag exists
          // on the deprecated env:create and is rejected here.
          '--non-interactive',
        ],
        { cwd: projectRoot, stdio: ['ignore', 'ignore', 'pipe'], shell: true }
      );
      console.log('ok');
    } catch (e) {
      failures += 1;
      console.log('FAILED');
      const detail = e?.stderr?.toString().trim();
      if (detail) console.error(`      ${detail.split('\n')[0]}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} variable(s) failed to upload.`);
  process.exit(1);
}

console.log(
  dryRun
    ? '\nDry run complete — nothing was uploaded.'
    : '\nDone. Verify with: eas env:list'
);
