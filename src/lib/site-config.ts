/**
 * Central site / compliance configuration.
 *
 * Every deployment-specific value is read from an environment variable with a
 * production default, so nothing here is a secret and nothing is invented.
 *
 * Environment variables (on Hostinger: hPanel → your Node.js app → Environment
 * variables, or a .env file next to package.json on the server. NEXT_PUBLIC_*
 * values are inlined at build time, so rebuild after changing them):
 *
 *   NEXT_PUBLIC_SITE_URL          canonical origin, no trailing slash
 *   NEXT_PUBLIC_ADSENSE_CLIENT_ID AdSense publisher id, format "ca-pub-XXXXXXXXXXXXXXXX".
 *                                 Leave UNSET to disable all ad code and the
 *                                 google-adsense-account meta tag.
 *   NEXT_PUBLIC_CONTACT_EMAIL     public contact address
 *   NEXT_PUBLIC_SITE_OPERATOR     the natural person / entity operating the site
 *                                 Leave UNSET to disable country/city analytics.
 */

/**
 * Accepts "messageinabottle.sbs", "https://messageinabottle.sbs/" and the like.
 * A bare domain with no scheme is what hosting panels tend to get pasted in,
 * and `new URL()` (metadataBase, canonicals) throws on it. Mirrors
 * `normalizeSiteUrl` in next.config.ts — keep the two in step.
 */
function normalizeSiteUrl(raw: string | undefined): string {
  const fallback = 'https://messageinabottle.sbs';
  const value = (raw ?? '').trim();
  if (!value) return fallback;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: 'Message in a Bottle',
  shortName: 'MiaB',
  /** Canonical origin. The www host 308-redirects here (see next.config.ts). */
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  description:
    'Write an anonymous message, address it to a name, and it drifts into a public ocean of letters that anyone can read.',
  /** The individual who builds and operates the site. */
  operator: process.env.NEXT_PUBLIC_SITE_OPERATOR || 'Mike Fernandez',
  /** Jurisdiction whose law governs the Terms. */
  jurisdiction: 'Republic of the Philippines',
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'mikefernandex227@gmail.com',
  social: {
    tiktok: 'https://www.tiktok.com/@dvbmke',
    instagram: 'https://www.instagram.com/dvbmike',
  },
  /** PayPal link used on the donate page. */
  donateUrl: 'https://paypal.me/MikeFernandez255',
} as const;

// ── AdSense ──────────────────────────────────────────────────────────────────

/**
 * AdSense publisher id.
 *
 * The default is this site's own, already-public publisher id — it is printed
 * in /ads.txt and in the page source of every live page, so it is not a secret
 * and nothing is invented here. Keeping it as the default means an unset
 * environment variable cannot silently drop the site's existing AdSense
 * verification. Override it per-environment with NEXT_PUBLIC_ADSENSE_CLIENT_ID,
 * or set that variable to "none" to disable ad code entirely (useful for
 * previews and staging).
 */
const RAW_ADSENSE_CLIENT_ID = (
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? 'ca-pub-2857031207812866'
).trim();

export const ADSENSE_CLIENT_ID =
  RAW_ADSENSE_CLIENT_ID && RAW_ADSENSE_CLIENT_ID !== 'none'
    ? RAW_ADSENSE_CLIENT_ID
    : undefined;

/** True only when a syntactically valid publisher id is configured. */
export const isAdsenseConfigured = Boolean(
  ADSENSE_CLIENT_ID && /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT_ID)
);

/**
 * Ad slot ids, supplied per-unit from the AdSense dashboard. A slot that is not
 * configured renders nothing — no empty container, no placeholder.
 */
export const AD_SLOTS = {
  browseFeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BROWSE_FEED?.trim() || undefined,
  messageBelow: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MESSAGE_BELOW?.trim() || undefined,
  aboutFooter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ABOUT_FOOTER?.trim() || undefined,
  guideArticle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE_ARTICLE?.trim() || undefined,
} as const;

// ── Legal document dates ─────────────────────────────────────────────────────
// Static, so the "last updated" line reflects when the text actually changed
// rather than today's date. Update by hand when you edit a policy.

export const POLICY_LAST_UPDATED = 'November 6, 2026';

// ── Analytics ────────────────────────────────────────────────────────────────

/** Country/city visit analytics only run when a geo key is configured. */
