import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig(({ command }) => {
  const site =
    process.env.PUBLIC_SITE_ORIGIN ||
    'https://browserdevicecheck.com';

  const siteEnvironment =
    process.env.PUBLIC_SITE_ENV ||
    (process.env.CONTEXT === 'production'
      ? 'production'
      : command === 'build'
        ? 'production'
        : 'development');

  const isProduction = siteEnvironment === 'production';

  return {
    site,
    output: 'static',
    trailingSlash: 'always',

    build: {
      format: 'directory',
    },

    integrations: [
      react(),

      ...(isProduction
        ? [
            sitemap({
              filter(page) {
                const pathname = new URL(page).pathname;

                return (
                  pathname !== '/404.html' &&
                  pathname !== '/contact/thanks/'
                );
              },
            }),
          ]
        : []),
    ],

    vite: {
      build: {
        target: 'es2022',
      },
    },

    compressHTML: true,
  };
});
