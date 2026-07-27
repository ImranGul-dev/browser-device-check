# Browser Device Check

A complete privacy-first, browser-only device-testing website for **https://browserdevicecheck.com**.

## Architecture

- Astro static output
- React islands only for interactive tools
- TypeScript strict mode
- Tailwind CSS 4 through Vite
- Browser Web APIs
- Static hosting compatible with Netlify and other static hosts
- No login, database, custom backend, API routes, serverless functions, or media uploads

## Included tools

1. Webcam Test
2. Microphone Test
3. Speaker Test
4. Keyboard Test
5. Mouse Test
6. Touchscreen Test
7. Dead Pixel Test
8. Complete Device Check
9. Screen Resolution Test
10. Refresh Rate Test
11. Browser Information Test
12. Gamepad Controller Test

## Local setup

```bash
npm install
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`.

## Production build

```bash
npm run build
```

Upload the generated `dist` folder to a static host, or connect the repository to Netlify.
The production defaults already use:

- Site name: Browser Device Check
- Domain: https://browserdevicecheck.com
- Publisher: Imran Gul
- Contact email: gulimran980@gmail.com

## Contact form activation

The Contact page uses FormSubmit and does not require a custom backend.

After the site is live:

1. Open `https://browserdevicecheck.com/contact/`.
2. Send one test message.
3. Open the activation email sent by FormSubmit to `gulimran980@gmail.com`.
4. Click the confirmation link.
5. Submit the form again and confirm that the message arrives.
6. Check the spam folder if the activation or form email is missing.

FormSubmit states that submissions may be retained for 30 days. The Privacy and Cookie policies disclose this external processing.

## Launch configuration

Advertising, analytics, and the site-wide consent platform are disabled by default. This is the safest launch configuration. The browser-local tools continue to work without them.

Do not enable AdSense until the live site is fully tested and approved. When AdSense is enabled, configure the real publisher ID, required consent setup, updated policies, and approved manual ad placements.

## Quality checks

```bash
npm run test:architecture
npm run test:links
npm run check
npm run lint
npm run format:check
npm run test:unit
npm run build
npm run test:dist
npx playwright install chromium
npm run test:e2e
```

Or run the combined command:

```bash
npm run qa
```

Real camera, microphone, speaker, touchscreen, gamepad, fullscreen, and cross-browser checks still require representative hardware and browsers.
