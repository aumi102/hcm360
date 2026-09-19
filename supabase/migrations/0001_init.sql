-- ĐẠO ĐỨC 360 — schema
--
-- Design rules encoded here:
--   * The database, not the client, owns timing and scoring.
--   * One scored answer per player per question is a UNIQUE constraint, not app logic.
--   * Row Level Security is enabled with no policies, so the anon key can read nothing.
--     Every access goes through the Next.js server using the service-role key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- rooms

create table if not exists public.rooms (
  id                      uuid primary key default gen_random_uuid(),
  code                    text        not null unique,
  state                   text        not null default 'LOBBY',
  current_question_index  integer     not null default -1,
  question_started_at     timestamptz,
  question_ends_at        timestamptz,
  answers_close_at        timestamptz,
  join_locked             boolean     not null default false,
  version                 integer     not null default 1,
  question_set_id         text        not null,
  created_at              timestamptz not null default now(),

  constraint rooms_state_valid
    check (state in ('LOBBY', 'QUESTION_OPEN', 'QUESTION_REVEAL', 'FINISHED')),
  constraint rooms_code_shape
    check (code ~ '^[ABCDEFGHJKMNPRSTUWXYZ]{5}$'),
  constraint rooms_index_range
    check (current_question_index >= -1),
  -- A room that is not in the lobby must carry the timestamps the scoring path reads.
  constraint rooms_open_has_timing
    check (
      state <> 'QUESTION_OPEN'
      or (question_started_at is not null
          and question_ends_at is not null
          and answers_close_at is not null)
    )
);

-- --------------------------------------------------------------- players

create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid        not null references public.rooms(id) on delete cascade,
  display_name  text        not null,
  name_key      text        not null,
  score         integer     not null default 0,
  joined_at     timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),

  constraint players_score_non_negative check (score >= 0),
  constraint players_name_length check (char_length(display_name) between 1 and 24),
  -- Two students in one room cannot share a name; enforced by the database so a race
  -- between two simultaneous joins cannot slip past an application-level check.
  constraint players_unique_name_per_room unique (room_id, name_key)
);

create index if not exists players_room_idx on public.players (room_id);

-- --------------------------------------------------------------- answers

create table if not exists public.answers (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid        not null references public.rooms(id) on delete cascade,
  player_id       uuid        not null references public.players(id) on delete cascade,
  question_index  integer     not null,
  choice_index    integer     not null,
  is_correct      boolean     not null,
  points          integer     not null,
  elapsed_ms      integer     not null,
  answered_at     timestamptz not null default now(),

  constraint answers_question_index_range check (question_index >= 0),
  constraint answers_choice_range check (choice_index between 0 and 3),
  constraint answers_points_non_negative check (points >= 0),
  constraint answers_elapsed_non_negative check (elapsed_ms >= 0),
  -- The single most important constraint in the schema: one scored answer per player
  -- per question, regardless of how many requests arrive.
  constraint answers_one_per_player_per_question unique (player_id, question_index)
);

create index if not exists answers_room_question_idx
  on public.answers (room_id, question_index);

-- ------------------------------------------------------------- scoring fn

-- Mirrors src/lib/game/scoring.ts exactly. Both must change together; the parity is
-- asserted by docs/implementation-plan.md and by the scoring unit tests' documented
-- expectations (700 base, 0-300 linear speed bonus, knowledge outweighs speed).
create or replace function public.hcm360_score(
  p_is_correct    boolean,
  p_elapsed_ms    integer,
  p_duration_ms   integer,
  p_base_points   integer,
  p_max_bonus     integer
) returns integer
language plpgsql
immutable
as $$
declare
  v_ratio numeric;
begin
  if not p_is_correct then
    return 0;
  end if;

  if p_duration_ms is null or p_duration_ms <= 0 then
    return p_base_points;
  end if;

  v_ratio := least(1.0, greatest(0.0, p_elapsed_ms::numeric / p_duration_ms::numeric));
  return p_base_points + round(p_max_bonus * (1.0 - v_ratio))::integer;
end;
$$;

-- ---------------------------------------------------------- submit_answer

