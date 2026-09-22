#!/usr/bin/env node
/**
 * Scan the built client bundle for anything that must never reach a browser.
 *
 * `src/lib/env.ts` is marked `server-only`, so importing it from a Client Component is
 * already a build error. This is the belt-and-braces check on the actual output: it
 * would catch a secret that arrived some other way — inlined into a client component,
 * pasted into a string, or exposed through a `NEXT_PUBLIC_` name.
 *
 * Run after `next build`:
 *   node scripts/check-bundle.mjs
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLIENT_DIRS = ['.next/static', '.next/server/app'];

/**
 * Literal strings that must not appear in client-served JavaScript.
 *
 * The development defaults are included because a build that inlined them would be the
 * same bug as one that inlined a real secret — and unlike a real secret, these are
 * values we can check for without putting a secret in the repository.
 */
const FORBIDDEN_LITERALS = [
  'hcm360-dev-session-secret-not-for-production',
  'SUPABASE_SERVICE_ROLE_KEY',
];

/** Patterns that indicate a real credential was inlined. */
const FORBIDDEN_PATTERNS = [
  {
    name: 'a Supabase service-role JWT',
    // Supabase keys are JWTs whose payload names the service_role.
    regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl/,
  },
  {
    name: 'a NEXT_PUBLIC_ Supabase service-role variable',
    regex: /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/,
  },
];

/**
 * Client bundles legitimately mention these names — Next inlines the *names* of
 * server-only env vars nowhere, but the words appear in framework code and in our own
 * server components' serialized props. Only files actually shipped to the browser are
 * scanned for the strict literals.
 */
const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.txt']);

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const problems = [];
let scanned = 0;

for (const relative of CLIENT_DIRS) {
  const dir = join(ROOT, relative);
  if (!existsSync(dir)) {
    problems.push(`${relative} does not exist — run \`next build\` first`);
    continue;
  }

  for (const file of walk(dir)) {
    const dot = file.lastIndexOf('.');
    if (dot < 0 || !SCAN_EXTENSIONS.has(file.slice(dot))) continue;

    scanned += 1;
    const content = readFileSync(file, 'utf8');
    const shown = file.slice(ROOT.length);

    // The static directory is what the browser downloads; be strictest there.
    if (relative === '.next/static') {
      for (const literal of FORBIDDEN_LITERALS) {
        if (content.includes(literal)) {
          problems.push(`${shown}: contains the forbidden literal "${literal}"`);
        }
      }
    }

    for (const { name, regex } of FORBIDDEN_PATTERNS) {
      if (regex.test(content)) {
        problems.push(`${shown}: looks like it contains ${name}`);
      }
    }
  }
}

if (problems.length === 0) {
  console.log(`Bundle check passed — ${scanned} built files scanned, no secrets found.`);
  process.exit(0);
}

console.error(`Bundle check FAILED — ${problems.length} problem(s):\n`);
for (const problem of problems) console.error(`  - ${problem}`);
console.error('');
process.exit(1);
