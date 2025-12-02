import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      }
      h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
      h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
      a { color: #0066cc; }
      code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
      pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 5px; }
      pre code { background: none; padding: 0; }
      img { max-width: 100%; height: auto; }
      hr { border: none; border-top: 1px solid #a1a1a1; margin: 2em 0; }
   </style>
</head>
<body>
${content}
</body>
</html>`;
}

const markdown = readFileSync(join(__dirname, 'post.md'), 'utf-8');
const htmlContent = marked(markdown);
const fullHtml = wrapHtml(htmlContent, 'Day 2');
writeFileSync(join(__dirname, 'index.html'), fullHtml);
console.log('Built: ship-december/day-1/index.html');
