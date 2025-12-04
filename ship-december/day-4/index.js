import { marked } from 'marked';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPO_OWNER = 'filmerjarred';
const REPO_NAME = 'sophie-jarred-research-log';
const BRANCH = 'main';

async function fetchFromGitHub(filePath, githubToken) {
   const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`;

   const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ship-december'
   };

   if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
   }

   const response = await fetch(url, { headers });
   if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub fetch failed: ${response.status}`);
   }

   const data = await response.json();
   // Content is base64 encoded
   return atob(data.content.replace(/\n/g, ''));
}

// Convert markdown content to cards
function mdToCards(content, filePath = '') {
   // Split on \n- - -\n
   const sections = content.split(/\n- - -\n/);

   return sections.map(section => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      // Find first header (# or ## or ### etc)
      const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
      const title = headerMatch ? headerMatch[1].trim() : null;

      // Find [ User time ] pattern - time is optional
      const userMatch = trimmed.match(/\[([A-Za-z]+)(?:\s+([^\]]+))?\]/);
      const user = userMatch ? userMatch[1] : null;
      const time = userMatch && userMatch[2] ? userMatch[2].trim() : null;

      return {
         title,
         user,
         time,
         content: trimmed,
         file: filePath
      };
   }).filter(Boolean);
}

// Convert wiki-links [[path]] to clickable links that open modal
function processWikiLinks(html) {
   // Match [[path]] or [[path|display text]]
   return html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, path, displayText) => {
      // Normalize path - add .md if no extension, prefix with /ship-december/ if needed
      let fullPath = path.trim();
      if (!fullPath.includes('.')) {
         fullPath += '.md';
      }
      if (!fullPath.startsWith('/')) {
         fullPath = '/ship-december/' + fullPath;
      }

      // Get display text - use the filename without extension if not provided
      const display = displayText || path.split('/').pop().replace(/\.md$/, '');
      const name = fullPath.split('/').pop();

      return `<a href="#" class="wiki-link" data-path="${fullPath}" data-name="${name}">${display}</a>`;
   });
}

// Render cards to HTML
function renderCards(cards, className = 'card') {
   return cards.map(card => {
      let html = marked(card.content);
      html = processWikiLinks(html);
      const dataAttrs = [
         card.user ? `data-user="${card.user}"` : '',
         card.time ? `data-time="${card.time}"` : '',
         card.file ? `data-file="${card.file}"` : ''
      ].filter(Boolean).join(' ');

      return `<article class="${className}" ${dataAttrs}>${html}</article>`;
   }).join(className === 'card' ? '\n<hr>\n' : '\n');
}

// Static days data (could be fetched dynamically if needed)
const DAYS = [
   { folder: 'day-1', num: '1', title: 'Day 1', url: '/ship-december/day-1', appendices: [] },
   { folder: 'day-2', num: '2', title: 'Day 2', url: '/ship-december/day-2', appendices: [] },
   { folder: 'day-3', num: '3', title: 'Day 3', url: '/ship-december/day-3', appendices: [] },
   {
      folder: 'day-4', num: '4', title: 'Day 4', url: '/ship-december/day-4', appendices: [
         { name: 'jarred-claude-code-transcript.md', path: '/ship-december/day-4/appendices/jarred-claude-code-transcript.md' },
         { name: 'jarred-margin.md', path: '/ship-december/day-4/appendices/jarred-margin.md' }
      ]
   }
];

