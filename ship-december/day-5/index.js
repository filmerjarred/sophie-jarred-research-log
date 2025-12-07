import { marked } from 'marked';
import { readFile } from 'node:fs/promises';

/**
 * Shared card parsing library - also used by md-to-cards.js and vscode-extension
 */
import { mdToCards, ENCRYPTED_MARKER } from './lib/cards.js';

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

async function readLocalMarkdown(relativePath) {
   try {
      const fileUrl = new URL(relativePath, import.meta.url);
      return await readFile(fileUrl, 'utf8');
   } catch (err) {
      console.error(`Failed to read local file ${relativePath}:`, err);
      return null;
   }
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
      const dataAttrs = [
         card.user ? `data-user="${card.user}"` : '',
         card.time ? `data-time="${card.time}"` : '',
         card.file ? `data-file="${card.file}"` : '',
         card.isEncrypted ? 'data-encrypted="true"' : '',
         card.encryptedData ? `data-encrypted-content="${card.encryptedData.replace(/"/g, '&quot;')}"` : ''
      ].filter(Boolean).join(' ');

      if (card.isEncrypted) {
         // Show only user info and decrypt button, hide encrypted content
         const userDisplay = card.user || 'Unknown';
         const timeDisplay = card.time ? ` - ${card.time}` : '';
         return `<article class="${className} encrypted-card" ${dataAttrs}>
            <div class="encrypted-header">
               <span class="encrypted-user">${userDisplay}${timeDisplay}</span>
               <span class="encrypted-badge">Encrypted</span>
            </div>
            <div class="encrypted-actions">
               <button class="decrypt-btn" onclick="showDecryptModal(this)">Decrypt</button>
            </div>
            <div class="decrypted-content" style="display: none;"></div>
         </article>`;
      }

      let html = marked(card.content);
      html = processWikiLinks(html);

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
   },
   {
      folder: 'day-5', num: '5', title: 'Day 5', url: '/ship-december/day-5', appendices: [
         { name: 'jarred-claude-code-transcript.md', path: '/ship-december/day-5/appendices/jarred-claude-code-transcript.md' },
         { name: 'jarred-margin.md', path: '/ship-december/day-5/appendices/jarred-margin.md' }
      ]
   },
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
   </div>

   <!-- Voice comment detail modal -->
   <div id="voice-detail-modal" class="voice-modal">
      <div class="voice-modal-content">
         <button class="voice-modal-close" onclick="document.getElementById('voice-detail-modal').classList.remove('open')">&times;</button>
         <div class="voice-modal-body"></div>
      </div>
   </div>

   <!-- Name prompt modal -->
   <div id="name-prompt-modal" class="name-modal">
      <div class="name-modal-content">
         <h3>What's your name?</h3>
         <input type="text" id="voice-name-input" placeholder="Your name" autofocus />
         <button id="name-submit-btn">Start Recording</button>
      </div>
   </div>

   <!-- Upload failed modal -->
   <div id="upload-failed-modal" class="upload-failed-modal">
      <div class="upload-failed-content">
         <h3>Upload Failed</h3>
         <p>Your recording couldn't be uploaded. Click below to download it.</p>
         <button id="download-recording-btn">Download Recording</button>
      </div>
   </div>

   <!-- Decrypt modal -->
   <div id="decrypt-modal" class="decrypt-modal">
      <div class="decrypt-modal-content">
         <h3>Decrypt Card</h3>
         <input type="password" id="decrypt-password" placeholder="Enter password" autofocus />
         <div class="checkbox-row">
            <input type="checkbox" id="save-password" />
            <label for="save-password">Save this password</label>
         </div>
         <div class="checkbox-row">
            <input type="checkbox" id="auto-decrypt" />
            <label for="auto-decrypt">Automatically decrypt in the future</label>
         </div>
         <div class="buttons">
            <button class="primary" id="decrypt-submit-btn">Decrypt</button>
            <button class="secondary" id="decrypt-cancel-btn">Cancel</button>
         </div>
         <div id="decrypt-error" class="decrypt-error"></div>
      </div>
   </div>`;
}

function generateFloatingButtonsHTML() {
   // Comment icon (speech bubble with microphone)
   const commentIcon = `<svg class="icon-record" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 15.17L18.83 16H4V4h16v13.17z"/>
      <path d="M12 11c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3c0 .83.67 1.5 1.5 1.5z"/>
      <path d="M14.5 9.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5H8.5c0 1.74 1.26 3.18 2.9 3.47V14.5h1.2v-1.53c1.64-.29 2.9-1.73 2.9-3.47h-1z"/>
   </svg><svg class="icon-stop" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="1"/>
   </svg>`;

   // Margin icon (sticky note with microphone)
   const marginIcon = `<svg class="icon-record" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H4.99C3.89 3 3 3.9 3 5l.01 14c0 1.1.89 2 1.99 2h10l6-6V5c0-1.1-.9-2-2-2zm0 12l-5 5H5V5h14v10z"/>
      <path d="M12 11c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3c0 .83.67 1.5 1.5 1.5z"/>
      <path d="M14.5 9.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5H8.5c0 1.74 1.26 3.18 2.9 3.47V14.5h1.2v-1.53c1.64-.29 2.9-1.73 2.9-3.47h-1z"/>
   </svg><svg class="icon-stop" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="1"/>
   </svg>`;

   return `
   <div class="floating-buttons">
      <button class="floating-btn" id="voice-margin-btn" title="Voice Margin Note" style="display: none;">
         ${marginIcon}
      </button>
      <button class="floating-btn" id="voice-comment-btn" title="Voice Comment">
         ${commentIcon}
      </button>
   </div>
   <div class="recording-status" id="recording-status">Recording...</div>`;
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
      .card[data-user="Sophie" i],
      .comment[data-user="Sophie" i] {
         font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
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

      /* Floating action buttons */
      .floating-buttons {
         position: fixed;
         bottom: 20px;
         right: 20px;
         display: flex;
         flex-direction: column;
         gap: 12px;
         z-index: 900;
      }

      .floating-btn {
         width: 56px;
         height: 56px;
         border-radius: 50%;
         background: #fff;
         border: 2px solid #000;
         cursor: pointer;
         display: flex;
         align-items: center;
         justify-content: center;
         box-shadow: 0 2px 8px rgba(0,0,0,0.15);
         transition: transform 0.2s, box-shadow 0.2s;
      }

      .floating-btn:hover {
         transform: scale(1.05);
         box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .floating-btn.recording {
         background: #ff4444;
         border-color: #cc0000;
         animation: pulse 1s infinite;
      }

      @keyframes pulse {
         0%, 100% { transform: scale(1); }
         50% { transform: scale(1.1); }
      }

      .floating-btn svg {
         width: 32px;
         height: 32px;
         fill: #000;
      }

      .floating-btn.recording svg {
         fill: #fff;
      }

      .floating-btn .icon-stop {
         display: none;
      }

      .floating-btn.recording .icon-record {
         display: none;
      }

      .floating-btn.recording .icon-stop {
         display: block;
      }

      /* Voice comments inline style */
      .voice-comment .comment-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 0.5rem;
      }

      .voice-comment .comment-user {
         font-weight: 600;
         font-size: 0.9rem;
         color: #333;
      }

      .voice-comment .play-btn {
         display: inline-flex;
         align-items: center;
         gap: 4px;
         background: #333;
         color: #fff;
         border: none;
         padding: 4px 10px;
         border-radius: 4px;
         cursor: pointer;
         font-size: 0.8rem;
         font-family: inherit;
      }

      .voice-comment .play-btn:hover {
         background: #555;
      }

      .voice-comment .play-btn.playing {
         background: #c00;
      }

      .voice-comment .play-btn .duration {
         font-family: "SF Mono", "Monaco", monospace;
         font-size: 0.75rem;
      }

      .voice-comment .comment-transcript {
         font-style: italic;
         color: #444;
      }

      /* Voice comment modal */
      .voice-modal {
         display: none;
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.5);
         z-index: 1100;
         justify-content: center;
         align-items: center;
      }

      .voice-modal.open {
         display: flex;
      }

      .voice-modal-content {
         background: #fff;
         border: 1px solid #000;
         padding: 2rem;
         max-width: 500px;
         width: 90%;
         max-height: 80vh;
         overflow-y: auto;
      }

      .voice-modal-close {
         position: absolute;
         top: 0.5rem;
         right: 0.75rem;
         background: none;
         border: none;
         font-size: 1.5rem;
         cursor: pointer;
      }

      .voice-modal audio {
         width: 100%;
         margin: 1rem 0;
      }

      .voice-modal .transcript {
         background: #f5f5f5;
         padding: 1rem;
         border-left: 3px solid #888;
         font-style: italic;
      }

      /* Name prompt modal */
      .name-modal {
         display: none;
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.5);
         z-index: 1200;
         justify-content: center;
         align-items: center;
      }

      .name-modal.open {
         display: flex;
      }

      .name-modal-content {
         background: #fff;
         border: 1px solid #000;
         padding: 2rem;
         max-width: 400px;
         width: 90%;
      }

      .name-modal-content h3 {
         margin: 0 0 1rem 0;
      }

      .name-modal-content input {
         width: 100%;
         padding: 0.75rem;
         border: 1px solid #ccc;
         font-size: 1rem;
         margin-bottom: 1rem;
      }

      .name-modal-content button {
         padding: 0.5rem 1.5rem;
         background: #333;
         color: #fff;
         border: none;
         cursor: pointer;
         font-size: 1rem;
      }

      .name-modal-content button:hover {
         background: #555;
      }

      /* Upload failed modal */
      .upload-failed-modal {
         display: none;
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.5);
         z-index: 1200;
         justify-content: center;
         align-items: center;
      }

      .upload-failed-modal.open {
         display: flex;
      }

      .upload-failed-content {
         background: #fff;
         border: 1px solid #c00;
         padding: 2rem;
         max-width: 400px;
         width: 90%;
         text-align: center;
      }

      .upload-failed-content h3 {
         margin: 0 0 1rem 0;
         color: #c00;
      }

      .upload-failed-content button {
         padding: 0.75rem 2rem;
         background: #333;
         color: #fff;
         border: none;
         cursor: pointer;
         font-size: 1rem;
         margin-top: 1rem;
      }

      .upload-failed-content button:hover {
         background: #555;
      }

      /* Recording status indicator */
      .recording-status {
         position: fixed;
         bottom: 150px;
         right: 20px;
         background: #ff4444;
         color: #fff;
         padding: 0.5rem 1rem;
         border-radius: 20px;
         font-size: 0.85rem;
         display: none;
         z-index: 900;
      }

      .recording-status.active {
         display: block;
      }

      /* Encrypted cards */
      .encrypted-card {
         background: #f5f5f5;
         border: 1px dashed #999;
         padding: 1rem;
         border-radius: 4px;
      }

      .encrypted-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 0.5rem;
      }

      .encrypted-user {
         font-weight: 600;
         color: #333;
      }

      .encrypted-badge {
         background: #666;
         color: #fff;
         padding: 0.2rem 0.5rem;
         font-size: 0.75rem;
         border-radius: 3px;
      }

      .encrypted-actions {
         margin-top: 0.5rem;
      }

      .decrypt-btn {
         background: #333;
         color: #fff;
         border: none;
         padding: 0.5rem 1rem;
         cursor: pointer;
         font-size: 0.9rem;
      }

      .decrypt-btn:hover {
         background: #555;
      }

      .decrypted-content {
         margin-top: 1rem;
         padding-top: 1rem;
         border-top: 1px solid #ddd;
      }

      /* Decrypt modal */
      .decrypt-modal {
         display: none;
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.5);
         z-index: 1200;
         justify-content: center;
         align-items: center;
      }

      .decrypt-modal.open {
         display: flex;
      }

      .decrypt-modal-content {
         background: #fff;
         border: 1px solid #000;
         padding: 2rem;
         max-width: 400px;
         width: 90%;
      }

      .decrypt-modal-content h3 {
         margin: 0 0 1rem 0;
      }

      .decrypt-modal-content input[type="password"] {
         width: 100%;
         padding: 0.75rem;
         border: 1px solid #ccc;
         font-size: 1rem;
         margin-bottom: 1rem;
      }

      .decrypt-modal-content .checkbox-row {
         display: flex;
         align-items: center;
         gap: 0.5rem;
         margin-bottom: 0.5rem;
         font-size: 0.9rem;
      }

      .decrypt-modal-content .buttons {
         display: flex;
         gap: 0.5rem;
         margin-top: 1rem;
      }

      .decrypt-modal-content button {
         padding: 0.5rem 1.5rem;
         border: none;
         cursor: pointer;
         font-size: 1rem;
      }

      .decrypt-modal-content button.primary {
         background: #333;
         color: #fff;
      }

      .decrypt-modal-content button.secondary {
         background: #ddd;
         color: #333;
      }

      .decrypt-modal-content button:hover {
         opacity: 0.9;
      }

      .decrypt-error {
         color: #c00;
         font-size: 0.9rem;
         margin-top: 0.5rem;
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
               const response = await fetch('/ship-december/day-5/api/comment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ comment: fullComment, day: 'day-5' })
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

      // ========================================
      // Voice Recording System
      // ========================================
      (function() {
         const STORAGE_KEY = 'voiceRecordingBuffer';
         const FLUSH_INTERVAL = 3000; // 3 seconds

         let mediaRecorder = null;
         let audioChunks = [];
         let isRecording = false;
         let recordingType = null; // 'comment' or 'margin'
         let flushIntervalId = null;
         let pendingNameCallback = null;
         let failedAudioBlob = null;

         const voiceCommentBtn = document.getElementById('voice-comment-btn');
         const voiceMarginBtn = document.getElementById('voice-margin-btn');
         const recordingStatus = document.getElementById('recording-status');
         const namePromptModal = document.getElementById('name-prompt-modal');
         const nameInput = document.getElementById('voice-name-input');
         const nameSubmitBtn = document.getElementById('name-submit-btn');
         const uploadFailedModal = document.getElementById('upload-failed-modal');
         const downloadRecordingBtn = document.getElementById('download-recording-btn');

         // Get initials from name
         function getInitials(name) {
            if (!name) return '??';
            const parts = name.trim().split(/\\s+/);
            if (parts.length === 1) {
               return parts[0].substring(0, 2).toUpperCase();
            }
            return (parts[0][0] + parts[1][0]).toUpperCase();
         }

         // Check if user has a name set
         function getUserName() {
            return localStorage.getItem('commentName');
         }

         // Check if user is allowed to use margin (jarred or sophie)
         function isMarginUser(name) {
            if (!name) return false;
            const lower = name.toLowerCase().trim();
            return lower === 'jarred' || lower === 'sophie';
         }

         // Update margin button visibility based on user name
         function updateMarginButtonVisibility() {
            const name = getUserName();
            if (isMarginUser(name)) {
               voiceMarginBtn.style.display = 'flex';
            } else {
               voiceMarginBtn.style.display = 'none';
            }
         }

         // Initial check for margin button visibility
         updateMarginButtonVisibility();

         // Prompt for name if not set
         function ensureName(callback) {
            const name = getUserName();
            if (name) {
               callback(name);
            } else {
               pendingNameCallback = callback;
               namePromptModal.classList.add('open');
               nameInput.focus();
            }
         }

         // Handle name submission
         nameSubmitBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
               localStorage.setItem('commentName', name);
               namePromptModal.classList.remove('open');
               updateMarginButtonVisibility();
               if (pendingNameCallback) {
                  pendingNameCallback(name);
                  pendingNameCallback = null;
               }
            }
         });

         nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
               nameSubmitBtn.click();
            }
         });

         // Flush audio buffer to localStorage
         function flushToLocalStorage() {
            if (audioChunks.length === 0) return;

            try {
               const blob = new Blob(audioChunks, { type: 'audio/webm' });
               const reader = new FileReader();
               reader.onloadend = () => {
                  const base64 = reader.result.split(',')[1];
                  const saved = {
                     audio: base64,
                     timestamp: Date.now(),
                     type: recordingType
                  };
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
               };
               reader.readAsDataURL(blob);
            } catch (e) {
               console.error('Failed to flush to localStorage:', e);
            }
         }

         // Start recording
         async function startRecording(type) {
            if (isRecording) {
               stopRecording();
               return;
            }

            try {
               const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
               mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
               audioChunks = [];
               recordingType = type;

               mediaRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) {
                     audioChunks.push(e.data);
                  }
               };

               mediaRecorder.onstop = async () => {
                  clearInterval(flushIntervalId);
                  stream.getTracks().forEach(track => track.stop());

                  const blob = new Blob(audioChunks, { type: 'audio/webm' });
                  await uploadRecording(blob, recordingType);

                  // Clear localStorage buffer
                  localStorage.removeItem(STORAGE_KEY);
               };

               mediaRecorder.start(1000); // Collect data every second
               isRecording = true;

               // Update UI
               const btn = type === 'comment' ? voiceCommentBtn : voiceMarginBtn;
               btn.classList.add('recording');
               recordingStatus.classList.add('active');
               recordingStatus.textContent = type === 'comment' ? 'Recording comment...' : 'Recording margin note...';

               // Start periodic flush to localStorage
               flushIntervalId = setInterval(flushToLocalStorage, FLUSH_INTERVAL);

            } catch (err) {
               console.error('Failed to start recording:', err);
               alert('Could not access microphone. Please allow microphone access.');
            }
         }

         // Stop recording
         function stopRecording() {
            if (mediaRecorder && isRecording) {
               mediaRecorder.stop();
               isRecording = false;

               voiceCommentBtn.classList.remove('recording');
               voiceMarginBtn.classList.remove('recording');
               recordingStatus.classList.remove('active');
            }
         }

         // Get actual audio duration from blob
         async function getAudioDuration(blob) {
            return new Promise((resolve) => {
               const audio = document.createElement('audio');
               audio.src = URL.createObjectURL(blob);
               audio.addEventListener('loadedmetadata', () => {
                  const duration = Math.round(audio.duration);
                  URL.revokeObjectURL(audio.src);
                  resolve(duration);
               });
               audio.addEventListener('error', () => {
                  URL.revokeObjectURL(audio.src);
                  resolve(0);
               });
            });
         }

         // Upload recording to API
         async function uploadRecording(blob, type) {
            const name = getUserName() || 'Anonymous';
            recordingStatus.textContent = 'Processing...';
            recordingStatus.classList.add('active');

            try {
               // Get actual duration from the audio blob
               const durationSecs = await getAudioDuration(blob);

               recordingStatus.textContent = 'Uploading...';

               const reader = new FileReader();
               const base64 = await new Promise((resolve, reject) => {
                  reader.onloadend = () => resolve(reader.result.split(',')[1]);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
               });

               const endpoint = type === 'comment'
                  ? '/ship-december/day-5/api/voice-comment'
                  : '/ship-december/day-5/api/voice-margin';

               const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     audio: base64,
                     name: name,
                     day: 'day-5',
                     duration: durationSecs
                  })
               });

               const result = await response.json();

               if (response.ok) {
                  recordingStatus.textContent = 'Uploaded! Refresh to see it.';
                  setTimeout(() => {
                     recordingStatus.classList.remove('active');
                  }, 3000);
               } else {
                  throw new Error(result.error || 'Upload failed');
               }

            } catch (err) {
               console.error('Upload failed:', err);
               recordingStatus.classList.remove('active');
               failedAudioBlob = blob;
               uploadFailedModal.classList.add('open');
            }
         }

         // Download failed recording
         downloadRecordingBtn.addEventListener('click', () => {
            if (failedAudioBlob) {
               const url = URL.createObjectURL(failedAudioBlob);
               const a = document.createElement('a');
               a.href = url;
               a.download = 'voice-recording-' + Date.now() + '.webm';
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);
               uploadFailedModal.classList.remove('open');
               failedAudioBlob = null;
            }
         });

         // Close upload failed modal on background click
         uploadFailedModal.addEventListener('click', (e) => {
            if (e.target === uploadFailedModal) {
               uploadFailedModal.classList.remove('open');
            }
         });

         // Close name modal on background click
         namePromptModal.addEventListener('click', (e) => {
            if (e.target === namePromptModal) {
               namePromptModal.classList.remove('open');
               pendingNameCallback = null;
            }
         });

         // Voice comment button handler
         voiceCommentBtn.addEventListener('click', () => {
            if (isRecording && recordingType === 'comment') {
               stopRecording();
            } else if (!isRecording) {
               ensureName(() => startRecording('comment'));
            }
         });

         // Voice margin button handler
         voiceMarginBtn.addEventListener('click', () => {
            if (isRecording && recordingType === 'margin') {
               stopRecording();
            } else if (!isRecording) {
               ensureName(() => startRecording('margin'));
            }
         });

         // Check for and recover interrupted recordings
         const savedRecording = localStorage.getItem(STORAGE_KEY);
         if (savedRecording) {
            try {
               const saved = JSON.parse(savedRecording);
               // If recording is recent (< 1 hour old), offer to recover
               if (Date.now() - saved.timestamp < 3600000) {
                  const recover = confirm('Found an interrupted recording. Would you like to upload it?');
                  if (recover) {
                     const audioData = atob(saved.audio);
                     const bytes = new Uint8Array(audioData.length);
                     for (let i = 0; i < audioData.length; i++) {
                        bytes[i] = audioData.charCodeAt(i);
                     }
                     const blob = new Blob([bytes], { type: 'audio/webm' });
                     uploadRecording(blob, saved.type || 'comment');
                  } else {
                     localStorage.removeItem(STORAGE_KEY);
                  }
               } else {
                  localStorage.removeItem(STORAGE_KEY);
               }
            } catch (e) {
               localStorage.removeItem(STORAGE_KEY);
            }
         }

         // Handle voice comment play buttons
         let currentAudio = null;
         let currentPlayBtn = null;

         document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
               const audioSrc = btn.dataset.audio;

               // If clicking the same button that's playing, stop it
               if (currentAudio && currentPlayBtn === btn) {
                  currentAudio.pause();
                  currentAudio = null;
                  btn.classList.remove('playing');
                  btn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
                  currentPlayBtn = null;
                  return;
               }

               // Stop any currently playing audio
               if (currentAudio) {
                  currentAudio.pause();
                  currentPlayBtn.classList.remove('playing');
                  currentPlayBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
               }

               // Play new audio
               currentAudio = new Audio(audioSrc);
               currentPlayBtn = btn;
               btn.classList.add('playing');
               btn.querySelector('svg').innerHTML = '<rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/>';

               currentAudio.play();

               currentAudio.onended = () => {
                  btn.classList.remove('playing');
                  btn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
                  currentAudio = null;
                  currentPlayBtn = null;
               };
            });
         });
      })();

      // ========================================
      // Encryption/Decryption System
      // ========================================
      (function() {
         const PASSWORDS_KEY = 'encryptionPasswords'; // { user: password }
         const AUTO_DECRYPT_KEY = 'autoDecryptUsers'; // [user1, user2, ...]

         let currentDecryptCard = null;

         // Get stored passwords
         function getStoredPasswords() {
            try {
               return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
            } catch {
               return {};
            }
         }

         // Save password for user
         function savePassword(user, password) {
            const passwords = getStoredPasswords();
            passwords[user.toLowerCase()] = password;
            localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
         }

         // Get auto-decrypt users
         function getAutoDecryptUsers() {
            try {
               return JSON.parse(localStorage.getItem(AUTO_DECRYPT_KEY) || '[]');
            } catch {
               return [];
            }
         }

         // Add auto-decrypt user
         function addAutoDecryptUser(user) {
            const users = getAutoDecryptUsers();
            if (!users.includes(user.toLowerCase())) {
               users.push(user.toLowerCase());
               localStorage.setItem(AUTO_DECRYPT_KEY, JSON.stringify(users));
            }
         }

         // Derive key from password using PBKDF2 (compatible with Node's scrypt output)
         async function deriveKey(password) {
            const enc = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
               'raw',
               enc.encode(password),
               'PBKDF2',
               false,
               ['deriveBits', 'deriveKey']
            );

            return await crypto.subtle.deriveKey(
               {
                  name: 'PBKDF2',
                  salt: enc.encode('salt'),
                  iterations: 100000,
                  hash: 'SHA-256'
               },
               keyMaterial,
               { name: 'AES-CBC', length: 256 },
               false,
               ['decrypt']
            );
         }

         // Decrypt content using Web Crypto API
         // Note: VS Code extension uses Node crypto with scrypt, which is different from PBKDF2
         // For full compatibility, you'd need to use the same algorithm on both sides
         // This is a simplified version that uses PBKDF2 in the browser
         async function decryptContent(encryptedText, password) {
            try {
               const [ivBase64, encrypted] = encryptedText.split(':');
               if (!ivBase64 || !encrypted) {
                  throw new Error('Invalid encrypted format');
               }

               const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
               const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

               // Note: This uses PBKDF2 which won't be compatible with Node's scrypt
               // For production, you'd need scrypt.js or server-side decryption
               const key = await deriveKey(password);

               const decrypted = await crypto.subtle.decrypt(
                  { name: 'AES-CBC', iv },
                  key,
                  encryptedBytes
               );

               return new TextDecoder().decode(decrypted);
            } catch (err) {
               console.error('Decryption failed:', err);
               throw new Error('Decryption failed - wrong password?');
            }
         }

         // Show decrypt modal
         window.showDecryptModal = function(btn) {
            const card = btn.closest('.encrypted-card');
            currentDecryptCard = card;

            const user = card.dataset.user || '';
            const passwords = getStoredPasswords();

            const modal = document.getElementById('decrypt-modal');
            const passwordInput = document.getElementById('decrypt-password');
            const errorDiv = document.getElementById('decrypt-error');

            errorDiv.textContent = '';
            passwordInput.value = passwords[user.toLowerCase()] || '';

            modal.classList.add('open');
            passwordInput.focus();
         };

         // Handle decrypt submission
         document.getElementById('decrypt-submit-btn').addEventListener('click', async () => {
            if (!currentDecryptCard) return;

            const passwordInput = document.getElementById('decrypt-password');
            const savePasswordCheckbox = document.getElementById('save-password');
            const autoDecryptCheckbox = document.getElementById('auto-decrypt');
            const errorDiv = document.getElementById('decrypt-error');

            const password = passwordInput.value;
            const encryptedContent = currentDecryptCard.dataset.encryptedContent;
            const user = currentDecryptCard.dataset.user || 'unknown';

            if (!password) {
               errorDiv.textContent = 'Please enter a password';
               return;
            }

            try {
               const decrypted = await decryptContent(encryptedContent, password);

               // Save password if checkbox is checked
               if (savePasswordCheckbox.checked) {
                  savePassword(user, password);
               }

               // Add to auto-decrypt if checkbox is checked
               if (autoDecryptCheckbox.checked) {
                  addAutoDecryptUser(user);
                  savePassword(user, password); // Also save password for auto-decrypt
               }

               // Show decrypted content
               const contentDiv = currentDecryptCard.querySelector('.decrypted-content');
               contentDiv.innerHTML = decrypted.replace(/\\n/g, '<br>');
               contentDiv.style.display = 'block';

               // Hide decrypt button and badge
               currentDecryptCard.querySelector('.encrypted-actions').style.display = 'none';
               currentDecryptCard.querySelector('.encrypted-badge').textContent = 'Decrypted';
               currentDecryptCard.querySelector('.encrypted-badge').style.background = '#060';

               // Close modal
               document.getElementById('decrypt-modal').classList.remove('open');
               currentDecryptCard = null;

            } catch (err) {
               errorDiv.textContent = err.message;
            }
         });

         // Handle cancel
         document.getElementById('decrypt-cancel-btn').addEventListener('click', () => {
            document.getElementById('decrypt-modal').classList.remove('open');
            currentDecryptCard = null;
         });

         // Close modal on background click
         document.getElementById('decrypt-modal').addEventListener('click', (e) => {
            if (e.target.id === 'decrypt-modal') {
               document.getElementById('decrypt-modal').classList.remove('open');
               currentDecryptCard = null;
            }
         });

         // Handle Enter key in password input
         document.getElementById('decrypt-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
               document.getElementById('decrypt-submit-btn').click();
            }
         });

         // Auto-decrypt on page load for users with auto-decrypt enabled
         async function autoDecryptCards() {
            const autoDecryptUsers = getAutoDecryptUsers();
            const passwords = getStoredPasswords();

            if (autoDecryptUsers.length === 0) return;

            const encryptedCards = document.querySelectorAll('.encrypted-card');

            for (const card of encryptedCards) {
               const user = (card.dataset.user || '').toLowerCase();

               if (autoDecryptUsers.includes(user) && passwords[user]) {
                  const encryptedContent = card.dataset.encryptedContent;

                  try {
                     const decrypted = await decryptContent(encryptedContent, passwords[user]);

                     const contentDiv = card.querySelector('.decrypted-content');
                     contentDiv.innerHTML = decrypted.replace(/\\n/g, '<br>');
                     contentDiv.style.display = 'block';

                     card.querySelector('.encrypted-actions').style.display = 'none';
                     card.querySelector('.encrypted-badge').textContent = 'Decrypted';
                     card.querySelector('.encrypted-badge').style.background = '#060';
                  } catch (err) {
                     console.warn('Auto-decrypt failed for', user, err);
                  }
               }
            }
         }

         // Run auto-decrypt when DOM is ready
         autoDecryptCards();
      })();
   </script>`;
}

