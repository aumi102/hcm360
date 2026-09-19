/** Tunable game constants. Kept in one place so the runbook can cite real numbers. */

/** Points awarded for a correct answer regardless of speed. */
export const BASE_POINTS = 700;

/** Maximum additional points for answering instantly. Deliberately smaller than BASE_POINTS. */
export const MAX_SPEED_BONUS = 300;

/**
 * Answers that arrive within this many milliseconds after the visible timer hits
 * zero are still accepted, but receive no speed bonus.
 *
 * Rationale: the timer the player sees is client-side, while acceptance is decided
 * by server arrival time. Without a grace window a player who taps at 19.9s on a
 * slow mobile connection is punished for network latency rather than for knowledge.
 * The window is short enough that it cannot be used to gain an advantage — the
 * bonus is already clamped to zero for anything at or past the deadline.
 */
export const ANSWER_GRACE_MS = 1000;

/** Hard cap on players per room; protects the in-memory adapter and keeps the podium meaningful. */
export const MAX_PLAYERS_PER_ROOM = 300;

/**
 * Display-name bounds, in Unicode code points.
 *
 * 24 rather than a rounder 20 because a Vietnamese full name routinely exceeds twenty
 * characters ("Nguyễn Đức Hoàng Phúc" is 21), and rejecting a student's own name at the
 * join screen is a worse failure than a name that needs truncating on the podium.
 */
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 24;

/**
 * Join-code alphabet: letters only, with one character removed from every pair that
 * is confusable on a projector (O/0, I/1/L, S/5, Z/2, B/8, G/6, U/V, Q/O). Letters
 * only means a student never has to decide whether a glyph is a letter or a digit.
 * 21 characters ^ 5 ≈ 4.08 million codes.
 */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPRSTUWXYZ';
export const ROOM_CODE_LENGTH = 5;

/** How long a client waits between state polls while a question is running. */
export const POLL_INTERVAL_ACTIVE_MS = 700;
/** Poll interval while nothing time-critical is happening. */
export const POLL_INTERVAL_IDLE_MS = 1500;

/** A room older than this is eligible for cleanup in the in-memory adapter. */
export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

/** Number of players shown on the final podium. */
export const PODIUM_SIZE = 5;
