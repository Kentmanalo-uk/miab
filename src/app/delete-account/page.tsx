import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';
import { DeleteAccountClient } from './delete-account-client';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Delete your account',
  description:
    'Delete your Message in a Bottle account and the data attached to it — your messages, your reviews and what is stored on your device.',
  alternates: { canonical: `${siteConfig.url}/delete-account` },
};

/**
 * The public account-deletion page.
 *
 * Google Play requires a URL where someone can request deletion of their
 * account and its data **without installing the app**, and that URL goes in the
 * Play Console listing. That requirement is why the explanation below is
 * server-rendered rather than living inside the client component: a reviewer,
 * and a search engine, must be able to read it with no JavaScript and no
 * session.
 *
 * Everything stated here matches what src/lib/account.ts actually does. If the
 * deletion behaviour changes, this page changes in the same commit.
 */
export default function DeleteAccountPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="mb-4">
          <Button asChild variant="link" className="pl-0 text-muted-foreground">
            <Link href="/settings">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Settings
            </Link>
          </Button>
        </div>

        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
          Delete your account
        </h1>
        <p className="mt-3 text-muted-foreground">
          This page deletes your {siteConfig.name} account and the data attached
          to it. It works from the website and from inside the mobile app
          (Settings → Account → Delete your account).
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            What gets deleted
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Your account.</strong> The
              sign-in record itself, including your email address.
            </li>
            <li>
              <strong className="text-foreground">Every message you sent</strong>{' '}
              while signed in, including any attached song or drawing.
            </li>
            <li>
              <strong className="text-foreground">Every review you wrote.</strong>
            </li>
            <li>
              <strong className="text-foreground">
                Local data on your device
              </strong>{' '}
              — favorites, collections, the names you follow, your search
              history, your profile picture and the offline cache.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            What is not deleted
          </h2>
          <p className="text-sm text-muted-foreground">
            Messages you sent <em>without</em> being signed in are not linked to
            any account, so there is no record connecting them to you and no way
            for us to find them on your behalf. If you know the link to one, you
            can report it from its own page and we will remove it.
          </p>
          <p className="text-sm text-muted-foreground">
            We also cannot reach copies other people already have. Messages on
            this site are public, so someone may have screenshotted or shared one
            as an image before you deleted it. Nothing here can recall those.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            How long it takes
          </h2>
          <p className="text-sm text-muted-foreground">
            Immediately. Deletion happens while you wait and is not queued for
            review. There is no grace period and no undo, so be sure before you
            confirm.
          </p>
        </section>

        <DeleteAccountClient />

        <section className="mt-10 space-y-2 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground">
            If you cannot sign in
          </h2>
          <p className="text-sm text-muted-foreground">
            Email{' '}
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=Account%20deletion%20request`}
              className="underline hover:text-foreground"
            >
              {siteConfig.contactEmail}
            </a>{' '}
            from the address on the account, with &ldquo;Account deletion
            request&rdquo; as the subject. We will confirm and delete it for you.
          </p>
        </section>
      </div>
    </div>
  );
}
