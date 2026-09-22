import { BrowsePageClient } from './browse-client';
import { getContent } from '@/lib/content';
import { getRecipientsServer } from '@/lib/data-server';
import { FavoritesProvider } from '@/context/FavoritesContext';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Browse Messages',
  description: 'Browse anonymous messages sent to people around the world. Open a bottle and read what someone left behind.',
  keywords: ['browse messages', 'anonymous messages', 'read message in a bottle', 'digital ocean messages'],
  alternates: {
    canonical: 'https://messageinabottle.sbs/browse',
  },
  openGraph: {
    title: 'Browse Messages in a Bottle',
    description: 'Browse anonymous messages sent to people around the world. Open a bottle and read what someone left behind.',
    url: 'https://messageinabottle.sbs/browse',
    siteName: 'Message in a Bottle',
    type: 'website',
    images: [
      {
        url: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
        width: 1200,
        height: 630,
        alt: 'Browse Messages in a Bottle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Messages in a Bottle',
    description: 'Browse anonymous messages sent to people around the world.',
    images: ['https://i.ibb.co/GvX9XMwm/bottle-default.png'],
  },
};

export default async function BrowsePage() {
  // Both fetched on the server, so the `revalidate = 300` above now covers the
  // Firestore read as well as the CMS copy. One query every five minutes serves
  // every visitor, where before each visitor paid 50 reads of their own.
  const [content, recipients] = await Promise.all([
    getContent(),
    getRecipientsServer(),
  ]);

  return (
    <FavoritesProvider>
      <BrowsePageClient content={content} initialRecipients={recipients} />
    </FavoritesProvider>
  );
}
