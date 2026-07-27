import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://browserdevicecheck.com',
  output: 'static',
  trailingSlash: 'always',

  build: {
    format: 'directory',
  },

  integrations: [
    react(),
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname;

        return (
          pathname !== '/404.html' &&
          pathname !== '/contact/thanks/'
        );
      },
    }),
  ],

  vite: {
    build: {
      target: 'es2022',
    },
  },

  compressHTML: true,
});