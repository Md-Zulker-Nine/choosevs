export const SITE = {
  name: 'ChooseVS',
  domain: 'choosevs.com',
  url: 'https://choosevs.com',
  description: 'Compare anything side-by-side. Expert analysis, detailed specs, and honest verdicts to help you make the best choice.',
  keywords: ['compare', 'vs', 'comparison', 'versus', 'choose', 'which is better'],
  author: 'ChooseVS Team',
  twitter: '@choosevs',
  email: 'hello@choosevs.com',
};

export const CATEGORIES = [
  {
    id: 'tech',
    name: 'Technology',
    slug: 'tech',
    icon: '💻',
    description: 'Compare smartphones, laptops, gadgets, and tech products',
    color: 'blue',
  },
  {
    id: 'movies',
    name: 'Movies & TV',
    slug: 'movies',
    icon: '🎬',
    description: 'Compare movies, TV shows, streaming platforms, and entertainment',
    color: 'purple',
  },
  {
    id: 'countries',
    name: 'Countries',
    slug: 'countries',
    icon: '🌍',
    description: 'Compare countries by cost of living, quality of life, and travel',
    color: 'green',
  },
  {
    id: 'cars',
    name: 'Cars & Vehicles',
    slug: 'cars',
    icon: '🚗',
    description: 'Compare cars, motorcycles, EVs, and vehicles side-by-side',
    color: 'red',
  },
  {
    id: 'travel',
    name: 'Travel & Destinations',
    slug: 'travel',
    icon: '✈️',
    description: 'Compare travel destinations, hotels, and vacation spots',
    color: 'cyan',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    slug: 'crypto',
    icon: '₿',
    description: 'Compare cryptocurrencies, tokens, and blockchain platforms',
    color: 'orange',
  },
  {
    id: 'ai-models',
    name: 'AI Models',
    slug: 'ai-models',
    icon: '🤖',
    description: 'Compare AI models, LLMs, and machine learning platforms',
    color: 'pink',
  },
];

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'VS Generator', href: '/vs-generator' },
  { label: 'Categories', href: '/categories' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ],
  categories: CATEGORIES.map(c => ({
    label: c.name,
    href: `/category/${c.slug}`,
  })),
};
