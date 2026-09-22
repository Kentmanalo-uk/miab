import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
} from 'obscenity';

/**
 * Profanity screening for messages and recipient names.
 *
 * Built on `obscenity`, which matters because a plain word list is trivially
 * defeated: it catches `f*ck`, `fuuuck`, `ph uck` and `g4g0` as well as the
 * plain spelling, and it does word-boundary matching so "Scunthorpe",
 * "assassin", "classic", "analysis" and "reputation" come through clean.
 *
 * ── Filipino terms are not optional here ──
 *
 * The English dataset alone would be close to useless for this site. The
 * audience writes in Tagalog and Bisaya, so the strong local profanity is added
 * below. Without it the filter would look like it worked while letting through
 * the words people actually use.
 *
 * ── What is deliberately NOT blocked ──
 *
 * Mild insults — tanga, bobo, lintik, bwisit — are left out. This is an app for
 * heartfelt notes between people who know each other, and "bobo mo talaga" is
 * usually affection. Blocking them would reject more real letters than abuse.
 * Add them to STRONG_FILIPINO below if you decide otherwise.
 *
 * ── The honest limit of this ──
 *
 * This runs on the client, on the website and in the app. It stops the messages
 * that a normal person would send, and it stops them before they are ever
 * written. It is NOT enforcement: anyone who can reach the Firestore API
 * directly can write whatever they like, because the security rules do not
 * check content. Closing that needs a Cloud Function on write, or App Check.
 * Do not describe this as moderation-proof anywhere user-facing.
 *
 * One known gap, measured rather than assumed: single-letter spacing —
 * "p u n y e t a" — gets through. obscenity's word-boundary assertions and its
 * skip-non-alphabetic transformer cannot both apply to the same pattern, and
 * boundaries are the more valuable of the two here. Stripping spaces before
 * matching was tried and rejected: it turns "I will put a letter in the post"
 * into a match for "puta", and blocking real letters is worse than missing a
 * determined evasion that a human reviewer can still catch via the report
 * button.
 */

/**
 * Strong profanity in Tagalog and Bisaya.
 *
 * `|word|` asserts a word boundary on both sides. That is required for the
 * short ones: without it "puta" matches "reputation" and "amputate", and "yawa"
 * matches nothing useful at all once it is inside another word.
 *
 * Terms written without boundaries are ones that cannot appear inside an
 * innocent word, so they stay catchable even when run together with what
 * follows — "tanginamo" being the common case.
 */
const STRONG_FILIPINO = [
  // Boundary-sensitive: real substrings of innocent English or Spanish words.
  pattern`|puta|`,
  pattern`|putang|`,
  pattern`|gago|`,
  pattern`|gaga|`,
  pattern`|yawa|`,
  pattern`|pisti|`,
  pattern`|bilat|`,
  pattern`|kantot|`,
  pattern`|iyot|`,
  pattern`|tite|`,
  pattern`|pekpek|`,
  pattern`|burat|`,

  // Unambiguous: these strings do not occur inside ordinary words, so they are
  // matched anywhere and survive being jammed against the next word.
  pattern`putangina`,
  pattern`putanginamo`,
  pattern`tangina`,
  pattern`tang ina`,
  pattern`kingina`,
  pattern`kinginamo`,
  pattern`tarantado`,
  pattern`punyeta`,
  pattern`hinayupak`,
  pattern`hayupak`,
  pattern`pakshet`,
  pattern`pokpok`,
  pattern`siraulo`,
  // Bounded after testing showed the unbounded forms firing on "kupalan",
  // "ulolan" and "bugoy". Rare inflections are worth losing to keep ordinary
  // words out of the filter.
  pattern`|kupal|`,
  pattern`|ulol|`,
  pattern`|bugok|`,
  pattern`peste ka`,
  pattern`anak ng puta`,
  pattern`putragis`,
];

/**
 * Built once at module load.
 *
 * `RegExpMatcher` compiles the whole dataset, which is not free; rebuilding it
 * per keystroke in a form would be noticeable.
 */
const matcher = new RegExpMatcher({
  ...(() => {
    let set = new DataSet<{ originalWord: string }>().addAll(englishDataset);
    for (const p of STRONG_FILIPINO) {
      set = set.addPhrase((phrase) => phrase.addPattern(p));
    }
    return set.build();
  })(),
  ...englishRecommendedTransformers,
});

/**
 * Ordinary words that contain a profanity as a substring.
 *
 * Every entry here was found by testing, not guessed: the filter really did
 * reject "cockpit", "shiitake", "mishit", "Dickinson" and "Penistone". They are
 * blanked out before matching, so the innocent word is invisible to the filter
 * while the rest of the sentence is still screened.
 */
const INNOCENT_WORDS =
  /\b(cockpits?|cockroach(es)?|cocktails?|peacocks?|shuttlecocks?|woodcocks?|cockatoos?|cockles?|cockney|cockerels?|mishits?|mishitting|shiitakes?|shitakes?|penistone|dickinson|dickens|scunthorpe|lightwater|clitheroe|assington|sussex|middlesex|essex|analy[sz]e[sd]?|analysis)\b/gi;

/** True when the text contains profanity the app refuses to publish. */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  try {
    return matcher.hasMatch(text.replace(INNOCENT_WORDS, ' '));
  } catch {
    // A matcher failure must never block a legitimate send. Failing open is
    // the right trade for a filter that is a courtesy, not a security control.
    return false;
  }
}

export interface ModerationResult {
  ok: boolean;
  /**
   * Which field failed, so the form can point at it. Never the matched word
   * itself — telling someone exactly which term tripped the filter is a recipe
   * for teaching them how to get around it.
   */
  field?: 'message' | 'recipient';
  reason?: string;
}

/**
 * Screens a whole message before it is written.
 *
 * The recipient name is checked as well as the body, and that is not an
 * afterthought: recipient names are the one piece of user text rendered on the
 * public browse list, so an unchecked one is profanity on the front page.
 */
export function screenMessage(
  content: string,
  recipient: string
): ModerationResult {
  if (containsProfanity(recipient)) {
    return {
      ok: false,
      field: 'recipient',
      reason: 'Please use a real name here.',
    };
  }
  if (containsProfanity(content)) {
    return {
      ok: false,
      field: 'message',
      reason:
        'This message contains language the site does not publish. Please reword it.',
    };
  }
  return { ok: true };
}

/**
 * Whether an already-stored message is fit to display.
 *
 * Used to hide anything written before this filter existed, or written by
 * something that bypassed the form. Hiding rather than deleting is deliberate:
 * a false positive that hides a letter is a bug someone can report and I can
 * fix, while a false positive that deletes one has destroyed something a person
 * wrote and cannot be undone.
 */
export function isDisplayable(message: {
  content?: string;
  recipient?: string;
}): boolean {
  return (
    !containsProfanity(message.content ?? '') &&
    !containsProfanity(message.recipient ?? '')
  );
}
