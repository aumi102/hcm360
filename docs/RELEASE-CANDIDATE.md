# Release candidate — ĐẠO ĐỨC 360

## Release state

**READY FOR DEPLOYMENT**

All code-side gates pass. Nothing in the repository needs editing before deploying.

---

## 1. Final HEAD

Branch `master`, HEAD is the commit subject
**`chore: finalize hcm360 deployment readiness`** (this document is part of that commit,
so it cannot quote its own hash — run `git rev-parse --short HEAD` for it).
Working tree clean. No git remote configured — see §15.

## 2. Content audit result

**CONTENT SCOPE: PASS** — [`final-content-audit.md`](./final-content-audit.md).

Every element of all seven questions was classified A (source-explicit) / B (source-derived
scenario framing) / C (ambiguous) / D (out-of-scope), against the five local HCM202
documents only. The release rule applied: *every fact required to earn points must be
source-explicit; B may only frame the scenario; no scored distinction may rest on an
unresolved ambiguity; any D in scored content fails.*

**One question failed and was fixed.** `q4-ban-nhan-loi-va-sua` keyed on an option
containing "chỉ rõ chỗ sai để cùng rút kinh nghiệm". `grep` across all five documents
returned **zero** hits for "rút kinh nghiệm", and "chỉ rõ chỗ sai" is in substance *phê
bình*, which the course documents place in the party-building chapter rather than among
the three items of "Biện pháp xây dựng đạo đức mới". A student therefore had to endorse an
out-of-scope proposition in order to score. The keyed option and the explanation were
rewritten to rest only on lines 498–499 of the theory document, and the three internal
notes that justified the borrowed clause were removed. An independent re-audit confirmed
the fix and re-verified every quotation verbatim.

The four known ambiguities are documented and none carries a scored distinction that the
authoritative document leaves unresolved:

| Ambiguity | Scored? | Resolution |
|---|---|---|
| "biện pháp" vs "nguyên tắc" | No | Both namings shown together in player-facing text |
| Three items vs four | Yes (q5) | Resolved by the theory document's own numbering 1)/2)/3) then section III |
| "Phê bình và tự phê bình" | No | Only ever a distractor; q4 no longer touches it |
| MCQ bank has no answer key | No | Nothing is presented as "the document's answer" |

Two structural facts are recorded rather than smoothed over: the two "theory" documents are
**one text in two exports** (they share typos, so agreement is not corroboration), and
topic/chapter numbering differs between terms.

## 3. Question count and target duration

Seven questions, **162 s** total answering time (design ceiling 170 s). With host-paced
reveals the whole game lands at roughly 4–5 minutes. Answer positions B, C, D, A, B, D, C —
all four used, none clustered. Hardest question last.

## 4. UI/UX status

**Frozen.** The editorial / museum visual language is unchanged: one warm paper background,
charcoal ink, a single lacquer red, hierarchy from size and space. No confetti, gradients,
new pages or new mechanics were added.

Two production-correctness changes only:

- `provenance` (internal filenames and line numbers) is no longer sent to the player or
  projector payloads at all — not merely hidden. The host screen still receives it.
- The host panel shortens a long citation to one line, full text on hover.

Development-only text is gated behind `!isProduction`, so the `hcm360-dev` hint cannot
appear on a production host screen.

## 5. Architecture

Unchanged. Game rules in `GameEngine`, above the storage layer, so the two adapters cannot
drift. Join / answer / state transition are atomic SQL functions. Transport is
version-gated polling (204 with no body when unchanged), not sockets.

13 routes: 5 pages, 8 API handlers.

## 6. Production adapter status

**Fails closed.** `productionConfigError()` refuses to start a game in production when any
of these hold, checked at **both** `/api/host/login` and `/api/host/rooms`:

| Problem | Code |
|---|---|
| Development admin secret still in place | `ADMIN_SECRET_IS_DEV_DEFAULT` |
| Development session secret still in place | `SESSION_SECRET_IS_DEV_DEFAULT` |
| Admin secret shorter than 8 characters | `ADMIN_SECRET_TOO_SHORT` |
| Session secret shorter than 32 characters | `SESSION_SECRET_TOO_SHORT` |
| Supabase absent — would silently select the in-memory adapter | `SUPABASE_NOT_CONFIGURED` |

Checked at both entry points because a host cookie minted before the deployment lost its
database would otherwise still be able to start a memory-backed game. Development is
unaffected: `npm run dev` still works on a fresh clone with no configuration.

## 7. Security review

