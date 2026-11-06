
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

/**
 * Tolerates a bare domain ("messageinabottle.sbs") as well as a full origin.
 * Hosting panels often get the value pasted without a scheme, and `new URL()`
 * throws on that, which fails the whole build. Mirrors normalizeSiteUrl in
 * src/lib/site-config.ts.
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

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  extendManifest: (manifest) => {
    manifest.theme_color = '#ffffff';
    manifest.background_color = '#ffffff';
    manifest.display = 'standalone';
    manifest.orientation = 'portrait';
    manifest.scope = '/';
    manifest.start_url = '/';
    manifest.icons = [
      ...(manifest.icons || []),
      {
        src: 'https://image2url.com/images/1766464071847-041ccf8f-4b13-4f01-883e-3357567042c4.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ];
    return manifest;
  },
});

const nextConfig: NextConfig = {
  // ── Hostinger ───────────────────────────────────────────────────────────────
  // Hostinger's Node.js publisher reports "Detected Next.js standalone server
  // output" and runs .next/standalone/server.js. Without this option that file
  // never existed, the app never started, and every request timed out at the
  // CDN (504). `next start` still works locally and on other hosts.
  output: 'standalone',
  // Pin tracing to this folder. Otherwise Next infers the root from any
  // package-lock.json higher up the disk, and server.js lands in a nested
  // path such as .next/standalone/mike-project/message-in-a-bottle/server.js.
  outputFileTracingRoot: process.cwd(),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ── Canonical host ──────────────────────────────────────────────────────────
  // Both www and apex were answering 200, so every page existed at two URLs.
  // All canonical tags, the sitemap and ads.txt point at the apex, so www is
  // redirected there permanently. (Vercel can also do this at the domain level;
  // keeping it here means the rule travels with the code.)
  async redirects() {
    const host = new URL(normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)).host;

    return [
      {
        // Everything except Google's verification files.
        //
        // Search Console fetches googleXXXX.html directly and treats a
        // redirect as a failure, so a www-host property could never verify
        // while this rule swallowed it. The negative lookahead lets that one
        // filename through on both hosts; everything else still lands on the
        // apex. Keep it even after verification succeeds — Google re-checks
        // the file periodically.
        source: '/:path((?!google[0-9a-f]+\\.html$).*)',
        has: [{ type: 'host', value: `www.${host}` }],
        destination: `https://${host}/:path`,
        permanent: true,
      },
    ];
  },

  // ── HTTP headers ────────────────────────────────────────────────────────────
  async headers() {
    return [
      // Baseline security headers on every response.
      //
      // No Content-Security-Policy is set here on purpose: AdSense injects
      // scripts, frames and images from a wide and changing set of Google
      // origins, and a CSP tightened by guesswork would silently break ad
      // serving. See ADSENSE-READINESS.md for how to roll one out in
      // report-only mode first.
      {
        source: '/:path*',
        headers: [
          // Stop browsers from MIME-sniffing a response into something else.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Send only the origin cross-site, keep full path same-origin.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here needs camera, mic or geolocation.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Clickjacking protection. SAMEORIGIN rather than DENY so ad and
          // Spotify iframes keep working.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Immutable static assets (Next.js hashes filenames — safe to cache forever)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets: icons, manifest, images — version via filename if needed
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'toppng.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image2url.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
