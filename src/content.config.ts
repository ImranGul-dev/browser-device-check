import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string(),
    appendSiteName: z.boolean(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    category: z.enum(['Permissions', 'Preparation', 'Webcam', 'Microphone']),
    order: z.number(),
    relatedTools: z.array(z.object({ title: z.string(), href: z.string() })),
  }),
});

export const collections = { guides };

