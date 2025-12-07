#!/usr/bin/env node
import { readFileSync } from 'fs';
import { relative } from 'path';

/**
 * Shared card parsing library - also used by index.js and vscode-extension
 */
import { mdToCards } from './lib/cards.js';

const mdFile = process.argv[2];
if (!mdFile) {
   console.error('Usage: node md-to-cards.js <markdown-file>');
   process.exit(1);
}

const content = readFileSync(mdFile, 'utf-8');
const relativePath = relative(process.cwd(), mdFile);

const cards = mdToCards(content, relativePath);

console.log(JSON.stringify(cards, null, 2));
