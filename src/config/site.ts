const envString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const origin = envString(import.meta.env.PUBLIC_SITE_ORIGIN, 'https://browserdevicecheck.com');
const contactEmail = envString(import.meta.env.PUBLIC_SUPPORT_EMAIL, 'gulimran980@gmail.com');

export const siteConfig = {
  name: envString(import.meta.env.PUBLIC_SITE_NAME, 'Browser Device Check'),
  shortName: envString(import.meta.env.PUBLIC_SITE_SHORT_NAME, 'Browser Device Check'),
  description:
    'Free privacy-first browser tests for webcams, microphones, speakers, keyboards, mice, touchscreens, displays, browsers, controllers, and pre-call readiness.',
  origin,
  publisherName: envString(import.meta.env.PUBLIC_PUBLISHER_NAME, 'Imran Gul'),
  publisherType: 'Person',
  supportEmail: contactEmail,
  privacyEmail: envString(import.meta.env.PUBLIC_PRIVACY_EMAIL, contactEmail),
  legalEmail: envString(import.meta.env.PUBLIC_LEGAL_EMAIL, contactEmail),
  accessibilityEmail: envString(import.meta.env.PUBLIC_ACCESSIBILITY_EMAIL, contactEmail),
  formSubmitEndpoint: envString(
    import.meta.env.PUBLIC_FORMSUBMIT_ENDPOINT,
    'https://formsubmit.co/gulimran980@gmail.com',
  ),
  responseTime: '3-5 business days',
  reviewedDate: 'July 28, 2026',
  updatedDate: 'July 28, 2026',
  enableAds: import.meta.env.PUBLIC_ENABLE_ADS === 'true',
  enableAnalytics: import.meta.env.PUBLIC_ENABLE_ANALYTICS === 'true',
  enableConsent: import.meta.env.PUBLIC_ENABLE_CONSENT === 'true',
  adsensePublisherId: envString(import.meta.env.PUBLIC_ADSENSE_PUBLISHER_ID),
  isDevelopmentIdentity:
    origin.includes('.example') ||
    [
      contactEmail,
      envString(import.meta.env.PUBLIC_PRIVACY_EMAIL, contactEmail),
      envString(import.meta.env.PUBLIC_LEGAL_EMAIL, contactEmail),
      envString(import.meta.env.PUBLIC_ACCESSIBILITY_EMAIL, contactEmail),
    ].some((value) => value.endsWith('.example')),
} as const;

export const tests = [
  {
    title: 'Webcam Test',
    href: '/webcam-test/',
    description:
      'Preview your camera, check the selected device, and review browser-delivered video information.',
    cta: 'Test My Webcam',
    icon: 'camera',
  },
  {
    title: 'Microphone Test',
    href: '/microphone-test/',
    description:
      'Check input activity, waveform, silence, low input, possible background activity, and clipping.',
    cta: 'Test My Microphone',
    icon: 'mic',
  },
  {
    title: 'Speaker Test',
    href: '/speaker-test/',
    description: 'Play left, right, stereo, speech, and tone samples, then confirm what you hear.',
    cta: 'Test My Speakers',
    icon: 'speaker',
  },
  {
    title: 'Keyboard Test',
    href: '/keyboard-test/',
    description: 'Use an interactive map to check keys, recent input, combinations, and possible repeats.',
    cta: 'Test My Keyboard',
    icon: 'keyboard',
  },
  {
    title: 'Mouse Test',
    href: '/mouse-test/',
    description: 'Check buttons, double clicks, movement, dragging, side buttons, and wheel behavior.',
    cta: 'Test My Mouse',
    icon: 'mouse',
  },
  {
    title: 'Touchscreen Test',
    href: '/touchscreen-test/',
    description: 'Trace a coverage grid, view simultaneous touch points, and retry missed areas.',
    cta: 'Test My Touchscreen',
    icon: 'touch',
  },
  {
    title: 'Dead Pixel Test',
    href: '/dead-pixel-test/',
    description: 'Display colors, OLED dark-gray screens, gradients, and patterns for visual inspection.',
    cta: 'Inspect My Screen',
    icon: 'monitor',
  },
  {
    title: 'Screen Resolution Test',
    href: '/screen-resolution/',
    description:
      'Check browser-reported screen size, viewport dimensions, pixel ratio, orientation, and color depth.',
    cta: 'Check My Display',
    icon: 'resolution',
  },
  {
    title: 'Refresh Rate Test',
    href: '/refresh-rate-test/',
    description:
      'Estimate the browser-observed display refresh rate with a short visible-tab animation sample.',
    cta: 'Estimate Refresh Rate',
    icon: 'gauge',
  },
  {
    title: 'Browser Information Test',
    href: '/browser-info/',
    description:
      'Review browser, secure-context, viewport, and feature-support information used by device tests.',
    cta: 'Check Browser Info',
    icon: 'browser',
  },
  {
    title: 'Gamepad Controller Test',
    href: '/gamepad-test/',
    description:
      'Check connected controller buttons, triggers, sticks, axes, mapping, and optional vibration support.',
    cta: 'Test My Controller',
    icon: 'gamepad',
  },
] as const;

export const guideLinks = [
  {
    title: 'Fix camera and microphone permissions',
    href: '/guides/camera-microphone-permissions/',
  },
  {
    title: 'Prepare for an online interview',
    href: '/guides/test-camera-microphone-before-interview/',
  },
  { title: 'Troubleshoot a webcam', href: '/guides/webcam-not-working/' },
  { title: 'Troubleshoot a microphone', href: '/guides/microphone-not-working/' },
] as const;
