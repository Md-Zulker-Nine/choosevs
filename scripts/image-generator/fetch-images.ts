// scripts/image-generator/fetch-images.ts
// Fetches relevant images for blog posts and comparisons
// Uses free sources - no API key needed

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'public/images');

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

interface ImageSource {
  name: string;
  getUrl: (query: string, width?: number, height?: number) => string;
  requiresKey: boolean;
}

const SOURCES: ImageSource[] = [
  {
    name: 'unsplash',
    getUrl: (q, w = 1200, h = 630) =>
      `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`,
    requiresKey: false,
  },
  {
    name: 'picsum',
    getUrl: (q, w = 1200, h = 630) =>
      `https://picsum.photos/seed/${encodeURIComponent(q)}/${w}/${h}`,
    requiresKey: false,
  },
  {
    name: 'placeholder',
    getUrl: (q, w = 1200, h = 630) =>
      `https://dummyimage.com/${w}x${h}/3b82f6/ffffff.jpg&text=${encodeURIComponent(q)}`,
    requiresKey: false,
  },
];

export function getImageUrl(query: string, source: string = 'unsplash'): string {
  const src = SOURCES.find(s => s.name === source) || SOURCES[0];
  return src.getUrl(query);
}

export function getCategoryImage(category: string): string {
  const categoryImages: Record<string, string> = {
    tech: 'technology',
    movies: 'movie,cinema',
    countries: 'country,landmark',
    cars: 'car,automobile',
    travel: 'travel,destination',
    crypto: 'cryptocurrency,bitcoin',
    'ai-models': 'artificial,intelligence',
  };
  return categoryImages[category] || category;
}

export function generateOgImageUrl(title: string, category: string): string {
  // Generate a dynamic OG image URL using dummyimage (always works)
  const cleanTitle = title.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '');
  return `https://dummyimage.com/1200x630/1e40af/ffffff.png&text=${encodeURIComponent(cleanTitle)}`;
}

export function getComparisonImage(entityA: string, entityB: string): string {
  return `https://dummyimage.com/1200x630/0f172a/ffffff.png&text=${encodeURIComponent(entityA + ' vs ' + entityB)}`;
}

// Generate SVG placeholder as fallback
export function generateSvgPlaceholder(text: string, width = 1200, height = 630): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1e40af"/>
        <stop offset="100%" style="stop-color:#7c3aed"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="32" fill="white" font-weight="bold">${escapeXml(text)}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  })[c]!);
}

// Download image from URL
export async function downloadImage(url: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filename).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const filePath = path.join(IMAGE_DIR, filename);
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(`/images/${filename}`);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Get all images for a blog post
export function getBlogImages(title: string, category: string, tags: string[]): {
  featured: string;
  og: string;
  inline: string[];
} {
  const catImage = getCategoryImage(category);
  return {
    featured: getImageUrl(catImage, 'picsum'),
    og: generateOgImageUrl(title, category),
    inline: [
      getImageUrl(tags[0] || category, 'picsum'),
      getImageUrl(tags[1] || category, 'picsum'),
    ],
  };
}

// Get images for a comparison page
export function getComparisonImages(entityA: string, entityB: string): {
  featured: string;
  og: string;
  imageA: string;
  imageB: string;
} {
  return {
    featured: getComparisonImage(entityA, entityB),
    og: `https://dummyimage.com/1200x630/0f172a/ffffff.png&text=${encodeURIComponent(entityA + ' vs ' + entityB)}`,
    imageA: getImageUrl(entityA, 'picsum'),
    imageB: getImageUrl(entityB, 'picsum'),
  };
}
