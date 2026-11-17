#!/usr/bin/env node
/**
 * Extracts every inline <script> block (without a src= attribute) from index.html
 * and compiles it via node:vm to catch syntax errors with accurate file line numbers.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const htmlPath = resolve(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf8');

const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count += 1;
  const lineOffset = html.slice(0, match.index).split('\n').length - 1;
  new vm.Script(match[1], {
    filename: `index.html#inline-script-${count}`,
    lineOffset,
  });
}

if (count === 0) {
  console.error('ERROR: No inline <script> blocks found in index.html');
  process.exit(1);
}

console.log(`OK: Verified syntax of ${count} inline <script> blocks in index.html`);
