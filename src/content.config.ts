import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The two legal documents, one Markdown file each in src/content/legal.
// The page shell is Legal.astro; the file carries the words and the date.
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    updated: z.coerce.date(),
  }),
});

// The seven type guides, generated word for word from the approved text by
// scripts/build-guides.py. The page shell is Guide.astro.
const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    slug: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    sources: z.array(z.string()),
    first: z.string(),
    /** "On this page": the sections the guide has, by id, in page order. */
    toc: z.array(z.object({ id: z.string(), label: z.string() })),
    /** The quiz result's "Start this week" lines, word for word from the guide. */
    week: z.object({
      food: z.string(),
      mind: z.string().nullable(),
      /** The Wake up line by the dosha being balanced (Tridoshic: by season). */
      wake: z.record(z.string(), z.string()),
    }),
  }),
});

export const collections = { legal, guides };
