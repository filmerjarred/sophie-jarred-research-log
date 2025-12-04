#!/usr/bin/env node
import { readFileSync } from 'fs';
import { relative } from 'path';

const mdFile = process.argv[2];
if (!mdFile) {
   console.error('Usage: node md-to-cards.js <markdown-file>');
   process.exit(1);
}

const content = readFileSync(mdFile, 'utf-8');
const relativePath = relative(process.cwd(), mdFile);

// Split on \n- - -\n
const sections = content.split(/\n- - -\n/);

const cards = sections.map(section => {
   const trimmed = section.trim();

   // Find first header (# or ## or ### etc)
   const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
   const title = headerMatch ? headerMatch[1].trim() : null;

   return {
      title,
      content: trimmed,
      file: relativePath
   };
}).filter(card => card.content.length > 0);

console.log(JSON.stringify(cards, null, 2));
