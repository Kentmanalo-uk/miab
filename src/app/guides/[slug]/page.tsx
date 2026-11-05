import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdInArticle } from '@/components/ads/AdUnit';
import {
  GUIDES,
  getGuide,
  formatGuideDate,
  readingMinutes,
  type GuideBlock,
} from '@/lib/guides';
import { AD_SLOTS, siteConfig } from '@/lib/site-config';

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const url = `${siteConfig.url}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    authors: [{ name: siteConfig.operator }],
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      siteName: siteConfig.name,
      type: 'article',
      publishedTime: guide.published,
      modifiedTime: guide.updated ?? guide.published,
      authors: [siteConfig.operator],
    },
    twitter: {
      card: 'summary',
      title: guide.title,
      description: guide.description,
    },
  };
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="pt-6 text-xl font-semibold tracking-tight text-foreground">
          {block.text}
        </h2>
      );
    case 'h3':
      return <h3 className="pt-2 font-semibold text-foreground">{block.text}</h3>;
    case 'ul':
      return (
        <ul className="list-disc space-y-2 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="list-decimal space-y-2 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote className="border-l-2 border-border pl-4 font-playfair italic text-foreground">
          {block.text}
        </blockquote>
      );
    default:
      return <p>{block.text}</p>;
  }
}

/**
 * A single guide. Fully static: generated at build time, every word in the
 * HTML. The one ad unit sits after the article body and before the related
 * links. It never interrupts the text and it is never next to a button.
 */
export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const url = `${siteConfig.url}/guides/${guide.slug}`;
  const related = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.updated ?? guide.published,
      author: { '@type': 'Person', name: siteConfig.operator, url: `${siteConfig.url}/about` },
      publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteConfig.url}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="mb-4">
          <Button asChild variant="link" className="pl-0 text-muted-foreground">
            <Link href="/guides">
              <ChevronLeft className="mr-1 h-4 w-4" /> All guides
            </Link>
          </Button>
        </div>

        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {guide.category}
        </p>
        <h1 className="mt-1 font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          By{' '}
          <Link href="/about" className="underline hover:text-foreground">
            {siteConfig.operator}
          </Link>{' '}
          · <time dateTime={guide.published}>{formatGuideDate(guide.published)}</time>
          {guide.updated && (
            <>
              {' '}· Updated{' '}
              <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
            </>
          )}{' '}
          · {readingMinutes(guide)} min read
        </p>

        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
          {guide.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        <div className="mt-12 rounded-20px border p-6 text-center">
          <p className="font-semibold text-foreground">Ready to write yours?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Address it to a first name and let it drift. No account needed.
          </p>
          <Button asChild className="mt-4">
            <Link href="/send">Write a message</Link>
          </Button>
        </div>

        <AdInArticle slot={AD_SLOTS.guideArticle} className="mt-12" />

        <nav aria-label="More guides" className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">More guides</h2>
          <ul className="mt-4 space-y-3">
            {related.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="block rounded-20px border p-4 transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground">{g.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {g.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}
