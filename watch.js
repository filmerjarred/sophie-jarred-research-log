#!/usr/bin/env node
import { watch, readFileSync, statSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const shipDecemberDir = join(__dirname, 'ship-december');
const PORT = 3000;

// === Build watcher ===
let buildTimeout = null;
let building = false;
let buildCount = 0;

function clearLine() {
   process.stdout.write('\r\x1b[K');
}

function runBuild(filename = null) {
   if (building) return;
   building = true;
   buildCount++;

   const proc = spawn('node', ['build.js'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: __dirname,
      env: { ...process.env, QUIET: '1' }
   });

   proc.on('close', (code) => {
      building = false;
      clearLine();
      const time = new Date().toLocaleTimeString();
      if (code === 0) {
         process.stdout.write(`✓ Built #${buildCount} at ${time}${filename ? ` (${filename})` : ''}`);
      } else {
         process.stdout.write(`✗ Build #${buildCount} failed at ${time}`);
      }
   });
}

// Initial build
runBuild();

// Watch for changes
watch(shipDecemberDir, { recursive: true }, (eventType, filename) => {
   if (filename && filename.endsWith('index.html')) return;

   clearTimeout(buildTimeout);
   buildTimeout = setTimeout(() => {
      runBuild(filename);
   }, 100);
});

// === Dev server ===
const mimeTypes = {
   '.html': 'text/html',
   '.css': 'text/css',
   '.js': 'text/javascript',
   '.json': 'application/json',
   '.png': 'image/png',
   '.jpg': 'image/jpeg',
   '.jpeg': 'image/jpeg',
   '.gif': 'image/gif',
   '.svg': 'image/svg+xml',
   '.ico': 'image/x-icon',
   '.md': 'text/plain',
   '.aac': 'audio/aac',
   '.mp3': 'audio/mpeg',
   '.wav': 'audio/wav',
   '.woff': 'font/woff',
   '.woff2': 'font/woff2',
};

const server = createServer({
   key: readFileSync(join(__dirname, 'key.pem')),
   cert: readFileSync(join(__dirname, 'cert.pem')),
}, (req, res) => {
   let url = req.url.split('?')[0];

   // Redirect to trailing slash for directories
   if (!extname(url) && !url.endsWith('/')) {
      const dirPath = join(__dirname, url);
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
         res.writeHead(301, { Location: url + '/' });
         res.end();
         return;
      }
   }

   if (url.endsWith('/')) {
      url += 'index.html';
   }

   const filePath = join(__dirname, url);

   if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
   }

   const ext = extname(filePath);
   const contentType = mimeTypes[ext] || 'application/octet-stream';

   try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
   } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
   }
});

server.listen(PORT, () => {
   console.log(`🚀 Dev server: https://localhost:${PORT}/`);
   console.log(`👀 Watching ${shipDecemberDir} for changes...`);
});
