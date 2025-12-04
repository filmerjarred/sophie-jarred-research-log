// Voice Margin API handler
// Accepts audio, transcribes with OpenAI, saves audio blob + transcript to user's margin file

const REPO_OWNER = 'filmerjarred';
const REPO_NAME = 'sophie-jarred-research-log';
const BRANCH = 'main';
const MAX_RETRIES = 3;

async function transcribeAudio(audioBase64, openaiKey) {
   // Convert base64 to blob for OpenAI API
   const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

   const formData = new FormData();
   formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
   formData.append('model', 'whisper-1');

   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
         'Authorization': `Bearer ${openaiKey}`
      },
      body: formData
   });

   if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI transcription failed: ${response.status} - ${err}`);
   }

   const result = await response.json();
   return result.text;
}

async function saveBlob(filePath, base64Content, message, githubToken) {
   const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
   const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ship-december-voice-margin'
   };

   const putBody = {
      message,
      content: base64Content,
      branch: BRANCH
   };

   const putResponse = await fetch(apiBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody)
   });

   if (!putResponse.ok) {
      const err = await putResponse.text();
      throw new Error(`GitHub blob commit failed: ${putResponse.status} - ${err}`);
   }

   return { status: 'ok' };
}

async function appendToFile(filePath, newContent, message, githubToken, maxRetries = MAX_RETRIES) {
   const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
   const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ship-december-voice-margin'
   };

   for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      // 2. Append new content (margin uses --- separator)
      const finalContent = currentContent + '\n\n---\n\n' + newContent;

      // 3. Commit the update
      const putBody = {
         message,
         content: btoa(finalContent),
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
         return { status: 'ok', attempt };
      }

      // Check if it's a conflict (409) - retry
      if (putResponse.status === 409 && attempt < maxRetries) {
         console.log(`Conflict detected, retrying (attempt ${attempt + 1}/${maxRetries})...`);
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
      const { audio, name, day } = body;

      if (!audio || typeof audio !== 'string') {
         return new Response(JSON.stringify({ error: 'audio (base64) required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
         });
      }

      if (!name || typeof name !== 'string') {
         return new Response(JSON.stringify({ error: 'name required for margin notes' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
         });
      }

      const githubToken = env?.GIT_API_TOKEN || env?.GITHUB_TOKEN || process.env?.GIT_API_TOKEN;
      const openaiKey = env?.OPENAI_API_KEY || process.env?.OPENAI_API_KEY;

      if (!githubToken) {
         return new Response(JSON.stringify({ error: 'GitHub token not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
         });
      }

      if (!openaiKey) {
         return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
         });
      }

      // Transcribe the audio
      const transcript = await transcribeAudio(audio, openaiKey);

      // Format timestamp
      const now = new Date();
      const dayNum = now.getDate();
      const dayStr = day || 'day-' + dayNum;
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      const timeStr = hours + '.' + String(minutes).padStart(2, '0') + ampm;

      // Normalize name to lowercase for file path (e.g., "Jarred" -> "jarred")
      const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');

      // Generate unique blob filename
      const timestamp = Date.now();
      const blobFilename = `${timestamp}-${normalizedName}.webm`;
      const blobPath = `ship-december/${dayStr}/blobs/${blobFilename}`;

      // Save the audio blob first
      await saveBlob(
         blobPath,
         audio,
         `Add voice margin audio from ${name}`,
         githubToken
      );

      // Build the voice margin markdown with reference to blob
      const voiceMargin = `### ${timeStr}

<audio controls src="/ship-december/${dayStr}/blobs/${blobFilename}"></audio>

${transcript}`;

      // Commit to user's margin file in appendices
      const filePath = `ship-december/${dayStr}/appendices/${normalizedName}-margin.md`;

      const result = await appendToFile(
         filePath,
         voiceMargin,
         `Add voice margin note from ${name} to ${dayStr}`,
         githubToken
      );

      return new Response(JSON.stringify({
         status: 'ok',
         transcript,
         blob: blobFilename,
         file: filePath,
         ...result
      }), {
         headers: { 'Content-Type': 'application/json' }
      });

   } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
      });
   }
}
