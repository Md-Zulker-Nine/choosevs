// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://choosevs.com',
  integrations: [
    sitemap(),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  }
});
