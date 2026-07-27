import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

function fail(message) {
  failures.push(message);
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};
const prohibitedPackages = [
  'next',
  'nuxt',
  'vue',
  'angular',
  'jquery',
  'bootstrap',
  'express',
  '@astrojs/node',
  '@astrojs/netlify',
  'firebase',
  'supabase',
  'stripe',
  'auth0',
  'next-auth',
  'openai',
];
for (const dependency of prohibitedPackages) {
  if (dependency in allDependencies) fail(`Prohibited dependency present: ${dependency}`);
}

const astroConfig = await readFile(join(root, 'astro.config.mjs'), 'utf8');
if (!/output:\s*['"]static['"]/.test(astroConfig)) {
  fail('astro.config.mjs must explicitly use output: static.');
}
if (/adapter\s*:|@astrojs\/(?:node|netlify|vercel|cloudflare)/.test(astroConfig)) {
  fail('A server adapter or server deployment integration is configured.');
}

const requiredPageFiles = [
  'src/pages/index.astro',
  'src/pages/webcam-test.astro',
  'src/pages/microphone-test.astro',
  'src/pages/speaker-test.astro',
  'src/pages/keyboard-test.astro',
  'src/pages/mouse-test.astro',
  'src/pages/touchscreen-test.astro',
  'src/pages/dead-pixel-test.astro',
  'src/pages/screen-resolution.astro',
  'src/pages/refresh-rate-test.astro',
  'src/pages/browser-info.astro',
  'src/pages/gamepad-test.astro',
  'src/pages/device-check.astro',
  'src/pages/guides/index.astro',
  'src/pages/guides/[...slug].astro',
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'src/pages/contact/thanks.astro',
  'src/pages/accessibility.astro',
  'src/pages/privacy-policy.astro',
  'src/pages/cookie-policy.astro',
  'src/pages/terms-and-conditions.astro',
  'src/pages/404.astro',
];
const requiredGuides = [
  'src/content/guides/camera-microphone-permissions.md',
  'src/content/guides/test-camera-microphone-before-interview.md',
  'src/content/guides/webcam-not-working.md',
  'src/content/guides/microphone-not-working.md',
];
const existing = new Set((await walk(join(root, 'src'))).map((file) => relative(root, file)));
for (const file of [...requiredPageFiles, ...requiredGuides]) {
  if (!existing.has(file)) fail(`Required source file is missing: ${file}`);
}

const pagesDirectory = join(root, 'src/pages');
for (const file of await walk(pagesDirectory)) {
  const rel = relative(root, file);
  if (/src\/pages\/(?:api|actions)\//.test(rel) || /\.(?:ts|js)$/.test(rel)) {
    fail(`Potential server endpoint found: ${rel}`);
  }
}

const sourceFiles = (await walk(join(root, 'src'))).filter((file) =>
  /\.(?:astro|tsx?|jsx?|md|mdx|css)$/.test(file),
);
const forbiddenRuntimePatterns = [
  [/\bfetch\s*\(/, 'network fetch call'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnavigator\.sendBeacon\b/, 'sendBeacon call'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bindexedDB\b/, 'IndexedDB persistence'],
  [/\blocalStorage\b/, 'localStorage persistence'],
  [/\bsessionStorage\b/, 'sessionStorage persistence'],
];
for (const file of sourceFiles) {
  const content = await readFile(file, 'utf8');
  const rel = relative(root, file);
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) fail(`${label} found in ${rel}`);
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(content)) fail(`Unresolved production placeholder found in ${rel}`);
}

const schemaSource = await readFile(join(root, 'src/lib/schema.ts'), 'utf8');
for (const prohibitedSchema of ['FAQPage', 'HowTo', 'AggregateRating', 'Review', 'Offer']) {
  if (schemaSource.includes(`"@type": "${prohibitedSchema}"`)) {
    fail(`Prohibited launch schema type found: ${prohibitedSchema}`);
  }
}

const mediaTools = [
  'src/components/tools/WebcamTest.tsx',
  'src/components/tools/MicrophoneTest.tsx',
  'src/components/tools/DeviceCheck.tsx',
];
for (const file of mediaTools) {
  const content = await readFile(join(root, file), 'utf8');
  if (/getUserMedia\s*\([^)]*\)/s.test(content) && /useEffect\s*\([^,]*getUserMedia/s.test(content)) {
    fail(`Possible permission request on component load in ${file}`);
  }
}

if (failures.length > 0) {
  console.error('Architecture audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture audit passed.');
console.log('- Static Astro output is explicit.');
console.log('- No server adapter, API route, prohibited dependency, upload transport, or browser persistence API was found.');
console.log('- Required launch pages, tools, guides, and schema safeguards are present.');
