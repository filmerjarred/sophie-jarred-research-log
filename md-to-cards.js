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

   // Find [ User time ] pattern - time is optional
   // Matches patterns like [Jarred 8am], [Sophie 10.31am PT], [Jarred], etc.
   const userMatch = trimmed.match(/\[([A-Za-z]+)(?:\s+([^\]]+))?\]/);
   const user = userMatch ? userMatch[1] : null;
   const time = userMatch && userMatch[2] ? userMatch[2].trim() : null;

   return {
      title,
      user,
      time,
      content: trimmed,
      file: relativePath
   };
}).filter(card => card.content.length > 0);

console.log(JSON.stringify(cards, null, 2));
