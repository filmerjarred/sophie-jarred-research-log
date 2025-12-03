import { marked } from 'marked';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const shipDecemberDir = join(__dirname, '..');

// Discover all days and their appendices
function discoverDays() {
   const days = [];
   const entries = readdirSync(shipDecemberDir).filter(d => {
      const dayPath = join(shipDecemberDir, d);
      return statSync(dayPath).isDirectory() && d.startsWith('day-');
   }).sort((a, b) => {
      const numA = parseInt(a.replace('day-', ''));
      const numB = parseInt(b.replace('day-', ''));
      return numA - numB;
   });

   for (const day of entries) {
      const dayPath = join(shipDecemberDir, day);
      const dayNum = day.replace('day-', '');
      const appendices = [];

      // Check for appendices folder
      const appendicesPath = join(dayPath, 'appendices');
      const actualAppendicesPath = existsSync(appendicesPath) ? appendicesPath : null;

      if (actualAppendicesPath) {
         const files = readdirSync(actualAppendicesPath);
         for (const file of files) {
            const filePath = join(actualAppendicesPath, file);
            if (statSync(filePath).isFile()) {
               appendices.push({
                  name: file,
                  path: `/ship-december/${day}/${basename(actualAppendicesPath)}/${file}`
               });
            }
         }
      }

      days.push({
         folder: day,
         num: dayNum,
         title: `Day ${dayNum}`,
         url: `/ship-december/${day}`,
         appendices
      });
   }

   return days;
}

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
            width: 125px;
         }
         .main-content {
            margin-left: 125px;
            padding: 1.5rem 1.5rem 1.5rem 2rem;
         }
         .appendix-item {
            padding: 0.5rem 0.5rem 0.5rem 1rem;
         }
         .chevron-container {
            width: 30px;
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
      code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
      pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 5px; }
      pre code { background: none; padding: 0; }
      img { max-width: 100%; height: auto; }
      hr { border: none; border-top: 1px solid #a1a1a1; margin: 2em 0; }
      blockquote {
         margin: 1.5em 0;
         padding: 1em 1.5em;
         background: #f9f9f9;
         border-left: 4px solid #333;
      }
      blockquote p { margin: 0; }
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

// Build this day
const currentDay = 'day-3';
const days = discoverDays();
const markdown = readFileSync(join(__dirname, 'post.md'), 'utf-8');
const htmlContent = marked(markdown);
const fullHtml = wrapHtml(htmlContent, 'Day 3', days, currentDay);
writeFileSync(join(__dirname, 'index.html'), fullHtml);
if (!process.env.QUIET) console.log('Built: ship-december/day-3/index.html');