-- Atomically validate the answering window, score the answer, store it and update the
-- player's total.
--
-- Everything that decides acceptance is read from the locked room row, never from the
-- caller: p_correct_index comes from the Next.js server's question set (not the
-- browser), and the elapsed time is measured from the stored question_started_at
-- against the database clock. A client therefore cannot claim a time, a score, or a
-- second attempt.
create or replace function public.submit_answer(
  p_room_code       text,
  p_player_id       uuid,
  p_question_index  integer,
  p_choice_index    integer,
  p_correct_index   integer,
  p_duration_ms     integer,
  p_base_points     integer,
  p_max_bonus       integer
) returns table (
  out_status      text,
  out_answer_id   uuid,
  out_is_correct  boolean,
  out_points      integer,
  out_elapsed_ms  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room        public.rooms%rowtype;
  v_player      public.players%rowtype;
  v_now         timestamptz := clock_timestamp();
  v_elapsed_ms  integer;
  v_is_correct  boolean;
  v_points      integer;
  v_answer_id   uuid;
begin
  -- FOR UPDATE serialises concurrent submissions for the same room, which is what makes
  -- the version bump and the score update safe under a whole class tapping at once.
  select * into v_room from public.rooms where code = p_room_code for update;
  if not found then
    return query select 'ROOM_NOT_FOUND'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  select * into v_player from public.players where id = p_player_id and room_id = v_room.id;
  if not found then
    return query select 'PLAYER_NOT_FOUND'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  if v_room.state <> 'QUESTION_OPEN' then
    return query select 'QUESTION_NOT_OPEN'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  if v_room.current_question_index <> p_question_index then
    return query select 'QUESTION_INDEX_MISMATCH'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  if v_room.answers_close_at is null or v_now > v_room.answers_close_at then
    return query select 'ANSWER_WINDOW_CLOSED'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  v_elapsed_ms := greatest(0, (extract(epoch from (v_now - v_room.question_started_at)) * 1000)::integer);
  v_is_correct := (p_choice_index = p_correct_index);
  v_points := public.hcm360_score(v_is_correct, v_elapsed_ms, p_duration_ms, p_base_points, p_max_bonus);

  insert into public.answers (
    room_id, player_id, question_index, choice_index, is_correct, points, elapsed_ms, answered_at
  ) values (
    v_room.id, p_player_id, p_question_index, p_choice_index, v_is_correct, v_points, v_elapsed_ms, v_now
  )
  on conflict on constraint answers_one_per_player_per_question do nothing
  returning id into v_answer_id;

  if v_answer_id is null then
    return query select 'ALREADY_ANSWERED'::text, null::uuid, null::boolean, null::integer, null::integer;
    return;
  end if;

  update public.players
     set score = score + v_points,
         last_seen_at = v_now
   where id = p_player_id;

  update public.rooms set version = version + 1 where id = v_room.id;

  return query select 'OK'::text, v_answer_id, v_is_correct, v_points, v_elapsed_ms;
end;
$$;

-- ------------------------------------------------------------- join_room

-- Adding a player needs the same treatment: the capacity check and the uniqueness check
-- must happen inside one transaction, or two simultaneous joins can both pass a check
-- that only one of them should.
create or replace function public.join_room(
  p_room_code    text,
  p_display_name text,
  p_name_key     text,
  p_max_players  integer
) returns table (
  out_status       text,
  out_player_id    uuid,
  out_display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room       public.rooms%rowtype;
  v_count      integer;
  v_player_id  uuid;
begin
  select * into v_room from public.rooms where code = p_room_code for update;
  if not found then
    return query select 'ROOM_NOT_FOUND'::text, null::uuid, null::text;
    return;
  end if;

  if v_room.state <> 'LOBBY' then
    return query select 'GAME_ALREADY_STARTED'::text, null::uuid, null::text;
    return;
  end if;

  if v_room.join_locked then
    return query select 'JOIN_LOCKED'::text, null::uuid, null::text;
    return;
  end if;

  select count(*) into v_count from public.players where room_id = v_room.id;
  if v_count >= p_max_players then
    return query select 'ROOM_FULL'::text, null::uuid, null::text;
    return;
  end if;

  insert into public.players (room_id, display_name, name_key)
  values (v_room.id, p_display_name, p_name_key)
  on conflict on constraint players_unique_name_per_room do nothing
  returning id into v_player_id;

  if v_player_id is null then
    return query select 'NAME_TAKEN'::text, null::uuid, null::text;
    return;
  end if;

  update public.rooms set version = version + 1 where id = v_room.id;

  return query select 'OK'::text, v_player_id, p_display_name;
end;
$$;

-- --------------------------------------------------- compare-and-set state

-- The host's state transitions are a compare-and-set on `version`, so two host tabs
-- pressing "next question" simultaneously advance the game once, not twice.
create or replace function public.apply_room_transition(
  p_room_id               uuid,
  p_expected_version      integer,
  p_state                 text,
  p_current_question_index integer,
  p_question_started_at   timestamptz,
  p_question_ends_at      timestamptz,
  p_answers_close_at      timestamptz,
  p_join_locked           boolean
) returns setof public.rooms
language sql
security definer
set search_path = public
as $$
  update public.rooms
     set state                  = p_state,
         current_question_index = p_current_question_index,
         question_started_at    = p_question_started_at,
         question_ends_at       = p_question_ends_at,
         answers_close_at       = p_answers_close_at,
         join_locked            = p_join_locked,
         version                = version + 1
   where id = p_room_id
     and version = p_expected_version
  returning *;
$$;

-- ------------------------------------------------------------------- RLS

-- Enabled with zero policies: the anon and authenticated roles can read and write
-- nothing at all. This is deliberate. Browsers never talk to these tables — they talk
-- to Next.js route handlers, which use the service-role key server-side. It removes a
-- whole class of leak, most importantly a student reading `answers.is_correct` (or the
-- question set) out of the database while a question is still open.
alter table public.rooms   enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- The SECURITY DEFINER functions above bypass RLS by design; revoke the public execute
-- grant so only the service role can call them.
revoke all on function public.submit_answer(text, uuid, integer, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.join_room(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.apply_room_transition(uuid, integer, text, integer, timestamptz, timestamptz, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.hcm360_score(boolean, integer, integer, integer, integer) from public, anon, authenticated;

grant execute on function public.submit_answer(text, uuid, integer, integer, integer, integer, integer, integer) to service_role;
grant execute on function public.join_room(text, text, text, integer) to service_role;
grant execute on function public.apply_room_transition(uuid, integer, text, integer, timestamptz, timestamptz, timestamptz, boolean) to service_role;
grant execute on function public.hcm360_score(boolean, integer, integer, integer, integer) to service_role;

-- --------------------------------------------------------------- cleanup

-- Classroom rooms are disposable. Call from a scheduled job, or manually between terms.
create or replace function public.prune_old_rooms(p_older_than interval default interval '12 hours')
returns integer
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.rooms where created_at < now() - p_older_than returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke all on function public.prune_old_rooms(interval) from public, anon, authenticated;
grant execute on function public.prune_old_rooms(interval) to service_role;
