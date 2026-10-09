import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://getanvi.app',

  // Static pages only: the holding page, the privacy policy and terms, the
  // dosha quiz (which runs entirely in the browser) and the seven type
  // guides under /dosha/. No page opts into on-demand rendering, so the
  // Worker serves static files and has no server surface.
  output: 'static',

  // No sessions, so no KV namespace for the adapter to provision.
  session: false,

  // The only image is an inline SVG. The adapter's default image service is
  // Cloudflare Images, a billable product this site does not use.
  adapter: cloudflare({ imageService: 'passthrough' }),

  vite: {
    optimizeDeps: {
      // Dev only. The adapter pre-bundles the server's dependencies from a
      // fixed list; these two are the ones it misses with the passthrough
      // image service, and a late discovery kills the dev server.
      include: ['astro/assets/services/noop', 'astro/app/manifest'],
    },
  },
});
