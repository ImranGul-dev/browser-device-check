import process from 'node:process';

const lifecycle = process.env.npm_lifecycle_event || '';
const siteEnvironment =
  process.env.PUBLIC_SITE_ENV ||
  (process.env.CONTEXT === 'production'
    ? 'production'
    : lifecycle === 'prebuild'
      ? 'production'
      : 'development');

if (siteEnvironment !== 'production') {
  console.log('Production identity validation skipped for a non-production build.');
  process.exit(0);
}

const values = {
  PUBLIC_SITE_ORIGIN: process.env.PUBLIC_SITE_ORIGIN || 'https://browserdevicecheck.com',
  PUBLIC_SITE_NAME: process.env.PUBLIC_SITE_NAME || 'Browser Device Check',
  PUBLIC_PUBLISHER_NAME: process.env.PUBLIC_PUBLISHER_NAME || 'Imran Gul',
  PUBLIC_SUPPORT_EMAIL: process.env.PUBLIC_SUPPORT_EMAIL || 'gulimran980@gmail.com',
  PUBLIC_PRIVACY_EMAIL: process.env.PUBLIC_PRIVACY_EMAIL || 'gulimran980@gmail.com',
  PUBLIC_LEGAL_EMAIL: process.env.PUBLIC_LEGAL_EMAIL || 'gulimran980@gmail.com',
  PUBLIC_ACCESSIBILITY_EMAIL:
    process.env.PUBLIC_ACCESSIBILITY_EMAIL || 'gulimran980@gmail.com',
  PUBLIC_FORMSUBMIT_ENDPOINT:
    process.env.PUBLIC_FORMSUBMIT_ENDPOINT || 'https://formsubmit.co/gulimran980@gmail.com',
};

const missing = Object.entries(values)
  .filter(([, value]) => !value.trim())
  .map(([name]) => name);
if (missing.length) {
  console.error(`Production build blocked. Configure: ${missing.join(', ')}`);
  process.exit(1);
}

if (!values.PUBLIC_SITE_ORIGIN.startsWith('https://') || values.PUBLIC_SITE_ORIGIN.includes('.example')) {
  console.error('PUBLIC_SITE_ORIGIN must be the final non-example HTTPS origin.');
  process.exit(1);
}

const emails = [
  values.PUBLIC_SUPPORT_EMAIL,
  values.PUBLIC_PRIVACY_EMAIL,
  values.PUBLIC_LEGAL_EMAIL,
  values.PUBLIC_ACCESSIBILITY_EMAIL,
];
if (emails.some((email) => email.endsWith('.example') || !email.includes('@'))) {
  console.error('Production contact addresses must be valid and cannot use .example.');
  process.exit(1);
}

if (!values.PUBLIC_FORMSUBMIT_ENDPOINT.startsWith('https://formsubmit.co/')) {
  console.error('PUBLIC_FORMSUBMIT_ENDPOINT must use the approved FormSubmit HTTPS endpoint.');
  process.exit(1);
}

console.log('Production identity and contact configuration are valid.');
console.log('Advertising, analytics, and consent remain disabled unless explicitly enabled.');
