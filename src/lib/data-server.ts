import 'server-only';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
// Types only — `import type` is erased at compile time, so pulling these from
// the 'use client' module is safe. READ_LIMIT is a runtime value and therefore
// comes from the neutral module instead.
import type { Message, Recipient } from './data';
import { READ_LIMIT } from './read-limits';
import { isDisplayable } from './moderation';

/**
 * Server-side Firestore reads for the pages that render public data.
 *
 * ── Why this file exists ──
 *
 * `src/lib/data.ts` is marked `'use client'`, so the browse and bottle pages
 * could only fetch their data in the browser. That made the `revalidate`
 * settings on those pages misleading: they cached the HTML shell and the CMS
 * copy, while the Firestore query re-ran for every single visitor.
 *
 * Reading the same data here, in the server component, puts it behind Next's
 * ISR cache. One query now serves every visitor until the page revalidates:
 *
 *   /browse          50 reads per visitor  →  50 reads per 5 minutes
 *   /bottle/[name]   up to 50 per visitor  →  up to 50 per hour, per name
 *
 * ── On using the web SDK rather than firebase-admin ──
 *
 * These are public reads. The security rules say `allow get, list: if true` for
 * public_messages, so an unauthenticated caller can do exactly this much and no
 * more. Pulling in the Admin SDK would mean shipping a service-account key to
 * the server for data that is already world-readable, which is more credential
 * to lose for no additional capability.
 *
 * The app instance is named so it can never collide with the client app that
 * `@/firebase` creates — they run in different environments, but Next renders
 * both in one process during development.
 */

const SERVER_APP_NAME = 'server-read';

let cachedDb: Firestore | null = null;

function getServerDb(): Firestore {
  if (cachedDb) return cachedDb;

  const existing = getApps().find((a) => a.name === SERVER_APP_NAME);
  const app: FirebaseApp =
    existing ?? initializeApp(firebaseConfig, SERVER_APP_NAME);

  cachedDb = getFirestore(app);
  return cachedDb;
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

/**
 * The browse list.
 *
 * Mirrors `getRecipientsByFallback` in data.ts: the `recipients` aggregate
 * collection is never written, so the list is derived by scanning recent
 * messages and grouping them. Counts are therefore counts *within the scanned
 * window*, not lifetime totals — the same caveat the client version carries.
 */
export async function getRecipientsServer(): Promise<Recipient[]> {
  const snapshot = await getDocs(
    query(
      collection(getServerDb(), 'public_messages'),
      orderBy('timestamp', 'desc'),
      limit(READ_LIMIT.browseScan)
    )
  );

  const grouped = new Map<string, { count: number; latest: Timestamp | null }>();

  snapshot.forEach((d) => {
    const data = d.data();
    const name = data.recipient as string | undefined;
    if (!name) return;
    // A recipient name is the only user-written text on the browse page, so an
    // unscreened one is profanity on the front page.
    if (!isDisplayable({ recipient: name })) return;

    const ts = data.timestamp instanceof Timestamp ? data.timestamp : null;
    const current = grouped.get(name);
    if (!current) {
      grouped.set(name, { count: 1, latest: ts });
      return;
    }
    current.count += 1;
    if (ts && (!current.latest || ts.toMillis() > current.latest.toMillis())) {
      current.latest = ts;
    }
  });

  return Array.from(grouped.entries())
    .map(([name, v]) => ({
      name,
      messageCount: v.count,
      lastMessageTimestamp: v.latest,
    }))
    .sort(
      (a, b) =>
        (b.lastMessageTimestamp?.toMillis() ?? 0) -
        (a.lastMessageTimestamp?.toMillis() ?? 0)
    );
}

/**
 * Every message addressed to one name.
 *
 * No `orderBy` in the query: combining it with the equality filter needs a
 * composite index, and the client version made the same trade. Sorted below.
 */
export async function getMessagesForRecipientServer(
  recipient: string
): Promise<Message[]> {
  const snapshot = await getDocs(
    query(
      collection(getServerDb(), 'public_messages'),
      where('recipient', '==', recipient.toLowerCase().trim()),
      limit(READ_LIMIT.bottleMessages)
    )
  );

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        content: data.content,
        recipient: data.recipient,
        timestamp: toDate(data.timestamp),
        photo: data.photo,
        spotifyTrackId: data.spotifyTrackId,
        openTimestamp: data.openTimestamp ?? null,
      } as Message;
    })
    .filter(isDisplayable)
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
}
