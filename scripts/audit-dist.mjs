import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = join(root, 'dist');
const failures = [];
const expectedHtml = [
  'index.html',
  'webcam-test/index.html',
  'microphone-test/index.html',
  'speaker-test/index.html',
  'keyboard-test/index.html',
  'mouse-test/index.html',
  'touchscreen-test/index.html',
  'dead-pixel-test/index.html',
  'screen-resolution/index.html',
  'refresh-rate-test/index.html',
  'browser-info/index.html',
  'gamepad-test/index.html',
  'device-check/index.html',
  'guides/index.html',
  'guides/camera-microphone-permissions/index.html',
  'guides/test-camera-microphone-before-interview/index.html',
  'guides/webcam-not-working/index.html',
  'guides/microphone-not-working/index.html',
  'about/index.html',
  'contact/index.html',
  'contact/thanks/index.html',
  'accessibility/index.html',
  'privacy-policy/index.html',
  'cookie-policy/index.html',
  'terms-and-conditions/index.html',
  '404.html',
];

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

for (const file of expectedHtml) {
  try {
    const html = await readFile(join(dist, file), 'utf8');
    if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) {
      failures.push(`${file} must contain exactly one h1.`);
    }
    if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) {
      failures.push(`${file} is missing a non-empty meta description.`);
    }
    if (!/<link\s+rel="canonical"\s+href="https?:\/\/[^\"]+"/i.test(html)) {
      failures.push(`${file} is missing an absolute canonical URL.`);
    }
    if (/\{\{[A-Z0-9_]+\}\}/.test(html)) failures.push(`${file} contains a placeholder.`);
    if (/"@type":"(?:FAQPage|HowTo|AggregateRating|Review|Offer)"/.test(html)) {
      failures.push(`${file} contains prohibited launch structured data.`);
    }
    if (!['404.html', 'contact/thanks/index.html'].includes(file) && !/application\/ld\+json/.test(html)) {
      failures.push(`${file} is missing page-appropriate JSON-LD.`);
    }
    if (['404.html', 'contact/thanks/index.html'].includes(file) && !/noindex,\s*follow/.test(html)) {
      failures.push(`${file} must be noindex, follow.`);
    }
  } catch {
    failures.push(`Missing built page: ${file}`);
  }
}

for (const staticFile of ['robots.txt', 'ads.txt', '_headers', '_redirects', 'favicon.svg', 'site.webmanifest', 'og/default.png']) {
  try {
    await stat(join(dist, staticFile));
  } catch {
    failures.push(`Missing built static file: ${staticFile}`);
  }
}

const builtFiles = await walk(dist);
for (const file of builtFiles) {
  const rel = relative(dist, file);
  if (/\.(?:cjs|mjs|ts|tsx)$/.test(rel) && !rel.startsWith('_astro/')) {
    failures.push(`Unexpected server/source file in dist: ${rel}`);
  }
}

if (failures.length) {
  console.error('Built-site audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Built-site audit passed for ${expectedHtml.length} HTML files.`);
