import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Send limit: ten messages per rolling 24 hours.
 *
 * It was one per 24 hours, which made the app feel like a vending machine that
 * takes a coin and then closes. Ten is enough to write to everyone you meant to
 * in one sitting and still low enough that nobody turns a bottle into a feed.
 *
 * Rolling, not "resets at midnight": with a calendar reset someone can send ten
 * at 23:59 and ten more a minute later. Here each send frees up again exactly
 * 24 hours after it happened.
 *
 * Same honest caveat as before, and it matters more now that the allowance is
 * bigger: this lives on the device. Reinstalling the app or clearing its data
 * resets it. It stops accidental double-sends and casual flooding, not
 * determined abuse — real enforcement needs a server-side check or Firebase App
 * Check.
 */
const STORAGE_KEY = 'miab_send_log';
/** Old single-timestamp key, migrated on first read. */
const LEGACY_KEY = 'miab_last_sent';

export const DAILY_SEND_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  /** How many of today's allowance are left. */
  remaining: number;
  /** Human-readable wait, e.g. "3 hours". Undefined when allowed. */
  retryAfterLabel?: string;
}

function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Timestamps of sends inside the window, oldest first.
 *
 * Reading also migrates the old single-timestamp key, so someone who sent a
 * message on the previous version is not handed a fresh ten immediately —
 * their one send still counts until it ages out.
 */
async function readLog(): Promise<number[]> {
  const cutoff = Date.now() - WINDOW_MS;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
          .filter((n) => n > cutoff)
          .sort((a, b) => a - b);
      }
    } catch {
      /* corrupt — treated as empty below */
    }
  }

  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy) {
    const last = Number(legacy);
    await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
    if (Number.isFinite(last) && last > cutoff) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([last])).catch(
        () => {}
      );
      return [last];
    }
  }

  return [];
}

export async function checkRateLimit(): Promise<RateLimitResult> {
  try {
    const log = await readLog();

    if (log.length < DAILY_SEND_LIMIT) {
      return { allowed: true, remaining: DAILY_SEND_LIMIT - log.length };
    }

    // The window frees up when the oldest send inside it ages out.
    const oldest = log[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterLabel: formatWait(oldest + WINDOW_MS - Date.now()),
    };
  } catch {
    // Storage unavailable — fail open. Blocking sends because of a storage
    // error would break the app's only write path.
    return { allowed: true, remaining: DAILY_SEND_LIMIT };
  }
}

export async function recordMessageSent(): Promise<void> {
  try {
    const log = await readLog();
    log.push(Date.now());
    // Trimmed to the limit: entries beyond it can never change the outcome,
    // and an unbounded array in storage is a slow leak.
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(log.slice(-DAILY_SEND_LIMIT))
    );
  } catch {
    /* best effort */
  }
}
