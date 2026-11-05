// Server component — fetches static content at the edge (cached 1 hour).
// Messages are read here too (see getInitialMessages) so they are in the HTML.
import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { siteConfig } from '@/lib/site-config';
import { BottlePageClient } from './bottle-client';
import { getMessagesForRecipientServer } from '@/lib/data-server';
import type { Message } from '@/lib/data';

export const revalidate = 3600;

/**
 * Per-bottle metadata.
 *
 * Without this every bottle page inherited the site-wide title and
 * description, so each one looked like a duplicate of the last. The name is
 * the only thing that distinguishes these pages, so it drives the title and
 * the canonical.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  // Display form only — the stored value is already lower-cased.
  const display = decoded.charAt(0).toUpperCase() + decoded.slice(1);

  return {
    title: `Messages for ${display}`,
    description: `Anonymous messages written to ${display} and left in the ocean at Message in a Bottle. Open a bottle to read what someone wanted to say.`,
    alternates: {
      canonical: `${siteConfig.url}/bottle/${encodeURIComponent(decoded)}`,
    },
    openGraph: {
      title: `Messages for ${display}`,
      description: `Anonymous messages written to ${display}.`,
      url: `${siteConfig.url}/bottle/${encodeURIComponent(decoded)}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  };
}

/**
 * Messages are read on the server so the bottle's actual content, the reason
 * anyone visits, is in the HTML instead of a skeleton. The client still runs
 * its own cached fetch afterwards to pick up anything newer.
 *
 * Shaped for the client boundary: Firestore Timestamps become plain objects,
 * attached photos (large data URLs) are dropped from the HTML, and the text of
 * a sealed time capsule is replaced with placeholder dots so it isn't sitting
 * in the page source before its date.
 */
async function getInitialMessages(name: string): Promise<Message[] | undefined> {
  try {
    const now = Date.now();
    const messages = await getMessagesForRecipientServer(name);
    return messages.map((m) => {
      const seconds: number | undefined =
        m.openTimestamp && typeof m.openTimestamp.seconds === 'number'
          ? m.openTimestamp.seconds
          : undefined;
      const sealed = seconds !== undefined && seconds * 1000 > now;
      return {
        id: m.id,
        content: sealed ? '•'.repeat(Math.min(m.content?.length ?? 0, 140)) : m.content,
        recipient: m.recipient,
        timestamp: m.timestamp,
        spotifyTrackId: m.spotifyTrackId,
        openTimestamp:
          seconds !== undefined
            ? { seconds, nanoseconds: m.openTimestamp.nanoseconds ?? 0 }
            : null,
      };
    });
  } catch (err) {
    // Fall back to the client-side fetch rather than failing the page.
    console.error('Server read of bottle messages failed:', err);
    return undefined;
  }
}

export default async function BottlePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const [content, initialMessages] = await Promise.all([
    getContent(),
    getInitialMessages(decodeURIComponent(name)),
  ]);
  return (
    <FavoritesProvider>
      <BottlePageClient content={content} initialMessages={initialMessages} />
    </FavoritesProvider>
  );
}
