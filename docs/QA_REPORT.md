# QA Report

Date: July 28, 2026

## Included scope

The source includes twelve browser-based tests, the Complete Device Check, four guides, trust and legal pages, the FormSubmit contact form, SEO metadata, structured data, static deployment files, and automated test definitions.

The repair pass includes:

- Space, arrow, navigation, and function-key handling in the active keyboard test where browser behavior permits
- Clear reserved-shortcut limitations
- Dead Pixel Test completion and user-confirmed result flow
- Removal of the invalid permanent `tabindex` from `<main>`
- Corrected ESLint dependency configuration
- Final Browser Device Check identity and canonical domain
- FormSubmit contact form and noindex thank-you page
- Advertising, analytics, and site-wide consent disabled at launch

## Source-level checks

Run before packaging:

```bash
node scripts/generate-static-files.mjs
node scripts/audit-architecture.mjs
node scripts/audit-links.mjs
node --check astro.config.mjs
node --check eslint.config.js
node --check scripts/generate-static-files.mjs
node --check scripts/validate-production-config.mjs
```

## Package-dependent checks

Run on a machine with normal npm registry access and Node 24:

```bash
npm install
npm run qa
```

The generation container could not complete npm registry access, so no package-dependent success is claimed here and no lockfile or test result is fabricated. `npm install` will create `package-lock.json`; commit it before production deployment.

## Required live checks

- Activate FormSubmit by sending the first live message and clicking the confirmation email sent to `gulimran980@gmail.com`.
- Verify message delivery, spam handling, required fields, and the thank-you redirect.
- Test camera and microphone permission allow, deny, dismiss, revoke, retry, and disconnect behavior.
- Test speaker output and user confirmation at a safe volume.
- Test keyboard Space, arrows, navigation keys, F1-F12, Tab, Escape, and reserved shortcuts.
- Test mouse, touch, fullscreen, display, refresh-rate, browser information, and gamepad behavior on representative hardware.
- Test Chrome, Edge, Firefox, Safari where available, Android, iPhone, 200% zoom, reduced motion, and screen readers.
- Verify live HTTPS, redirects, canonical URLs, robots.txt, sitemap, 404 status, and Search Console.
