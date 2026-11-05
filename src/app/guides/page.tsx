import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES, formatGuideDate, readingMinutes } from '@/lib/guides';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Guides — Writing the Things You Can’t Say',
  description:
    'Practical, gentle guides to writing unsent letters, apologies, goodbyes and anonymous messages, plus writing prompts and a short history of messages in bottles.',
  alternates: { canonical: `${siteConfig.url}/guides` },
  openGraph: {
    title: 'Guides — Message in a Bottle',
    description:
      'How to write an unsent letter, an apology, a letter to someone you have lost, and more.',
    url: `${siteConfig.url}/guides`,
    siteName: siteConfig.name,
    type: 'website',
  },
};

/** Server-rendered: every guide title and summary is in the HTML. */
export default function GuidesIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guides',
    url: `${siteConfig.url}/guides`,
    hasPart: GUIDES.map((g) => ({
      '@type': 'Article',
      headline: g.title,
      url: `${siteConfig.url}/guides/${g.slug}`,
    })),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          Guides
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Writing to someone you can&apos;t talk to is harder than it looks.
          These guides are about the practical side of it: how to start, what
          to say, what to leave out, and how to do it safely when the whole
          world can read it.
        </p>

        <ul className="mt-10 space-y-4">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="block rounded-20px border p-5 transition-colors hover:bg-muted/50"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {guide.category} · {readingMinutes(guide)} min read
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {guide.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {guide.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  <time dateTime={guide.updated ?? guide.published}>
                    {formatGuideDate(guide.updated ?? guide.published)}
                  </time>
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          Have a question these don&apos;t answer? See the{' '}
          <Link href="/faq" className="underline hover:text-foreground">
            frequently asked questions
          </Link>{' '}
          or{' '}
          <Link href="/contact" className="underline hover:text-foreground">
            get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
