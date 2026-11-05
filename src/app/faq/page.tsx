import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { DAILY_SEND_LIMIT } from '@/lib/rate-limit';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'How Message in a Bottle works: who can read your message, whether it is really anonymous, how to delete or report a message, and more.',
  alternates: { canonical: `${siteConfig.url}/faq` },
  openGraph: {
    title: 'FAQ — Message in a Bottle',
    description:
      'Who can read your message, whether it is anonymous, and how to delete or report one.',
    url: `${siteConfig.url}/faq`,
    siteName: siteConfig.name,
    type: 'website',
  },
};

/**
 * Every answer here must stay true to the code, the Terms and the Privacy
 * Policy. If you change how sending, deletion or reporting works, update this
 * page in the same commit.
 *
 * `answer` is plain text for the JSON-LD; `body` is what renders, and may add
 * links. Keep the two saying the same thing.
 */
const FAQS: { question: string; answer: string; body?: React.ReactNode }[] = [
  {
    question: 'What is Message in a Bottle?',
    answer:
      'A free website where you write an anonymous note, address it to a first name, and release it into a public “ocean” of letters that anyone can browse and read. It is a place for the things you cannot say out loud: thank-yous, apologies, confessions and goodbyes.',
  },
  {
    question: 'Will the person I write to receive my message?',
    answer:
      'No. Nothing is sent to anyone. The name you type only decides which bottle the message is filed under. After sending you get a link, and it is entirely up to you whether to share that link with the person.',
  },
  {
    question: 'Who can read my message?',
    answer:
      'Everyone. Every message is public and can be found by browsing or by opening the bottle for that name. Treat it like a note pinned to a public noticeboard, and leave out surnames, addresses, schools, workplaces and anything else that would identify a real person.',
  },
  {
    question: 'Is it really anonymous?',
    answer:
      'Readers never see who wrote a message. If you are signed in, your messages are linked to your account privately so that you can edit or delete them, but that link is never shown to anyone. Like any website, the site keeps the minimum technical data it needs to run and stay safe, which the Privacy Policy describes in full. Remember that your own words can identify you, even without a name.',
    body: (
      <>
        Readers never see who wrote a message. If you are signed in, your
        messages are linked to your account privately so that you can edit or
        delete them, but that link is never shown to anyone. Like any website,
        the site keeps the minimum technical data it needs to run and stay
        safe, which the{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>{' '}
        describes in full. Remember that your own words can identify you, even
        without a name.
      </>
    ),
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. You can write, browse and read without signing up. Creating an account is optional and lets you see, edit and delete the messages you sent while signed in.',
  },
  {
    question: 'Can I edit or delete a message after sending it?',
    answer:
      'If you were signed in when you sent it, yes, from your History page. If you sent it without an account, nothing connects the message to you, so you cannot remove it yourself. Contact us with the message link and it will be removed.',
    body: (
      <>
        If you were signed in when you sent it, yes, from your History page. If
        you sent it without an account, nothing connects the message to you,
        so you cannot remove it yourself.{' '}
        <Link href="/contact" className="underline hover:text-foreground">
          Contact us
        </Link>{' '}
        with the message link and it will be removed.
      </>
    ),
  },
  {
    question: 'What is a time capsule message?',
    answer:
      'When you write a message you can choose a date for it to open. Until then, readers see a countdown instead of the text. On the chosen day the message becomes readable like any other.',
  },
  {
    question: 'Is there a limit on how many messages I can send?',
    answer: `Yes. Each browser can send up to ${DAILY_SEND_LIMIT} messages in a 24-hour period. The limit keeps the ocean readable and makes spam harder.`,
  },
  {
    question: 'What is not allowed?',
    answer:
      'Harassment, threats, hate speech, any sexual content involving minors, sharing someone’s private information or intimate images, impersonation, spam and advertising. Messages that break the rules are removed. The full list is in the Terms of Service.',
    body: (
      <>
        Harassment, threats, hate speech, any sexual content involving minors,
        sharing someone&apos;s private information or intimate images,
        impersonation, spam and advertising. Messages that break the rules are
        removed. The full list is in the{' '}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>
        .
      </>
    ),
  },
  {
    question: 'I found a message about me. How do I get it removed?',
    answer:
      'Use the Report button on the message, or write through the contact page with the link. You do not need an account and you do not need to prove who you are. If you are in danger, contact your local police as well.',
    body: (
      <>
        Use the Report button on the message, or write through the{' '}
        <Link href="/contact" className="underline hover:text-foreground">
          contact page
        </Link>{' '}
        with the link. You do not need an account and you do not need to prove
        who you are. If you are in danger, contact your local police as well.
      </>
    ),
  },
  {
    question: 'Why are there ads?',
    answer:
      'The site is free and run by one person. Advertising from Google AdSense, along with occasional donations, pays for hosting. Ads are personalised only if you allow it in the cookie settings.',
  },
  {
    question: 'I do not know what to write. Where do I start?',
    answer:
      'Start with one person and one thing you never said to them. The Guides section has step-by-step advice on unsent letters, apologies and goodbyes, and a list of writing prompts.',
    body: (
      <>
        Start with one person and one thing you never said to them. The{' '}
        <Link href="/guides" className="underline hover:text-foreground">
          Guides
        </Link>{' '}
        section has step-by-step advice on unsent letters, apologies and
        goodbyes, and a{' '}
        <Link
          href="/guides/anonymous-message-writing-prompts"
          className="underline hover:text-foreground"
        >
          list of writing prompts
        </Link>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
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
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          The short version of how the site works. For everything else, the{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>{' '}
          have the detail.
        </p>

        <div className="mt-10 space-y-8">
          {FAQS.map((f) => (
            <section key={f.question}>
              <h2 className="text-lg font-semibold tracking-tight">{f.question}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {f.body ?? f.answer}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
