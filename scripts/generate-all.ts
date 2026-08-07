#!/usr/bin/env tsx
// Master Auto-Generation Pipeline
// Runs blog + comparison generators in sequence
// Usage: npm run generate:all

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const POSTS_PER_RUN = parseInt(process.env.MAX_POSTS_PER_RUN || '20');
const COMPARISONS_PER_RUN = parseInt(process.env.MAX_COMPARISONS_PER_RUN || '20');

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function run(cmd: string) {
  log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  } catch (e) {
    log(`Error: ${e}`);
    process.exit(1);
  }
}

async function main() {
  log('=== ChooseVS Auto-Generation Pipeline ===');
  log(`Posts to generate: ${POSTS_PER_RUN}`);
  log(`Comparisons to generate: ${COMPARISONS_PER_RUN}`);

  // Step 1: Generate blog posts
  log('\n--- Step 1: Generating Blog Posts ---');
  run(`npx tsx scripts/autoblog/generate-posts.ts --count=${POSTS_PER_RUN}`);

  // Step 2: Generate comparisons
  log('\n--- Step 2: Generating Comparisons ---');
  run(`npx tsx scripts/autogenerate/generate-comparisons.ts --count=${COMPARISONS_PER_RUN}`);

  // Step 3: Validate all content
  log('\n--- Step 3: Validating Content ---');
  run('npx tsx scripts/autoblog/validate.ts');
  run('npx tsx scripts/autogenerate/validate.ts');

  // Step 4: Count generated pages
  const blogDir = path.join(process.cwd(), 'src/pages/blog');
  const compareDir = path.join(process.cwd(), 'src/pages/compare');
  const blogCount = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx') && f !== 'index.astro' && f !== '[slug].astro').length;
  const compareCount = fs.readdirSync(compareDir).filter(f => f.endsWith('.mdx') && f !== '[slug].astro').length;

  log('\n=== Generation Complete ===');
  log(`Total blog posts: ${blogCount}`);
  log(`Total comparisons: ${compareCount}`);
  log(`Total pages: ${blogCount + compareCount}`);
}

main();
