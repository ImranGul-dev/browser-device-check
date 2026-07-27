# Implementation Decisions

Last updated: July 28, 2026

## Source hierarchy

The complete SEO, content, technical, privacy, accessibility, and AdSense specification is the functional source of truth. The UI design system controls visual choices. Privacy, security, browser behavior, accessibility, and honest technical limitations take priority over visual convenience.

## Browser-only architecture

The project uses static Astro output and React islands. No database, authentication, API route, custom backend, server endpoint, serverless function, media upload, background worker, cron job, cloud result history, or server-managed session is included.

## Final identity

- Site name: Browser Device Check
- Canonical origin: https://browserdevicecheck.com
- Publisher: Imran Gul
- Public contact email: gulimran980@gmail.com
- No country or public address is displayed
- The Terms do not designate an exclusive governing law or court

## Contact form

The Contact page uses a normal HTML POST to FormSubmit. This preserves static hosting and avoids a custom backend. FormSubmit processing, anti-spam behavior, activation, and stated 30-day submission retention are disclosed. The form does not accept file uploads.

## Optional integrations

Advertising, analytics, and the site-wide consent platform are disabled at launch. This keeps the core website functional without nonessential tracking. If AdSense is enabled later, the project requires the real publisher ID, updated disclosures, approved ad placements, and a Google-certified CMP where required.

## Keyboard test

Space, arrows, navigation keys, and F1-F12 are prevented from performing normal page actions while the bounded test has focus where browsers permit. Tab remains available for navigation and Escape exits. Browser- or operating-system-reserved shortcuts are explained rather than treated as hardware failures.

## Dead Pixel Test

The tool is a manual visual inspection aid. It never claims automatic detection. After all screens, visitors record what they observed and receive a user-confirmed result with next steps.

## Accessibility

The target is WCAG 2.2 Level AA, not certification. The permanent invalid `tabindex` was removed from `<main>`. Controls use native elements, focus is visible, state meaning does not depend on color, and immersive tests retain exit paths.

## Legal position

The legal pages are practical starting terms and disclosures, not legal advice. They avoid claiming a country, public address, exclusive governing law, court that the publisher did not provide.