function generateSidebarHTML(days, currentDay) {
   let sidebarItems = '';

   for (const day of days) {
      const hasAppendices = day.appendices.length > 0;
      const isActive = day.folder === currentDay ? ' active' : '';

      let appendicesHTML = '';
      if (hasAppendices) {
         const appendixItems = day.appendices.map(a =>
            `<div class="appendix-item" data-path="${a.path}" data-name="${a.name}">${a.name}</div>`
         ).join('');
         appendicesHTML = `<div class="appendices-tree">${appendixItems}</div>`;
      }

      const isExpanded = isActive && hasAppendices ? ' expanded' : '';
      sidebarItems += `
      <div class="sidebar-item${isActive}${isExpanded}">
         <div class="sidebar-item-row">
            <a href="${day.url}" class="day-link">${day.title}</a>
            ${hasAppendices ? '<div class="chevron-container"><span class="chevron">&#9662;</span></div>' : ''}
         </div>
         ${appendicesHTML}
      </div>`;
   }

   return `
   <nav class="sidebar">
      <div class="sidebar-header">Ship December</div>
      ${sidebarItems}
   </nav>`;
}

function generateModalHTML() {
   return `
   <div id="appendix-modal" class="modal">
      <div class="modal-content">
         <button class="modal-close">&times;</button>
         <div class="modal-body"></div>
      </div>
   </div>`;
}

