// functions/compare/[slug].ts
// Cloudflare Pages Function to handle all /compare/* routes

// List of known pre-generated comparisons
const KNOWN_COMPARISONS = [
  'iphone-16-pro-vs-samsung-galaxy-s25',
  'macbook-pro-vs-dell-xps-15',
  'chatgpt-vs-claude-ai',
  'bitcoin-vs-ethereum',
  'toyota-camry-vs-honda-accord',
  'japan-vs-thailand-travel',
  'netflix-vs-disney-plus',
  'tesla-model-3-vs-bmw-i4',
];

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const slug = params.slug as string;

  // If it's a known comparison, let the static page serve (do nothing)
  if (slug && KNOWN_COMPARISONS.includes(slug)) {
    return await context.next();
  }

  // If slug contains "-vs-", redirect to VS Generator
  if (slug && slug.includes('-vs-')) {
    const parts = slug.split('-vs-');
    const decode = (s: string) =>
      s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const entityA = decode(parts[0]);
    const entityB = decode(parts[1]);

    const url = new URL(request.url);
    const redirectUrl = `${url.origin}/vs-generator?a=${encodeURIComponent(entityA)}&b=${encodeURIComponent(entityB)}`;

    return Response.redirect(redirectUrl, 302);
  }

  // Fallback: redirect to home
  const url = new URL(request.url);
  return Response.redirect(url.origin, 302);
};
