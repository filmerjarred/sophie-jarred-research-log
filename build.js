#!/usr/bin/env node
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find and run build.js in each ship-december/day-* folder
const shipDecemberDir = join(__dirname, 'ship-december');
if (existsSync(shipDecemberDir)) {
   const days = readdirSync(shipDecemberDir).filter(d => {
      const dayPath = join(shipDecemberDir, d);
      return statSync(dayPath).isDirectory() && d.startsWith('day-');
   });

   for (const day of days) {
      const buildPath = join(shipDecemberDir, day, 'build.js');
      if (existsSync(buildPath)) {
         console.log(`Running build for ${day}...`);
         await import(pathToFileURL(buildPath).href);
      } else {
         console.log(`Skipping ${day} (no build.js)`);
      }
   }
}

console.log('Build complete!');
