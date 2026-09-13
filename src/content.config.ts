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

export const collections = { legal };
