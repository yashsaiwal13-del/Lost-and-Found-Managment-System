/**
 * Robust in-memory rate limiter with sliding window tracking.
 * 
 * Chosen approach: In-memory store with automatic cleanup of expired records.
 * Why in-memory?
 * 1. Zero database overhead and millisecond-level responsiveness for high-traffic auth actions.
 * 2. Does not pollute PostgreSQL tables with transient rate-limit keys.
 * 3. Perfect fit for single-instance Next.js campus service deployment.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired timestamps every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Keep only timestamps from the last 1 hour
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  key: string;
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTimeMs: number;
  error?: string;
}

/**
 * Check and consume a rate limit token.
 * 
 * @param options.key - Unique identifier (e.g. "login:user@campus.edu", "register:ip")
 * @param options.maxAttempts - Maximum allowed attempts in window
 * @param options.windowMs - Time window in milliseconds (e.g. 15 * 60 * 1000 for 15 minutes)
 */
export function checkRateLimit({
  key,
  maxAttempts,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxAttempts) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs - now;
    const minutesLeft = Math.ceil(resetTimeMs / 60000);
    return {
      success: false,
      remaining: 0,
      resetTimeMs,
      error: `Too many attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
    };
  }

  // Record this attempt
  record.timestamps.push(now);

  return {
    success: true,
    remaining: maxAttempts - record.timestamps.length,
    resetTimeMs: windowMs,
  };
}

/**
 * Reset/clear rate limit upon successful authentication.
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}
