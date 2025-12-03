#!/usr/bin/env node
import { createServer } from 'https';
import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

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

   // Default to index.html for directories
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
   console.log(`🚀 Server running at https://localhost:${PORT}/`);
});
