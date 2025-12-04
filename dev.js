#!/usr/bin/env node
import { watch, readFileSync, statSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const shipDecemberDir = join(__dirname, 'ship-december');
const PORT = 3000;

// Load .env file
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
   const envContent = readFileSync(envPath, 'utf-8');
   for (const line of envContent.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
         process.env[key.trim()] = valueParts.join('=').trim();
      }
   }
}

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

// API route cache (cleared on file changes)
const apiCache = new Map();

async function handleApiRoute(req, res, apiPath) {
   try {
      // Clear cache to always get fresh module in dev
      const fullPath = join(__dirname, apiPath);
      const fileUrl = `file://${fullPath}?t=${Date.now()}`;

      const mod = await import(fileUrl);

      // Collect request body
      let body = '';
      for await (const chunk of req) {
         body += chunk;
      }

      // Create a request-like context
      const context = {
         request: {
            method: req.method,
            headers: Object.fromEntries(Object.entries(req.headers)),
            url: req.url,
            body,
            json: () => JSON.parse(body || '{}')
         }
      };

      const result = await mod.onRequest(context);

      // Handle Response-like objects
      if (result && typeof result.text === 'function') {
         const text = await result.text();
         const headers = {};
         if (result.headers) {
            result.headers.forEach((v, k) => headers[k] = v);
         }
         res.writeHead(result.status || 200, headers);
         res.end(text);
      } else {
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify(result));
      }
   } catch (err) {
      console.error('API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
   }
}

const server = createServer({
   key: readFileSync(join(__dirname, 'key.pem')),
   cert: readFileSync(join(__dirname, 'cert.pem')),
}, async (req, res) => {
   let url = req.url.split('?')[0];

   // Check for API routes: /ship-december/day-X/api/name -> day-X/api/name.js
   const apiMatch = url.match(/^\/ship-december\/(day-\d+)\/api\/(\w+)$/);
   if (apiMatch) {
      const apiPath = `ship-december/${apiMatch[1]}/api/${apiMatch[2]}.js`;
      if (existsSync(join(__dirname, apiPath))) {
         await handleApiRoute(req, res, apiPath);
         return;
      }
   }

   // Redirect to trailing slash for directories
   if (!extname(url) && !url.endsWith('/')) {
      const dirPath = join(__dirname, url);
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
         res.writeHead(301, { Location: url + '/' });
         res.end();
         return;
      }
   }

   // Check for index.js (Cloudflare Worker) in directory
   if (url.endsWith('/')) {
      const dirPath = join(__dirname, url);
      const indexJsPath = join(dirPath, 'index.js');

      if (existsSync(indexJsPath)) {
         try {
            const fileUrl = `file://${indexJsPath}?t=${Date.now()}`;
            const worker = await import(fileUrl);
            if (worker.onRequest) {
               const response = await worker.onRequest({ request: req });
               const body = await response.text();
               res.writeHead(response.status || 200, {
                  'Content-Type': response.headers.get('Content-Type') || 'text/html'
               });
               res.end(body);
               return;
            }
         } catch (err) {
            console.error('Worker error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Worker Error: ' + err.message);
            return;
         }
      }

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
