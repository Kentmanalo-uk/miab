'use client';

import { Analytics } from '@vercel/analytics/next';
import { useConsent } from '@/components/ConsentProvider';

/**
 * Vercel Analytics only exists on Vercel. The site is hosted on Hostinger,
 * where the script path (/_vercel/insights/script.js) does not exist and every
 * page view after consent would fire a 404. Vercel inlines
 * NEXT_PUBLIC_VERCEL_ENV into its own builds automatically; anywhere else it is
 * unset at build time and this component never renders.
 */
const IS_VERCEL_BUILD = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

/**
 * Mounted only after the visitor opts into the analytics category. Before that
 * the script is never injected, so no page view is recorded and no identifier
 * is stored.
 */
export function GatedAnalytics() {
  const { analyticsAllowed } = useConsent();
  if (!IS_VERCEL_BUILD || !analyticsAllowed) return null;
  return <Analytics />;
}
