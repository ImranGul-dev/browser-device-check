import { writeFile } from 'node:fs/promises';

const origin = (process.env.PUBLIC_SITE_ORIGIN || 'https://browserdevicecheck.com').replace(/\/$/, '');
const enableAds = process.env.PUBLIC_ENABLE_ADS === 'true';
const publisher = process.env.PUBLIC_ADSENSE_PUBLISHER_ID || '';
const lifecycle = process.env.npm_lifecycle_event || '';
const siteEnvironment =
  process.env.PUBLIC_SITE_ENV ||
  (process.env.CONTEXT === 'production'
    ? 'production'
    : lifecycle === 'predev'
      ? 'development'
      : 'production');
const isProduction = siteEnvironment === 'production';

const sitemapLine = isProduction ? `\nSitemap: ${origin}/sitemap-index.xml\n` : '';
await writeFile(
  new URL('../public/robots.txt', import.meta.url),
  `User-agent: *\nAllow: /\nDisallow: /contact/thanks/\n${sitemapLine}`,
);

const adsText =
  enableAds && publisher
    ? `google.com, ${publisher.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : '# Advertising is disabled. No authorized sellers are declared.\n';
await writeFile(new URL('../public/ads.txt', import.meta.url), adsText);

const robotsHeader = isProduction ? '' : '  X-Robots-Tag: noindex, nofollow\n';
const headers = `/*
${robotsHeader}  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), midi=()
  Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self' https://formsubmit.co; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/og/*
  Cache-Control: public, max-age=604800
`;
await writeFile(new URL('../public/_headers', import.meta.url), headers);
