# ChooseVS - "X vs Y" Programmatic Comparison Site

A premium, AdSense-ready comparison platform built with Astro. Compare anything side-by-side with expert analysis and honest verdicts.

## Features

- ✅ **33 pages** built (home, categories, comparisons, blog, legal pages)
- ✅ **AdSense optimized** — proper ad slots, fast loading, great content
- ✅ **SEO ready** — schema.org, sitemaps, meta tags, semantic HTML
- ✅ **7 categories** — Tech, Movies, Countries, Cars, Travel, Crypto, AI Models
- ✅ **8 comparison pages** with full specs tables, verdicts, FAQs
- ✅ **6 blog posts** with original, valuable content
- ✅ **All legal pages** — Privacy, Terms, Disclaimer, Cookie Policy, About, Contact
- ✅ **Responsive design** — mobile-first, premium UI

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Cloudflare Pages (Recommended - Free)
1. Push this repo to GitHub
2. Go to Cloudflare Pages → Create a project → Connect to GitHub
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add custom domain: `choosevs.com`

### Vercel
1. Push to GitHub
2. Import project in Vercel
3. Framework: Astro
4. Add domain: `choosevs.com`

## Configuration

### Google AdSense
Replace `ca-pub-XXXXXXXXXXXXXXXX` in `src/layouts/BaseLayout.astro:46` with your actual AdSense client ID.

### Analytics
Add your analytics script to `BaseLayout.astro` in the `<head>` section.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── ui/
│   └── ads/
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── constants.ts  # Site config, categories, nav
│   └── utils.ts      # Helper functions
├── pages/
│   ├── index.astro           # Homepage
│   ├── compare/[slug].astro  # Dynamic comparison pages
│   ├── category/[slug].astro # Dynamic category pages
│   ├── blog/                 # Blog system
│   ├── about.astro           # AdSense required
│   ├── contact.astro         # AdSense required
│   ├── privacy-policy.astro  # AdSense required
│   ├── terms-of-service.astro
│   ├── disclaimer.astro
│   └── cookie-policy.astro
├── styles/
│   └── global.css    # Tailwind + custom styles
└── data/             # Entity data for scaling
```

## AdSense Approval Checklist

- [x] ✅ 30+ quality pages (we have 33)
- [x] ✅ Original, valuable content
- [x] ✅ About page
- [x] ✅ Contact page
- [x] ✅ Privacy Policy
- [x] ✅ Terms of Service
- [x] ✅ Disclaimer (affiliate)
- [x] ✅ Cookie Policy
- [x] ✅ Professional design
- [x] ✅ Fast loading (Astro static)
- [x] ✅ Mobile responsive
- [x] ✅ Clear navigation
- [x] ✅ Sitemap
- [x] ✅ robots.txt
- [ ] 🔄 Add your AdSense client ID
- [ ] 🔄 Apply for AdSense after deploying

## Tech Stack

- **Framework:** Astro 7.x
- **Styling:** Tailwind CSS 4.x
- **Content:** Markdown/MDX
- **Schema:** Zod validation
- **Deployment:** Cloudflare Pages / Vercel
- **Language:** 100% static (zero JS by default)

## License

MIT
