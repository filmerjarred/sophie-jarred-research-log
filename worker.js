// worker.js
import { marked } from 'marked';

const GITHUB_USER = 'filmerjarred';
const GITHUB_REPO = 'sophie-jarred-research-log';
const GITHUB_BRANCH = 'main';

function wrapHtml(content, title) {
   return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>${title}</title>
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
   <style>
      body {
         font-family: 'Cardo', Georgia, serif;
         line-height: 1.6;
         max-width: 800px;
         margin: 0 auto;
         padding: 2rem;
         color: #333;
      }
      h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
      h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
      a { color: #0066cc; }
      code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
      pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 5px; }
      pre code { background: none; padding: 0; }
      img { max-width: 100%; height: auto; }
      hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
   </style>
</head>
<body>
${content}
</body>
</html>`;
}

export default {
   async fetch(request) {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/+|\/+$/g, ''); // trim slashes

      // Handle root path
      if (!path) {
         return new Response(wrapHtml('<h1>Welcome</h1><p>Try <a href="/day-1">/day-1</a></p>', 'Home'), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
         });
      }

      // Construct the raw GitHub URL
      const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}/post.md`;

      try {
         const response = await fetch(fileUrl, {
            headers: {
               'User-Agent': 'Cloudflare-Worker',
            },
         });

         if (!response.ok) {
            return new Response(wrapHtml(`<h1>Not Found</h1><p>${path}/post.md not found</p>`, '404'), {
               status: 404,
               headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
         }

         const markdown = await response.text();
         const htmlContent = marked(markdown);
         const fullHtml = wrapHtml(htmlContent, path);

         return new Response(fullHtml, {
            headers: {
               'Content-Type': 'text/html; charset=utf-8',
               'Cache-Control': 'public, max-age=300', // 5 min cache
            },
         });
      } catch (err) {
         const message = err instanceof Error ? err.message : 'Unknown error';
         return new Response(wrapHtml(`<h1>Error</h1><p>Error fetching content: ${message}</p>`, 'Error'), {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
         });
      }
   },
};