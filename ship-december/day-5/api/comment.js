// Comment API handler
// Dev: uses fs to append locally
// Production: uses GitHub API to commit

const REPO_OWNER = 'filmerjarred';
const REPO_NAME = 'sophie-jarred-research-log';
const BRANCH = 'main';
const MAX_RETRIES = 3;

// Production: use GitHub API with retry logic for race conditions
async function handleProd(day, comment, githubToken) {
   const filePath = `ship-december/${day}/comments.md`;
   const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

   const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ship-december-comments'
   };

   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // 1. Get current file (fresh each attempt to handle race conditions)
      let currentContent = '';
      let sha = null;

      const getResponse = await fetch(apiBase + `?ref=${BRANCH}`, { headers });

      if (getResponse.ok) {
         const data = await getResponse.json();
         sha = data.sha;
         currentContent = atob(data.content.replace(/\n/g, ''));
      } else if (getResponse.status !== 404) {
         throw new Error(`GitHub API error: ${getResponse.status}`);
      }

      // 2. Append comment
      const newContent = currentContent + '\n\n- - -\n\n' + comment;

      // 3. Commit the update
      const putBody = {
         message: `Add comment to ${day}`,
         content: btoa(newContent),
         branch: BRANCH
      };
      if (sha) {
         putBody.sha = sha;
      }

      const putResponse = await fetch(apiBase, {
         method: 'PUT',
         headers,
         body: JSON.stringify(putBody)
      });

      if (putResponse.ok) {
         return { status: 'ok', mode: 'prod', attempt };
      }

      // Check if it's a conflict (409) - retry
      if (putResponse.status === 409 && attempt < MAX_RETRIES) {
         console.log(`Conflict detected, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
         await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
         continue;
      }

      const err = await putResponse.text();
      throw new Error(`GitHub commit failed: ${putResponse.status} - ${err}`);
   }
}

export async function onRequest(context) {
   const { request, env } = context;

   if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
   }

   try {
      const body = await request.json();
      const comment = body.comment;
      const day = body.day || 'day-5';  // default to day-5, or pass explicitly

      if (!comment || typeof comment !== 'string') {
         return new Response(JSON.stringify({ error: 'comment required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
         });
      }

      let result;

      // Check if we have a GitHub token (from env.GIT_API_TOKEN or env.GITHUB_TOKEN)
      const githubToken = env?.GIT_API_TOKEN || env?.GITHUB_TOKEN || process.env?.GIT_API_TOKEN;

      if (githubToken) {
         result = await handleProd(day, comment, githubToken);
      } else {
         // result = await handleDev(day, comment);
      }

      return new Response(JSON.stringify(result), {
         headers: { 'Content-Type': 'application/json' }
      });

   } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
      });
   }
}

// Dev test:
// curl -X POST -k https://localhost:3000/ship-december/day-5/api/comment \
//   -H "Content-Type: application/json" \
//   -d '{"comment": "your comment here", "day": "day-5"}'

// curl -X POST -k https://sophie-jarred.researchlog.dev/ship-december/day-5/api/comment -H "Content-Type: application/json" -d '{"comment": "your comment here", "day": "day-5"}'