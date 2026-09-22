/**
 * Client-side rate limiting for message sending.
 *
 * Ten messages per rolling 24 hours. It used to be one, which made the app feel
 * like a vending machine that takes a coin and then closes.
 *
 * Rolling, not "resets at midnight": with a calendar reset someone can send ten
 * at 23:59 and ten more a minute later. Each send frees up again exactly 24
 * hours after it happened.
 *
 * Enforcement lives in localStorage. It can be cleared, and that matters more
 * now the allowance is larger — this stops accidental double-sends and casual
 * flooding, not determined abuse. Real enforcement needs a server-side check.
 * Kept identical to the mobile app's limit so the two halves of the product do
 * not disagree about the rules.
 */

const LS_KEY = 'mitb_send_log';
/** Old single-timestamp key, migrated on first read. */
const LEGACY_KEY = 'mitb_last_sent';

export const DAILY_SEND_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  /** How many of today's allowance are left. */
  remaining: number;
  /** How many ms until the window frees up (only set when allowed=false) */
  retryAfterMs?: number;
  /** Human-readable time remaining e.g. "23h 14m" */
  retryAfterLabel?: string;
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'less than a minute';
}

/**
 * Timestamps of sends inside the window, oldest first.
 *
 * Also migrates the old single-timestamp key, so someone who sent a message on
 * the previous version is not handed a fresh ten immediately.
 */
function readLog(): number[] {
  if (typeof window === 'undefined') return [];
  const cutoff = Date.now() - WINDOW_MS;

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((n): n is number => typeof n === 'number' && isFinite(n))
          .filter((n) => n > cutoff)
          .sort((a, b) => a - b);
      }
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const last = parseInt(legacy, 10);
      localStorage.removeItem(LEGACY_KEY);
      if (!isNaN(last) && last > cutoff) {
        localStorage.setItem(LS_KEY, JSON.stringify([last]));
        return [last];
      }
    }
  } catch {
    /* unreadable or corrupt — treated as empty */
  }

  return [];
}

/**
 * Check if the current device/user is allowed to send a message.
 * Call before submitting the form.
 */
export function checkRateLimit(): RateLimitResult {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: DAILY_SEND_LIMIT };
  }

  const log = readLog();
  if (log.length < DAILY_SEND_LIMIT) {
    return { allowed: true, remaining: DAILY_SEND_LIMIT - log.length };
  }

  const retryAfterMs = log[0] + WINDOW_MS - Date.now();
  return {
    allowed: false,
    remaining: 0,
    retryAfterMs,
    retryAfterLabel: formatTimeRemaining(retryAfterMs),
  };
}

/**
 * Record that a message was just sent. Call after successful submission.
 */
export function recordMessageSent(): void {
  if (typeof window === 'undefined') return;
  try {
    const log = readLog();
    log.push(Date.now());
    // Entries beyond the limit can never change the outcome, and an unbounded
    // array in storage is a slow leak.
    localStorage.setItem(LS_KEY, JSON.stringify(log.slice(-DAILY_SEND_LIMIT)));
  } catch {
    // localStorage unavailable — fail silently
  }
}

/**
 * Clear the rate limit (for testing or admin use).
 */
export function clearRateLimit(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

/**
 * Returns how long until the window frees up, or null if not rate limited.
 */
export function getTimeUntilNextMessage(): string | null {
  const result = checkRateLimit();
  if (result.allowed) return null;
  return result.retryAfterLabel ?? null;
}
