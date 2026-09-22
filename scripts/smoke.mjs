#!/usr/bin/env node
/**
 * Release smoke test: drives one whole game over HTTP against a real server.
 *
 * The unit suite covers the rules; this covers the wiring between them — route
 * handlers, cookies, validation, the polling payloads and the state machine all
 * behaving together. It is the check that would have caught a broken route long
 * before a classroom did.
 *
 * Runs against `next dev`, deliberately: development mode uses the in-memory adapter
 * and the development secrets, so the test needs no database and no credentials and
 * gives the same result on every machine. Production mode is not usable here because
 * the app is built to refuse to start a game without Supabase.
 *
 *   node scripts/smoke.mjs [--port 3411] [--keep]
 */

import { spawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const PORT = portArg >= 0 ? Number(args[portArg + 1]) : 3411;
const BASE = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = 120_000;

/**
 * The child server's environment is pinned rather than inherited.
 *
 * `next dev` would otherwise load whatever is in the developer's `.env.local`, which
 * makes the result depend on their machine — and, if they happen to have Supabase
 * configured there, would point this test at a real database. Real environment
 * variables take precedence over `.env.local` in Next, so setting them here wins.
 * Empty Supabase values select the in-memory adapter.
 */
const SMOKE_ENV = {
  NODE_ENV: 'development',
  ADMIN_SECRET: 'hcm360-smoke',
  SESSION_SECRET: 'hcm360-smoke-session-secret-at-least-32-chars',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  NEXT_PUBLIC_APP_ORIGIN: '',
  BROWSER: 'none',
};
const DEV_SECRET = SMOKE_ENV.ADMIN_SECRET;

let server = null;
let serverLog = '';
const failures = [];
let stepNumber = 0;

function step(name) {
  stepNumber += 1;
  process.stdout.write(`  ${String(stepNumber).padStart(2)}. ${name} ... `);
}

function pass(detail = '') {
  process.stdout.write(`ok${detail ? ` (${detail})` : ''}\n`);
}

function fail(reason) {
  process.stdout.write('FAILED\n');
  failures.push(`step ${stepNumber}: ${reason}`);
}

function check(condition, name, detail = '') {
  step(name);
  if (condition) pass(detail);
  else fail(`${name} — ${detail || 'condition was false'}`);
  return Boolean(condition);
}

/** Minimal cookie jar: Node's fetch has none, and the whole app is cookie-authenticated. */
function jarFrom(response, previous = '') {
  const set = response.headers.getSetCookie?.() ?? [];
  const jar = new Map();
  for (const entry of previous.split('; ').filter(Boolean)) {
    const [name, ...rest] = entry.split('=');
    jar.set(name, rest.join('='));
  }
  for (const cookie of set) {
    const [pair] = cookie.split(';');
    const [name, ...rest] = pair.split('=');
    jar.set(name.trim(), rest.join('='));
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function call(path, { method = 'GET', body, cookies } = {}) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookies ? { cookie: cookies } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  if (text.trim()) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return { status: response.status, json, text, response };
}

async function waitForServer() {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  // A dev server left behind by an earlier run is the most likely cause of a boot
  // failure, and Next's own message says exactly how to clear it — so surface it.
  const alreadyRunning = () => serverLog.includes('Another next dev server is already running');
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE + '/', { signal: AbortSignal.timeout(5000) });
      if (response.ok) return true;
    } catch {
      // not up yet
    }
    if (alreadyRunning()) {
      failures.push(
        'another `next dev` is already running for this directory; stop it and re-run.\n' +
          serverLog.slice(-600),
      );
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function startServer() {
  // Next's own bin is launched directly with this Node, rather than through `npx` and a
  // shell. That keeps `child.pid` as the process actually serving, so it can be stopped
  // reliably afterwards — a leaked dev server blocks the next run, because Next refuses
  // to start a second one in the same directory.
  const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));

  const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT)], {
    env: { ...process.env, ...SMOKE_ENV },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const record = (chunk) => {
    serverLog += chunk;
  };
  child.stdout.on('data', record);
  child.stderr.on('data', record);

  child.on('exit', (code) => {
    if (code !== null && code !== 0 && failures.length === 0) {
      failures.push(`dev server exited with code ${code}\n${serverLog.slice(-1500)}`);
    }
  });

  return child;
}