function generateStyles() {
   return `
      * { box-sizing: border-box; }

      html {
         overflow-x: hidden;
      }

      body {
         font-family: 'Cardo', Georgia, serif;
         line-height: 1.6;
         margin: 0;
         padding: 0;
         display: flex;
         overflow-x: hidden;
      }

      /* Sidebar */
      .sidebar {
         width: 220px;
         min-height: 100vh;
         background: #fff;
         border-right: 1px solid #e0e0e0;
         position: fixed;
         left: 0;
         top: 0;
         overflow-y: auto;
         font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", ui-monospace, monospace;
         font-size: 1rem;
      }

      .sidebar-header {
         padding: 1.5rem 1rem 1rem;
         font-weight: 700;
         font-size: 1.1rem;
         border-bottom: 1px solid #e0e0e0;
      }

      .sidebar-item {
         border-bottom: 1px solid #eee;
      }

      .sidebar-item-row {
         display: flex;
         align-items: stretch;
      }

      .day-link {
         flex: 1;
         padding: 0.75rem 1rem;
         color: #000;
         text-decoration: none;
         display: block;
      }

      .day-link:hover {
         background: #f5f5f5;
      }

      .sidebar-item.active .day-link {
         font-weight: 700;
      }

      .chevron-container {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 40px;
         border-left: 1px solid #eee;
         cursor: pointer;
         user-select: none;
      }

      .chevron-container:hover {
         background: #f5f5f5;
      }

      .chevron {
         font-size: 0.8rem;
         color: #666;
         transition: transform 0.2s ease;
      }

      .sidebar-item.expanded .chevron {
         transform: rotate(180deg);
      }

      .appendices-tree {
         display: none;
         background: #fafafa;
         border-top: 1px solid #eee;
      }

      .sidebar-item.expanded .appendices-tree {
         display: block;
      }

      .appendix-item {
         padding: 0.5rem 1rem 0.5rem 2rem;
         font-size: 0.8rem;
         cursor: pointer;
         border-bottom: 1px solid #eee;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
      }

      .appendix-item:last-child {
         border-bottom: none;
      }

      .appendix-item:hover {
         background: #f0f0f0;
      }

      /* Main content */
      .main-content {
         margin-left: 220px;
         flex: 1;
         max-width: 800px;
         padding: 2rem 2rem 2rem 3.5rem;
      }

      /* Modal */
      .modal {
         display: none;
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.3);
         z-index: 1000;
         justify-content: center;
         align-items: center;
      }

      .modal.open {
         display: flex;
      }

      .modal-content {
         background: #fff;
         border: 1px solid #000;
         box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
         max-width: 800px;
         width: 90%;
         max-height: 80vh;
         position: relative;
         display: flex;
         flex-direction: column;
      }

      .modal-close {
         position: absolute;
         top: 0.5rem;
         right: 0.75rem;
         background: none;
         border: none;
         font-size: 1.5rem;
         cursor: pointer;
         color: #000;
         line-height: 1;
      }

      .modal-close:hover {
         color: #666;
      }

      .modal-body {
         padding: 2rem;
         overflow-y: auto;
         font-family: 'Cardo', Georgia, serif;
         line-height: 1.6;
      }

      .modal-body pre {
         background: #f4f4f4;
         padding: 1em;
         overflow-x: auto;
         border-radius: 5px;
      }

      .modal-body code {
         background: #f4f4f4;
         padding: 0.2em 0.4em;
         border-radius: 3px;
      }

      .modal-body pre code {
         background: none;
         padding: 0;
      }

      /* Responsive sidebar */
      @media (max-width: 800px) {
         .sidebar {
            width: 64px;
         }
         .sidebar-header {
            padding: 1rem 0.5rem;
            font-size: 0.8rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
         }
         .day-link {
            padding: 0.75rem 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
         }
         .main-content {
            margin-left: 64px;
            padding: 1.5rem 1.5rem 1.5rem 2rem;
         }
         .appendix-item {
            padding: 0.5rem 0.5rem 0.5rem 0.5rem;
            font-size: 0.7rem;
         }
         .chevron-container {
            width: 20px;
         }
      }

      /* Sidebar expanded state (swipe to expand) */
      .sidebar {
         transition: width 0.3s ease;
      }
      .main-content {
         transition: margin-left 0.3s ease, opacity 0.3s ease;
      }
      body.sidebar-expanded .sidebar {
         width: 80vw;
         z-index: 100;
      }
      body.sidebar-expanded .main-content {
         margin-left: 80vw;
         opacity: 0.3;
         cursor: pointer;
      }
      @media (max-width: 800px) {
         body.sidebar-expanded .sidebar {
            width: 85vw;
         }
         body.sidebar-expanded .main-content {
            margin-left: 85vw;
         }
      }

      /* Post content styles */
      h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
      h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
      a { color: #0066cc; }
      a.wiki-link {
         color: #0066cc;
         text-decoration: none;
         border-bottom: 1px dashed #0066cc;
      }
      a.wiki-link:hover {
         border-bottom-style: solid;
      }
      code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
      pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 5px; }
      pre code { background: none; padding: 0; }
      img { max-width: 100%; height: auto; border: 1px solid #ddd; }
      hr { border: none; border-top: 1px solid #a1a1a1; margin: 2em 0; }
      blockquote {
         margin: 1.5em 0;
         padding: 1em 1.5em;
         background: #f9f9f9;
         border-left: 4px solid #333;
      }
      blockquote p { margin: 0; }

      /* Cards */
      .card {
         margin-bottom: 0;
      }

      /* Comments */
      .comments-section {
         margin-top: 3rem;
         padding-top: 2rem;
         border-top: 2px solid #333;
      }
      .comments-section h2 {
         margin-top: 0;
         font-size: 1.2rem;
         color: #666;
      }
      .comment {
         background: #f9f9f9;
         border-left: 3px solid #ccc;
         padding: 0.1rem 1rem;
         margin: 1rem 0;
         font-size: 0.95rem;
      }

      /* Comment form */
      .comment-form {
         margin-top: 2rem;
         padding: 1.5rem;
         background: #f9f9f9;
         border: 1px solid #ddd;
      }
      .comment-form h3 {
         margin: 0 0 1rem 0;
         font-size: 1rem;
         color: #333;
      }
      .comment-form input,
      .comment-form textarea {
         width: 100%;
         padding: 0.5rem;
         margin-bottom: 0.75rem;
         border: 1px solid #ccc;
         font-family: inherit;
         font-size: 0.95rem;
      }
      .comment-form textarea {
         min-height: 100px;
         resize: vertical;
      }
      .comment-form button {
         padding: 0.5rem 1.5rem;
         background: #333;
         color: #fff;
         border: none;
         cursor: pointer;
         font-family: inherit;
         font-size: 0.95rem;
      }
      .comment-form button:hover {
         background: #555;
      }
      .comment-form button:disabled {
         background: #999;
         cursor: not-allowed;
      }
      .comment-form .form-status {
         margin-top: 0.75rem;
         font-size: 0.9rem;
      }
      .comment-form .form-status.error {
         color: #c00;
      }
      .comment-form .form-status.success {
         color: #060;
      }
   `;
}

