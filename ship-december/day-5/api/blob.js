// Blob proxy API - fetches audio blobs from GitHub
// Usage: /ship-december/day-5/api/blob?file=1234567890-name.webm

const REPO_OWNER = 'filmerjarred';
const REPO_NAME = 'sophie-jarred-research-log';
const BRANCH = 'main';

export async function onRequest(context) {
   const { request, env } = context;

   // Parse the file parameter from URL
   const url = new URL(request.url, 'https://localhost');
   const filename = url.searchParams.get('file');

   if (!filename) {
      return new Response('Missing file parameter', { status: 400 });
   }

   // Sanitize filename to prevent path traversal
   const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
   if (safeFilename !== filename) {
      return new Response('Invalid filename', { status: 400 });
   }

   const githubToken = env?.GIT_API_TOKEN || env?.GITHUB_TOKEN || process.env?.GIT_API_TOKEN;

   try {
      const filePath = `ship-december/day-5/blobs/${safeFilename}`;
      const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`;

      const headers = {
         'Accept': 'application/vnd.github+json',
         'X-GitHub-Api-Version': '2022-11-28',
         'User-Agent': 'ship-december-blobs'
      };

      if (githubToken) {
         headers['Authorization'] = `Bearer ${githubToken}`;
      }

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
         if (response.status === 404) {
            return new Response('Blob not found', { status: 404 });
         }
         throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Decode base64 content
      const binaryString = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
         bytes[i] = binaryString.charCodeAt(i);
      }

      return new Response(bytes, {
         headers: {
            'Content-Type': 'audio/webm',
            'Cache-Control': 'public, max-age=31536000' // Cache for 1 year (blobs are immutable)
         }
      });

   } catch (err) {
      return new Response(`Error fetching blob: ${err.message}`, { status: 500 });
   }
}