function stopServer() {
  if (!server || server.killed) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
}

async function main() {
  console.log(`\nĐẠO ĐỨC 360 — smoke test on ${BASE}\n`);

  server = startServer();
  step('dev server starts');
  if (!(await waitForServer())) {
    fail('server did not become ready in time');
    return;
  }
  pass();

  // ---------------------------------------------------------------- pages
  for (const [path, label] of [
    ['/', 'landing page renders'],
    ['/join', 'join-by-code page renders'],
    ['/host', 'host page renders'],
  ]) {
    step(label);
    const { status } = await call(path);
    if (status === 200) pass();
    else fail(`${path} returned ${status}`);
  }

  // ------------------------------------------------------------ host auth
  step('wrong admin secret is rejected');
  const badLogin = await call('/api/host/login', { method: 'POST', body: { secret: 'definitely-wrong' } });
  if (badLogin.status === 401) pass();
  else fail(`expected 401, got ${badLogin.status}`);

  step('room creation without a host cookie is rejected');
  const noAuth = await call('/api/host/rooms', { method: 'POST' });
  if (noAuth.status === 401) pass();
  else fail(`expected 401, got ${noAuth.status}`);

  step('host logs in');
  const login = await call('/api/host/login', { method: 'POST', body: { secret: DEV_SECRET } });
  if (login.status !== 200) {
    fail(`login returned ${login.status}: ${login.text.slice(0, 200)}`);
    return;
  }
  const hostJar = jarFrom(login.response);
  if (!hostJar.includes('hcm360_host')) {
    fail('no host cookie was set');
    return;
  }
  pass();

  // -------------------------------------------------------------- lobby
  step('host creates a room');
  const created = await call('/api/host/rooms', { method: 'POST', cookies: hostJar });
  const code = created.json?.code;
  if (created.status !== 200 || !code) {
    fail(`create room returned ${created.status}: ${created.text.slice(0, 200)}`);
    return;
  }
  const totalQuestions = created.json.questionTotal;
  pass(`${code}, ${totalQuestions} questions`);

  check(/^[ABCDEFGHJKMNPRSTUWXYZ]{5}$/.test(code), 'room code has the expected shape', code);

  step('projector page renders and contains a QR code');
  const projector = await call(`/room/${code}`);
  // Angle brackets arrive escaped inside the RSC flight payload (`<svg`), so match
  // the tag name rather than the literal markup.
  const hasSvg = /svg\s+xmlns/.test(projector.text);
  const hasJoinTarget = projector.text.includes(`/join/${code}`);
  if (projector.status === 200 && hasSvg && hasJoinTarget) pass();
  else fail(`status ${projector.status}, svg: ${hasSvg}, join target: ${hasJoinTarget}`);

  step('QR points at this host over http, not a guessed https origin');
  const expectedJoinUrl = `http://127.0.0.1:${PORT}/join/${code}`;
  if (
    projector.text.includes(expectedJoinUrl) &&
    !projector.text.includes('https://127.0.0.1') &&
    !projector.text.includes('https://localhost')
  ) {
    pass(expectedJoinUrl);
  } else {
    fail(`expected ${expectedJoinUrl} in the page`);
  }

  step('unknown room code is a 404');
  const missing = await call('/api/rooms/BCDFG/state?role=projector');
  if (missing.status === 404) pass();
  else fail(`expected 404, got ${missing.status}`);

  step('malformed room code is a 400');
  const malformed = await call('/api/rooms/ZZ/state?role=projector');
  if (malformed.status === 400) pass();
  else fail(`expected 400, got ${malformed.status}`);

  // ------------------------------------------------------------- players
  const players = {};
  for (const name of ['Minh Anh', 'Nguyễn Đức Hoàng Phúc', 'Trà My']) {
    step(`player joins: ${name}`);
    const joined = await call(`/api/rooms/${code}/join`, { method: 'POST', body: { displayName: name } });
    if (joined.status !== 200) {
      fail(`join returned ${joined.status}: ${joined.text.slice(0, 200)}`);
      return;
    }
    players[name] = jarFrom(joined.response);
    if (joined.json.view.player.displayName !== name) {
      fail(`name round-tripped as "${joined.json.view.player.displayName}"`);
      return;
    }
    pass();
  }

  step('duplicate name is rejected with a suggestion');
  const dup = await call(`/api/rooms/${code}/join`, { method: 'POST', body: { displayName: 'trà my' } });
  if (dup.status === 409 && dup.json?.error?.suggestion) pass(dup.json.error.suggestion);
  else fail(`expected 409 + suggestion, got ${dup.status}`);

  step('empty name is rejected');
  const empty = await call(`/api/rooms/${code}/join`, { method: 'POST', body: { displayName: '   ' } });
  if (empty.status === 400) pass();
  else fail(`expected 400, got ${empty.status}`);

  step('answering before the game starts is refused');
  const early = await call(`/api/rooms/${code}/answer`, {
    method: 'POST',
    body: { questionIndex: 0, choiceIndex: 0 },
    cookies: players['Minh Anh'],
  });
  if (early.status === 409) pass();
  else fail(`expected 409, got ${early.status}`);

  // ---------------------------------------------------------------- game
  step('host starts the game');
  let hostView = (await call(`/api/host/rooms/${code}/action`, {
    method: 'POST',
    body: { action: 'START' },
    cookies: hostJar,
  })).json;
  if (hostView?.state === 'QUESTION_OPEN') pass();
  else fail(`state is ${hostView?.state}`);

  step('joining after the start is refused');
  const late = await call(`/api/rooms/${code}/join`, { method: 'POST', body: { displayName: 'Muộn' } });
  if (late.status === 409) pass();
  else fail(`expected 409, got ${late.status}`);

  let leakDetected = false;
  let secondPlayerScore = 0;

  for (let index = 0; index < totalQuestions; index += 1) {
    if (index > 0) {
      hostView = (await call(`/api/host/rooms/${code}/action`, {
        method: 'POST',
        body: { action: 'NEXT' },
        cookies: hostJar,
      })).json;
    }

    const correct = hostView.reveal.correctIndex;

    // While the question is open, no client payload may carry the answer.
    const openPlayer = await call(`/api/rooms/${code}/state`, { cookies: players['Minh Anh'] });
    const openProjector = await call(`/api/rooms/${code}/state?role=projector`);
    for (const [label, view] of [['player', openPlayer], ['projector', openProjector]]) {
      const body = view.text;
      if (body.includes('correctIndex') || body.includes('explanation') || body.includes('.md')) {
        leakDetected = true;
        failures.push(`question ${index + 1}: ${label} payload leaked reveal data while open`);
      }
    }

    await call(`/api/rooms/${code}/answer`, {
      method: 'POST',
      body: { questionIndex: index, choiceIndex: correct },
      cookies: players['Minh Anh'],
    });

    // A double tap must not score twice.
    const again = await call(`/api/rooms/${code}/answer`, {
      method: 'POST',
      body: { questionIndex: index, choiceIndex: (correct + 1) % 4 },
      cookies: players['Minh Anh'],
    });
    if (again.json?.accepted !== false) {
      failures.push(`question ${index + 1}: duplicate answer was accepted`);
    }

    await call(`/api/rooms/${code}/answer`, {
      method: 'POST',
      body: { questionIndex: index, choiceIndex: correct },
      cookies: players['Nguyễn Đức Hoàng Phúc'],
    });
    await call(`/api/rooms/${code}/answer`, {
      method: 'POST',
      body: { questionIndex: index, choiceIndex: (correct + 2) % 4 },
      cookies: players['Trà My'],
    });

    hostView = (await call(`/api/host/rooms/${code}/action`, {
      method: 'POST',
      body: { action: 'REVEAL' },
      cookies: hostJar,
    })).json;

    if (hostView.distribution.total !== 3) {
      failures.push(`question ${index + 1}: counted ${hostView.distribution.total} answers, expected 3`);
    }

    // Answering after the reveal must be refused.
    const afterReveal = await call(`/api/rooms/${code}/answer`, {
      method: 'POST',
      body: { questionIndex: index, choiceIndex: correct },
      cookies: players['Trà My'],
    });
    if (afterReveal.status !== 409) {
      failures.push(`question ${index + 1}: answer after reveal returned ${afterReveal.status}`);
    }

    const revealed = await call(`/api/rooms/${code}/state`, { cookies: players['Minh Anh'] });
    if (revealed.json?.reveal?.correctIndex !== correct) {
      failures.push(`question ${index + 1}: player did not receive the answer after the reveal`);
    }
    if (revealed.text.includes('provenance')) {
      leakDetected = true;
      failures.push(`question ${index + 1}: player payload carried internal provenance`);
    }

    secondPlayerScore =
      hostView.players.find((p) => p.displayName === 'Nguyễn Đức Hoàng Phúc')?.score ?? 0;
  }

  check(!leakDetected, 'answer and internal source data stayed server-side throughout');

  step('question flow ran to the last question');
  if (hostView.questionIndex === totalQuestions - 1) pass(`${totalQuestions}/${totalQuestions}`);
  else fail(`stopped at index ${hostView.questionIndex}`);

  // -------------------------------------------------------------- finish
  step('host finishes the game');
  const finished = (await call(`/api/host/rooms/${code}/action`, {
    method: 'POST',
    body: { action: 'NEXT' },
    cookies: hostJar,
  })).json;
  if (finished?.state === 'FINISHED') pass();
  else fail(`state is ${finished?.state}`);

  step('projector shows a Top 5 podium and stats');
  const final = (await call(`/api/rooms/${code}/state?role=projector`)).json;
  const podium = final?.finalPodium ?? [];
  if (podium.length === 3 && podium[0].displayName === 'Minh Anh' && final.stats?.playerCount === 3) {
    pass(`winner ${podium[0].displayName} with ${podium[0].score}`);
  } else {
    fail(`podium=${JSON.stringify(podium.map((e) => [e.rank, e.displayName, e.score]))}`);
  }

  check(
    podium.every((entry) => typeof entry.score === 'number' && entry.score >= 0),
    'every podium score is a non-negative number',
  );
  check(secondPlayerScore > 0, 'the second player also scored', String(secondPlayerScore));
  check(
    (podium.find((e) => e.displayName === 'Trà My')?.score ?? -1) === 0,
    'the player who answered wrongly scored nothing',
  );

  step('answering a finished room is refused');
  const afterFinish = await call(`/api/rooms/${code}/answer`, {
    method: 'POST',
    body: { questionIndex: 0, choiceIndex: 0 },
    cookies: players['Minh Anh'],
  });
  if (afterFinish.status === 409) pass();
  else fail(`expected 409, got ${afterFinish.status}`);

  // --------------------------------------------------------------- reset
  step('host resets for a replay');
  const reset = (await call(`/api/host/rooms/${code}/action`, {
    method: 'POST',
    body: { action: 'RESET' },
    cookies: hostJar,
  })).json;
  const kept = reset?.playerCount === 3;
  const zeroed = reset?.players?.every((p) => p.score === 0);
  if (reset?.state === 'LOBBY' && kept && zeroed) pass('roster kept, scores zeroed');
  else fail(`state=${reset?.state} players=${reset?.playerCount} zeroed=${zeroed}`);

  step('polling with a current version returns 204 with no body');
  const version = (await call(`/api/rooms/${code}/state?role=projector`)).json.version;
  const unchanged = await call(`/api/rooms/${code}/state?role=projector&v=${version}`);
  if (unchanged.status === 204 && unchanged.text === '') pass();
  else fail(`status ${unchanged.status}, ${unchanged.text.length} bytes`);

  step('a player cannot drive host actions');
  const notHost = await call(`/api/host/rooms/${code}/action`, {
    method: 'POST',
    body: { action: 'START' },
    cookies: players['Minh Anh'],
  });
  if (notHost.status === 401) pass();
  else fail(`expected 401, got ${notHost.status}`);
}

try {
  await main();
} catch (error) {
  failures.push(`unexpected error: ${error?.stack ?? error}`);
} finally {
  if (!args.includes('--keep')) stopServer();
}

console.log('');
if (failures.length === 0) {
  console.log(`SMOKE TEST PASSED — ${stepNumber} checks\n`);
  process.exit(0);
} else {
  console.log(`SMOKE TEST FAILED — ${failures.length} problem(s):\n`);
  for (const failure of failures) console.log(`  - ${failure}`);
  console.log('');
  process.exit(1);
}