function generateScript() {
   return `
   <script>
      // Chevron toggle for appendices
      document.querySelectorAll('.chevron-container').forEach(chevron => {
         chevron.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = chevron.closest('.sidebar-item');
            item.classList.toggle('expanded');
         });
      });

      // Modal handling
      const modal = document.getElementById('appendix-modal');
      const modalBody = modal.querySelector('.modal-body');
      const modalClose = modal.querySelector('.modal-close');

      document.querySelectorAll('.appendix-item').forEach(item => {
         item.addEventListener('click', async () => {
            const path = item.dataset.path;
            const name = item.dataset.name;

            try {
               const response = await fetch(path);
               let content = await response.text();

               // If markdown, render it
               if (name.endsWith('.md')) {
                  // Basic markdown rendering (or use marked if available)
                  content = content
                     .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                     .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                     .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                     .replace(/\\*\\*(.*)\\*\\*/gim, '<strong>$1</strong>')
                     .replace(/\\*(.*)\\*/gim, '<em>$1</em>')
                     .replace(/\`\`\`([\\s\\S]*?)\`\`\`/gim, '<pre><code>$1</code></pre>')
                     .replace(/\`([^\`]+)\`/gim, '<code>$1</code>')
                     .replace(/\\n/gim, '<br>');
               } else {
                  content = '<pre>' + content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
               }

               modalBody.innerHTML = '<h2>' + name + '</h2>' + content;
               modal.classList.add('open');
            } catch (err) {
               modalBody.innerHTML = '<p>Error loading file: ' + err.message + '</p>';
               modal.classList.add('open');
            }
         });
      });

      // Wiki-link handling (opens modal just like appendix items)
      document.querySelectorAll('.wiki-link').forEach(link => {
         link.addEventListener('click', async (e) => {
            e.preventDefault();
            const path = link.dataset.path;
            const name = link.dataset.name;

            try {
               const response = await fetch(path);
               let content = await response.text();

               // If markdown, render it
               if (name.endsWith('.md')) {
                  content = content
                     .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                     .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                     .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                     .replace(/\\*\\*(.*)\\*\\*/gim, '<strong>$1</strong>')
                     .replace(/\\*(.*)\\*/gim, '<em>$1</em>')
                     .replace(/\`\`\`([\\s\\S]*?)\`\`\`/gim, '<pre><code>$1</code></pre>')
                     .replace(/\`([^\`]+)\`/gim, '<code>$1</code>')
                     .replace(/\\n/gim, '<br>');
               } else {
                  content = '<pre>' + content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
               }

               modalBody.innerHTML = '<h2>' + name + '</h2>' + content;
               modal.classList.add('open');
            } catch (err) {
               modalBody.innerHTML = '<p>Error loading file: ' + err.message + '</p>';
               modal.classList.add('open');
            }
         });
      });

      modalClose.addEventListener('click', () => {
         modal.classList.remove('open');
      });

      modal.addEventListener('click', (e) => {
         if (e.target === modal) {
            modal.classList.remove('open');
         }
      });

      document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') {
            modal.classList.remove('open');
         }
      });

      // Swipe to expand sidebar
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');
      let touchStartX = 0;
      let touchEndX = 0;

      sidebar.addEventListener('touchstart', (e) => {
         touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      sidebar.addEventListener('touchend', (e) => {
         touchEndX = e.changedTouches[0].screenX;
         if (touchEndX - touchStartX > 50) {
            document.body.classList.add('sidebar-expanded');
         } else if (touchStartX - touchEndX > 50) {
            document.body.classList.remove('sidebar-expanded');
         }
      }, { passive: true });

      mainContent.addEventListener('click', () => {
         if (document.body.classList.contains('sidebar-expanded')) {
            document.body.classList.remove('sidebar-expanded');
         }
      });

      // Comment form handling
      const commentForm = document.getElementById('comment-form');
      if (commentForm) {
         const nameInput = document.getElementById('comment-name');

         // Load saved name from localStorage
         const savedName = localStorage.getItem('commentName');
         if (savedName) {
            nameInput.value = savedName;
         }

         commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const textInput = document.getElementById('comment-text');
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            const statusDiv = document.getElementById('form-status');

            const name = nameInput.value.trim() || 'Anonymous';

            // Save name to localStorage
            if (nameInput.value.trim()) {
               localStorage.setItem('commentName', nameInput.value.trim());
            }
            const text = textInput.value.trim();

            if (!text) {
               statusDiv.textContent = 'Please enter a comment';
               statusDiv.className = 'form-status error';
               return;
            }

            // Compute day based on current date (December 2024)
            const now = new Date();
            const day = now.getDate();
            const dayStr = 'day-' + day;

            // Format time like "7.30am"
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            const timeStr = hours + '.' + String(minutes).padStart(2, '0') + ampm;

            // Build the comment with metadata header
            const fullComment = '*[ ' + name + ' ' + dayStr + ' ' + timeStr + ' ]*\\n\\n' + text;

            submitBtn.disabled = true;
            statusDiv.textContent = 'Submitting...';
            statusDiv.className = 'form-status';

            try {
               const response = await fetch('/ship-december/day-4/api/comment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ comment: fullComment, day: 'day-4' })
               });

               const result = await response.json();

               if (response.ok) {
                  statusDiv.textContent = 'Comment submitted! Refresh to see it.';
                  statusDiv.className = 'form-status success';
                  textInput.value = '';
               } else {
                  statusDiv.textContent = 'Error: ' + (result.error || 'Unknown error');
                  statusDiv.className = 'form-status error';
               }
            } catch (err) {
               statusDiv.textContent = 'Error: ' + err.message;
               statusDiv.className = 'form-status error';
            } finally {
               submitBtn.disabled = false;
            }
         });
      }
   </script>`;
}

