/**
 * Shared read ceilings.
 *
 * Split out of data.ts because that module is marked 'use client'. Next.js
 * replaces a client module's exports with client references in the server
 * build, so a server component importing READ_LIMIT from there would receive a
 * proxy rather than the object. The limits are plain data and belong in a
 * module neither environment owns.
 */

/**
 * Read ceilings.
 *
 * Firestore bills — and rate-limits — per document read, and several of the
 * queries below previously had no ceiling at all: opening a popular bottle read
 * every message ever addressed to that name, and /about read the entire reviews
 * collection on every visit. On the free tier that exhausts the daily quota,
 * at which point every read in the project returns 429 and the whole app stops
 * loading data.
 *
 * These numbers are generous for what the UI actually displays. Raise them only
 * alongside real pagination.
 */
export const READ_LIMIT = {
  /** Messages fetched when opening one bottle. */
  bottleMessages: 50,
  /** Messages scanned to derive the browse list. */
  browseScan: 50,
  /** Messages scanned for a recipient search. */
  recipientSearch: 50,
  /** A signed-in user's own sent messages. */
  userMessages: 50,
  /** Community reviews on /about. */
  reviews: 25,
  /** Admin views. */
  feedback: 100,
} as const;
