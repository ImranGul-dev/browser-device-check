import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const knownRoutes = new Set([
  '/',
  '/webcam-test/',
  '/microphone-test/',
  '/speaker-test/',
  '/keyboard-test/',
  '/mouse-test/',
  '/touchscreen-test/',
  '/dead-pixel-test/',
  '/screen-resolution/',
  '/refresh-rate-test/',
  '/browser-info/',
  '/gamepad-test/',
  '/device-check/',
  '/guides/',
  '/guides/camera-microphone-permissions/',
  '/guides/test-camera-microphone-before-interview/',
  '/guides/webcam-not-working/',
  '/guides/microphone-not-working/',
  '/about/',
  '/contact/',
  '/contact/thanks/',
  '/accessibility/',
  '/privacy-policy/',
  '/cookie-policy/',
  '/terms-and-conditions/',
  '/terms/',
  '/404.html',
]);

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

const failures = [];
for (const file of await walk(sourceRoot)) {
  if (!/\.(?:astro|tsx?|md|mdx)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  const candidates = new Set();
  const patterns = [
    /href=["'](\/[^"'#?]*\/?)(?:[?#][^"']*)?["']/g,
    /href:\s*["'](\/[^"'#?]*\/?)(?:[?#][^"']*)?["']/g,
    /\]\((\/[^)#?]*\/?)(?:[?#][^)]*)?\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) candidates.add(match[1]);
  }
  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith('/og/') || candidate.startsWith('/favicon') || candidate.endsWith('.png') || candidate.endsWith('.svg') || candidate.endsWith('.webmanifest')) continue;
    const normalized = candidate === '/' || candidate.endsWith('/') || candidate.endsWith('.html')
      ? candidate
      : `${candidate}/`;
    if (!knownRoutes.has(normalized)) {
      failures.push(`${relative(root, file)} links to unknown internal route ${candidate}`);
    }
  }
}

if (failures.length) {
  console.error('Internal-link audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Internal-link audit passed.');
