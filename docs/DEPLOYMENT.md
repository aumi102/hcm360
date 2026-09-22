# Deployment — ĐẠO ĐỨC 360

Two one-time setups (Supabase, Vercel), then deploy and smoke test. Nothing in the
repository needs editing.

Everything below assumes the repository is already on GitHub.

---

## A. Supabase — one-time setup

### 1. Create the project

[supabase.com](https://supabase.com) → **New project**. The free tier is enough for a
class. Pick the region closest to the classroom; note the database password when
prompted (it is not needed by this app, but Supabase asks for it).

### 2. Run the migration

Supabase dashboard → **SQL Editor** → **New query**.

Paste the entire contents of [`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
and press **Run**.

The file is idempotent — running it twice is safe. It creates:

| Object | Purpose |
|---|---|
| `rooms`, `players`, `answers` | the three tables, with all constraints and indexes |
| `hcm360_score(...)` | scoring, mirroring `src/lib/game/scoring.ts` |
| `submit_answer(...)` | validate the answer window, score, store and total — in one transaction |
| `join_room(...)` | capacity and duplicate-name checks in one transaction |
| `apply_room_transition(...)` | compare-and-set on `rooms.version` |
| `prune_old_rooms(...)` | optional cleanup between terms |
| RLS | enabled on all three tables, **with no policies** |

### 3. Collect the two values

Dashboard → **Project Settings** → **API**:

- **Project URL** → use as `SUPABASE_URL`
- **Project API keys → `service_role`** → use as `SUPABASE_SERVICE_ROLE_KEY`

> Take the **`service_role`** key, not `anon`. The `anon` key cannot read anything here
> by design, so the app will not work with it.

### 4. Verify the expected RLS state

**Table Editor** → each of `rooms`, `players`, `answers` should show **RLS enabled** and
**no policies**.

That is the intended, correct state — not something to "fix". Browsers never connect to
Supabase in this application. Every database access goes through Next.js route handlers
using the service-role key server-side. Adding permissive policies to "make it work"
would expose `answers.is_correct` to any student who opened the network tab while a
question was still running.

---

## B. Vercel

### 1. Import

[vercel.com](https://vercel.com) → **Add New → Project** → select the GitHub repository.

Framework is detected as **Next.js**. Leave every build setting at its default. No
`vercel.json` is needed and none is present.

### 2. Add the environment variables

**Before** clicking Deploy, open **Environment Variables** and add all four. Apply them
to **Production**, **Preview** and **Development**.

| Variable | Required? | Server/client | Example shape | Where to get it |
|---|---|---|---|---|
| `ADMIN_SECRET` | **Yes** | Server only | `Xq8t2Lm9vB4nR7kP0wZ3aC6e` | Generate: `openssl rand -base64 24` |
| `SESSION_SECRET` | **Yes** | Server only | 44+ random chars | Generate: `openssl rand -base64 48` |
| `SUPABASE_URL` | **Yes** | Server only | `https://abcdefghijklm.supabase.co` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server only | long JWT-shaped string | Supabase → Settings → API → `service_role` |
| `NEXT_PUBLIC_APP_ORIGIN` | No | Client-visible | `https://hcm360.vercel.app` | Leave unset — see below |

Notes that matter:

- **All four required variables are server-only.** None is read through a
  `NEXT_PUBLIC_` name, and `src/lib/env.ts` is marked `server-only`, so importing it
  from client code is a build error rather than a silent leak.
- **`NEXT_PUBLIC_APP_ORIGIN` is not needed on Vercel.** The app derives its public
  origin from `x-forwarded-host` / `x-forwarded-proto`, which Vercel always sets, so the
  projector QR code points at the real deployment automatically. Set it only to pin one
  custom domain when the deployment answers on several.
- **Missing anything fails closed.** In production, an absent or development-default
  secret, or absent Supabase, makes host login and room creation return an error instead
  of silently falling back to the single-process in-memory adapter. A deployment that
  half-works is not possible; it either runs properly or says so.
- `SESSION_SECRET` must be at least 32 characters. Rotating it signs every active
  session out, so never change it during a lesson.

### 3. Deploy

Click **Deploy**. No further configuration.

### 4. Smoke test (below) before relying on it in class.

---

## C. Production smoke test

Run once after the first deploy, and again on the morning of the class. Takes 3 minutes.

| # | Check | Expected |
|---|---|---|
| 1 | Open `/` | Landing page, title renders with Vietnamese diacritics |
| 2 | Open `/host` | Login prompt; **no** development hint text |
| 3 | Log in with `ADMIN_SECRET` | Accepted |
| 4 | — | **No "chế độ bộ nhớ tạm" badge anywhere.** If it appears, Supabase is not wired up |
| 5 | Click **Tạo phòng** | A 5-letter room code appears |
| 6 | Click **Mở màn chiếu ↗** | Projector page, QR code visible, room code large |
| 7 | Check the URL under the QR | Starts `https://`, is the production domain, **not** localhost or a preview URL |
| 8 | Scan the QR on a phone (mobile data, not classroom Wi-Fi) | Join page opens over HTTPS |
| 9 | Enter a name, join | Appears in the participant count on the projector |
| 10 | Host: **Bắt đầu** | Question 1 appears on both phone and projector |
| 11 | Answer on the phone | "Đã ghi nhận"; the answer cannot be changed |
| 12 | Host: **Công bố đáp án** | Correct answer, explanation and distribution on the projector |
| 13 | Host: **Câu tiếp theo** | Question 2 appears |
| 14 | Host: **Kết thúc sớm** | Top 5 podium and class statistics |
| 15 | Host: **Chơi lại** then **Tạo phòng mới** | Both work |
| 16 | Check the address bar | `https://`, valid certificate |

If step 4 shows the memory-mode badge, or step 3 returns a configuration error, the
Supabase variables are missing or misspelled in Vercel. Fix them and redeploy.

---

## D. Repository-side release gate

Before pushing a change, run locally:

```bash
npm run predeploy
```

This runs lint → typecheck → unit tests → production build → HTTP smoke test, and exits
non-zero on the first failure. The smoke test boots a development server on port 3411,
plays a complete seven-question game over HTTP, and checks the security properties that
matter (no answer leakage before the reveal, no double scoring, late answers refused,
host endpoints closed to players).

> The smoke test starts its own `next dev`. Stop any dev server you have running first —
> Next refuses to start a second one in the same directory.

---

## E. Between terms

Old rooms are disposable. To clear them:

```sql
select public.prune_old_rooms(interval '12 hours');
```

Run it from the Supabase SQL Editor whenever convenient. Nothing breaks if it is never
run; the table simply grows slowly.
