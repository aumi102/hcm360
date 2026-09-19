import 'server-only';

interface Bucket {
  tokens: number;
  updatedAt: number;
}

/**
 * Small fixed-capacity token bucket, per key, held in process memory.
 *
 * Scope is deliberately modest: on serverless each instance keeps its own counters, so
 * this slows a brute-force attempt and absorbs an accidental retry storm, but it is not
 * a distributed rate limiter. For the one thing that really matters — guessing the
 * admin secret — the limiter is a second line of defence behind a secret that should
 * itself be long enough not to be guessable.
 */
const GLOBAL_KEY = Symbol.for('hcm360.rate-limit');

function buckets(): Map<string, Bucket> {
  const holder = globalThis as unknown as Record<symbol, Map<string, Bucket> | undefined>;
  if (!holder[GLOBAL_KEY]) holder[GLOBAL_KEY] = new Map();
  return holder[GLOBAL_KEY]!;
}

export interface RateLimitOptions {
  /** Maximum burst size. */
  capacity: number;
  /** Tokens replenished per second. */
  refillPerSecond: number;
}

export function rateLimit(key: string, now: number, options: RateLimitOptions): boolean {
  const map = buckets();

  // Opportunistic sweep so a long-lived instance does not accumulate one entry per
  // student per room forever.
  if (map.size > 5_000) {
    for (const [k, bucket] of map) {
      if (now - bucket.updatedAt > 10 * 60 * 1000) map.delete(k);
    }
  }

  const bucket = map.get(key);
  if (!bucket) {
    map.set(key, { tokens: options.capacity - 1, updatedAt: now });
    return true;
  }

  const elapsedSeconds = Math.max(0, (now - bucket.updatedAt) / 1000);
  const refilled = Math.min(
    options.capacity,
    bucket.tokens + elapsedSeconds * options.refillPerSecond,
  );

  if (refilled < 1) {
    bucket.updatedAt = now;
    bucket.tokens = refilled;
    return false;
  }

  bucket.tokens = refilled - 1;
  bucket.updatedAt = now;
  return true;
}

/**
 * Best-effort client identity for rate-limit keys.
 *
 * A whole lecture hall usually shares one NAT address, so this is never used to limit
 * gameplay actions like answering — only login attempts, room creation and joins,
 * where the limits are set well above what a real class produces.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

