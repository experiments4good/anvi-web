# getanvi.app

The website for Anvi: a holding page and the privacy policy and terms of use.
Astro, static output, deployed as a Cloudflare Worker with the custom domain
`getanvi.app`.

- `src/content/legal/privacy.md` and `terms.md` are the two documents. Edit
  the text there; the title and date come from the frontmatter.
- `src/styles/site.css` carries the design tokens shared with the app.
- Fonts are self hosted under `public/fonts` (Playfair Display and Lato, OFL).

```
npm install
npm run dev        # local
npm run deploy     # astro build && wrangler deploy
```