function wrapHtml(content, title, days, currentDay) {
   const sidebar = generateSidebarHTML(days, currentDay);
   const modal = generateModalHTML();
   const styles = generateStyles();
   const script = generateScript();

   return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>${title}</title>
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
   <style>${styles}</style>
</head>
<body>
   ${sidebar}
   <main class="main-content">
      ${content}
   </main>
   ${modal}
   ${script}
</body>
</html>`;
}

export async function onRequest(context) {
   const currentDay = 'day-4';
   const githubToken = context?.env?.GIT_API_TOKEN || process.env?.GIT_API_TOKEN;

   // Read post.md from disk
   const postMd = readFileSync(join(__dirname, 'post.md'), 'utf-8');
   const cards = mdToCards(postMd, 'ship-december/day-4/post.md');
   let htmlContent = renderCards(cards);

   // Fetch comments dynamically from GitHub
   const commentsMd = await fetchFromGitHub('ship-december/day-4/comments.md', githubToken);
   let commentsHtml = '';

   if (commentsMd) {
      const commentCards = mdToCards(commentsMd, 'ship-december/day-4/comments.md');
      if (commentCards.length > 0) {
         commentsHtml = renderCards(commentCards, 'comment');
      }
   }

   // Comment form HTML
   const commentFormHtml = `
      <div class="comment-form">
         <h3>Leave a comment</h3>
         <form id="comment-form">
            <input type="text" id="comment-name" placeholder="Your name (optional)" />
            <textarea id="comment-text" placeholder="Your comment..."></textarea>
            <button type="submit">Submit</button>
            <div id="form-status" class="form-status"></div>
         </form>
      </div>
   `;

   htmlContent += `
   <section class="comments-section">
      <h2>Comments</h2>
      ${commentsHtml}
      ${commentFormHtml}
   </section>`;

   const fullHtml = wrapHtml(htmlContent, 'Day 4', DAYS, currentDay);

   return new Response(fullHtml, {
      headers: { 'Content-Type': 'text/html' }
   });
}