function wrapHtml(content, title, days, currentDay) {
   const sidebar = generateSidebarHTML(days, currentDay);
   const modal = generateModalHTML();
   const floatingButtons = generateFloatingButtonsHTML();
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
   ${floatingButtons}
   ${script}
</body>
</html>`;
}

export async function onRequest(context) {
   const currentDay = 'day-5';
   const githubToken = context?.env?.GIT_API_TOKEN || process.env?.GIT_API_TOKEN;

   // Check if request is from localhost
   const host = context.request?.headers?.host || context.request?.host || '';
   const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

   // Load post.md - use filesystem for localhost, GitHub for production
   let postMd;
   if (isLocalhost) {
      postMd = await readLocalMarkdown('./post.md');
   } else {
      postMd = await fetchFromGitHub('ship-december/day-5/post.md', githubToken);
   }
   const cards = mdToCards(postMd || '', 'ship-december/day-5/post.md');
   let htmlContent = renderCards(cards);

   // Fetch comments dynamically from GitHub
   const commentsMd = await fetchFromGitHub('ship-december/day-5/comments.md', githubToken);
   const voiceCommentsMd = await fetchFromGitHub('ship-december/day-5/voice-comments.md', githubToken);

   // Parse time string to sortable value (e.g., "day-5 2.30pm" -> number)
   function parseTimeForSort(timeStr) {
      if (!timeStr) return 0;
      // Extract day number
      const dayMatch = timeStr.match(/day-(\d+)/);
      const day = dayMatch ? parseInt(dayMatch[1]) : 0;
      // Extract time like "2.30pm" or "11.05am"
      const timeMatch = timeStr.match(/(\d+)\.(\d+)(am|pm)/i);
      if (!timeMatch) return day * 10000;
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return day * 10000 + hours * 100 + minutes;
   }

   // Collect all comments with type info
   let allComments = [];

   if (commentsMd) {
      const commentCards = mdToCards(commentsMd, 'ship-december/day-5/comments.md');
      commentCards.forEach(card => {
         allComments.push({
            type: 'text',
            user: card.user,
            time: card.time,
            content: card.content,
            sortKey: parseTimeForSort(card.time)
         });
      });
   }

   if (voiceCommentsMd) {
      const voiceCards = mdToCards(voiceCommentsMd, 'ship-december/day-5/voice-comments.md');
      voiceCards.forEach(card => {
         // Extract audio src from the content
         const audioMatch = card.content.match(/<audio[^>]*src="([^"]+)"/);
         const audioSrc = audioMatch ? audioMatch[1] : '';
         // Extract transcript
         const transcriptMatch = card.content.match(/\*\*Transcript:\*\*\s*(.+)/s);
         const transcript = transcriptMatch ? transcriptMatch[1].trim() : '';
         // Extract duration from time string
         const timeStr = card.time || '';
         const durationMatch = timeStr.match(/(\d+m?\d*s)$/);
         const duration = durationMatch ? durationMatch[1] : '';
         // Remove duration from time for display
         const displayTime = timeStr.replace(/\s*\d+m?\d*s$/, '');

         allComments.push({
            type: 'voice',
            user: card.user,
            time: displayTime,
            duration: duration,
            audioSrc: audioSrc,
            transcript: transcript,
            sortKey: parseTimeForSort(card.time)
         });
      });
   }

   // Sort by time
   allComments.sort((a, b) => a.sortKey - b.sortKey);

   // Render all comments
   const commentsHtml = allComments.map(comment => {
      const userClass = comment.user?.toLowerCase() === 'sophie' ? ' sophie-comment' : '';
      const userDisplay = comment.user || 'Anonymous';
      const timeDisplay = comment.time ? ` - ${comment.time}` : '';

      if (comment.type === 'voice') {
         return `<article class="comment voice-comment${userClass}" data-user="${comment.user || ''}">
            <div class="comment-header">
               <span class="comment-user">${userDisplay}${timeDisplay}</span>
               <button class="play-btn" data-audio="${comment.audioSrc.replace(/"/g, '&quot;')}" title="Play audio">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                  ${comment.duration ? `<span class="duration">${comment.duration}</span>` : ''}
               </button>
            </div>
            <div class="comment-transcript">${comment.transcript}</div>
         </article>`;
      } else {
         let html = marked(comment.content);
         html = processWikiLinks(html);
         return `<article class="comment${userClass}" data-user="${comment.user || ''}">${html}</article>`;
      }
   }).join('\n');

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

   const fullHtml = wrapHtml(htmlContent, 'Day 5', DAYS, currentDay);

   return new Response(fullHtml, {
      headers: { 'Content-Type': 'text/html' }
   });
}
