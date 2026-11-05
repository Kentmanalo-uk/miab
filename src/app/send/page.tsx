import { getContent } from '@/lib/content';
import { SendPageClient } from './send-client';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Send a Message',
  description: 'Write an anonymous message, address it to a first name and set it adrift in a public ocean of letters. No account needed. Get a link you can share with the person it is for.',
  keywords: ['send anonymous message', 'anonymous letter', 'secret message', 'message with song', 'digital bottle'],
  alternates: {
    canonical: 'https://messageinabottle.sbs/send',
  },
  openGraph: {
    title: 'Send a Message in a Bottle',
    description: 'Write an anonymous message to a name and get a link you can share. No account needed.',
    url: 'https://messageinabottle.sbs/send',
    siteName: 'Message in a Bottle',
    type: 'website',
    images: [
      {
        url: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
        width: 1200,
        height: 630,
        alt: 'Send a Message in a Bottle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Send a Message in a Bottle',
    description: 'Write an anonymous message to a name and get a link you can share. No account needed.',
    images: ['https://i.ibb.co/GvX9XMwm/bottle-default.png'],
  },
};

export default async function SendPage() {
  const content = await getContent();
  return <SendPageClient content={content} />;
}