| Check | Result | Evidence |
|---|---|---|
| Client cannot submit a score | Pass | Request body carries only `questionIndex`, `choiceIndex` |
| Client cannot submit a trusted response time | Pass | Elapsed measured server-side from stored `question_started_at` |
| Duplicate answer cannot score twice | Pass | DB UNIQUE `(player_id, question_index)`; smoke test asserts it on all 7 questions |
| Late answer rejected | Pass | Smoke test, every question |
| Finished room rejects answers | Pass | Smoke test |
| Correct answer not exposed before reveal | Pass | Smoke test inspects raw payloads each question |
| Explanation not exposed before reveal | Pass | Same |
| Internal filenames not exposed to player/projector | Pass | `RevealedQuestion` omits `provenance`; smoke test asserts |
| Host endpoints require host authorization | Pass | Smoke test: player cookie on a host action → 401 |
| Room code validation | Pass | Malformed → 400, unknown → 404 |
| Display-name validation | Pass | Empty → 400, duplicate → 409 + suggestion |
| Service-role key server-only | Pass | `server-only` import; no `NEXT_PUBLIC_` fallback (tested) |
| Secrets absent from client bundle | Pass | `npm run check:bundle`, 127 built files |
| Production refuses development credentials | Pass | 13 tests in `tests/env.test.ts` |
| Cookies httpOnly / sameSite=lax / secure in production | Pass | `src/lib/auth/session.ts` |
| Errors leak no stack traces or secrets | Pass | `withErrorHandling` logs detail, returns a generic message |

Rate limiting is in-process, therefore **per serverless instance and not a distributed
guarantee**. It is a lightweight abuse control only; correctness rests on the room capacity
and the database constraints. The join limiter is sized for a whole lecture hall behind one
NAT address (capacity 500, refill 25/s) after an earlier limit rejected 93 of 150
simultaneous joins in testing.

## 8. Environment variables required

Four, all server-side only:

`ADMIN_SECRET`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

`NEXT_PUBLIC_APP_ORIGIN` is **not required** — the origin is derived from
`x-forwarded-host` / `x-forwarded-proto`, which Vercel always sets. Templates:
[`.env.example`](../.env.example), [`.env.production.example`](../.env.production.example).

## 9. Supabase migration status

One migration, [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql),
idempotent. A fresh project initialises from it with no manual schema editing: three tables
with constraints and indexes, four SQL functions, a cleanup function, RLS enabled with **no
policies**, and `execute` revoked from `anon` / `authenticated`.

The deny-all RLS posture is intentional and documented: browsers never connect to Supabase;
all access is through server routes using the service-role key.

SQL and TypeScript scoring are pinned to each other by
`tests/scoring-sql-parity.test.ts` — it asserts the migration still contains the exact
formula, and compares a transcription of the SQL against the real implementation across
every boundary and a dense sweep of all shipped question durations.

## 10. Test counts

**137 tests, 8 files, all passing.**

| File | Tests | Covers |
|---|---|---|
| `engine.test.ts` | 30 | join, duplicate names, double answers, late answers, information hiding, lazy expiry, full game, reset |
| `state-machine.test.ts` | 19 | every legal and every refused transition, grace-window boundaries |
| `origin.test.ts` | 16 | QR/join URL generation, LAN vs production origins |
| `question-set.test.ts` | 15 | content invariants: duration budget, answer spread, word limits, no internal references in player text |
| `env.test.ts` | 13 | production fail-closed, development permissiveness |
| `leaderboard.test.ts` | 13 | ordering, ties, competition ranking, Top 5 |
| `scoring.test.ts` | 12 | boundaries, clamping, monotonicity, knowledge-over-speed |
| `scoring-sql-parity.test.ts` | 8 | SQL ↔ TypeScript equivalence |

## 11. Lint result

`eslint` — **0 problems**.

## 12. Typecheck result

`next typegen && tsc --noEmit` — **0 errors**, strict mode.

## 13. Production build result

`next build` — **compiled successfully**, 13 routes. No warnings affecting runtime.

## 14. E2E / smoke result

`npm run smoke` — **32 checks passed**. Boots a real dev server, plays a complete
seven-question game over HTTP, and asserts the security properties listed in §7. Runs in
memory mode so it needs no database and no credentials, and gives the same result on any
machine.

`npm run check:bundle` — **127 built files scanned, no secrets found**.

## 15. Git status

Branch `master`, working tree clean. Five commits, HEAD being the release preparation.
**No remote is configured**, so nothing has been pushed. Commands to add one are in §17.

History scanned: the local smoke-test credentials from development appear **nowhere** in
any commit.

## 16. Files intentionally excluded from git

`.env*` except the two templates · `node_modules` · `.next` · `coverage` · `*.key`,
`*.p12`, `service-account*.json`, `secrets/` · `.vercel` · `*.tsbuildinfo` ·
`next-env.d.ts`

A local `.env.local` exists on the development machine holding throwaway test values. It is
git-ignored and contains no production secret.

## 17. Remaining actions before a public URL exists

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`.
2. Create a GitHub repository and push:
   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin master
   ```
3. Import the repository into Vercel and add the four environment variables.
4. Click **Deploy**.
5. Run the production smoke test in [`DEPLOYMENT.md`](./DEPLOYMENT.md) §C.
