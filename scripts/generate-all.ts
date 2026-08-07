#!/usr/bin/env tsx
// Master Auto-Generation Pipeline
// Blog: 3 posts/day (every 8 hours) - 1000+ words each
// Comparisons: 50/day (every 30 min) - with images

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load .env if exists
try {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    });
  }
} catch (e) {
  // .env not found, use process env
}

const POSTS_PER_RUN = parseInt(process.env.MAX_POSTS_PER_RUN || '3');
const COMPARISONS_PER_RUN = parseInt(process.env.MAX_COMPARISONS_PER_RUN || '2');
const MIN_WORDS = parseInt(process.env.MIN_WORDS || '1200');

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function run(cmd: string) {
  log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
  } catch (e) {
    log(`Warning: ${e}`);
  }
}

async function main() {
  log('═══════════════════════════════════════════');
  log('  ChooseVS Auto-Generation Pipeline');
  log('═══════════════════════════════════════════');
  log(`Mode: ${process.env.NODE_ENV || 'production'}`);
  log(`Posts per run: ${POSTS_PER_RUN} (${MIN_WORDS}+ words each)`);
  log(`Comparisons per run: ${COMPARISONS_PER_RUN}`);
  log('───────────────────────────────────────────');

  // Step 1: Generate blog posts
  log('\n📝 Step 1: Generating Blog Posts...');
  run(`npx tsx scripts/autoblog/generate-posts.ts --count=${POSTS_PER_RUN} --min-words=${MIN_WORDS}`);

  // Step 2: Generate comparisons with images
  log('\n⚡ Step 2: Generating Comparison Pages...');
  run(`npx tsx scripts/autogenerate/generate-comparisons.ts --count=${COMPARISONS_PER_RUN} --images`);

  // Step 3: Validate
  log('\n✅ Step 3: Validating Content...');
  run('npx tsx scripts/autoblog/validate.ts');
  run('npx tsx scripts/autogenerate/validate.ts');

  // Count
  const blogDir = path.join(process.cwd(), 'src/pages/blog');
  const compareDir = path.join(process.cwd(), 'src/pages/compare');
  const blogCount = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx') && !f.includes('[')).length;
  const compareCount = fs.readdirSync(compareDir).filter(f => f.endsWith('.mdx') && !f.includes('[')).length;

  log('\n═══════════════════════════════════════════');
  log('  Generation Complete!');
  log('═══════════════════════════════════════════');
  log(`📊 Total blog posts: ${blogCount}`);
  log(`📊 Total comparisons: ${compareCount}`);
  log(`📊 Total content pages: ${blogCount + compareCount}`);
  log('───────────────────────────────────────────');
}

main();
