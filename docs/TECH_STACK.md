# Technical Stack

Last reviewed: July 28, 2026

## Runtime

- Node.js 24 LTS
- npm 11
- `.nvmrc`: `24.18.0`
- `package.json` engines: Node `>=24.0.0 <27`

## Application

| Package | Pinned version | Purpose |
|---|---:|---|
| Astro | 7.1.3 | Static pages, content collections, metadata, and deployable `dist` output |
| @astrojs/react | 6.0.1 | React islands for interactive tools |
| React / React DOM | 19.2.8 | Browser-only interactive components |
| TypeScript | 6.0.3 | Strict type checking |
| Tailwind CSS | 4.3.3 | Required CSS utility engine |
| @tailwindcss/vite | 4.3.3 | Tailwind 4 Vite integration |
| @astrojs/sitemap | 3.7.3 | Production sitemap generation |
| Lucide React | 1.27.0 | Lightweight SVG icons |

## Testing and quality

| Package | Pinned version | Purpose |
|---|---:|---|
| Vitest | 4.1.10 | Unit and component tests |
| React Testing Library | 16.3.2 | User-centered component tests |
| Playwright Test | 1.62.0 | Route and browser interaction tests |
| axe-core / @axe-core/playwright | 4.12.1 | Automated accessibility checks |
| ESLint | 10.7.0 | Linting |
| typescript-eslint | 8.65.0 | TypeScript lint rules |
| eslint-plugin-astro | 3.0.1 | Astro linting |
| Prettier | 3.9.6 | Formatting |
| prettier-plugin-astro | 0.14.1 | Astro formatting support |

`eslint-plugin-jsx-a11y` is intentionally not installed because its peer range conflicts with the selected ESLint and Astro linting versions. Accessibility is covered through semantic implementation, Astro rules, React Testing Library, Playwright, axe-core, and manual QA.

## Static architecture

Astro output is explicitly static. No adapter, API route, database, authentication, server-side rendering, serverless function, worker, cron task, or server-managed session is included.

The FormSubmit contact form is a normal external HTML POST and does not add a custom backend to the project.
