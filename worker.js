// worker.js - handles routes not covered by static assets

// Import API handlers - add new ones here
import * as day4Comment from './ship-december/day-4/api/comment.js';
import * as day4VoiceComment from './ship-december/day-4/api/voice-comment.js';
import * as day4VoiceMargin from './ship-december/day-4/api/voice-margin.js';
import * as day4Blob from './ship-december/day-4/api/blob.js';
import * as day4 from './ship-december/day-4/index.js';

import * as day5Comment from './ship-december/day-5/api/comment.js';
import * as day5VoiceComment from './ship-december/day-5/api/voice-comment.js';
import * as day5VoiceMargin from './ship-december/day-5/api/voice-margin.js';
import * as day5Blob from './ship-december/day-5/api/blob.js';
import * as day5 from './ship-december/day-5/index.js';

const apiRoutes = {
   '/ship-december/day-4/api/comment': day4Comment,
   '/ship-december/day-4/api/voice-comment': day4VoiceComment,
   '/ship-december/day-4/api/voice-margin': day4VoiceMargin,
   '/ship-december/day-4/api/blob': day4Blob,
   '/ship-december/day-4/': day4,

   '/ship-december/day-5/api/comment': day4Comment,
   '/ship-december/day-5/api/voice-comment': day4VoiceComment,
   '/ship-december/day-5/api/voice-margin': day4VoiceMargin,
   '/ship-december/day-5/api/blob': day4Blob,
   '/ship-december/day-5/': day4,
};

export default {
   async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;

      // Add trailing slash if missing (except for files with extensions or API routes)
      if (!path.endsWith('/') && !path.includes('.') && !path.includes('/api/')) {
         url.pathname = path + '/';
         return Response.redirect(url.toString(), 301);
      }

      // Check for API routes (path without query string)
      if (apiRoutes[path]) {
         const handler = apiRoutes[path];
         if (handler.onRequest) {
            return handler.onRequest({ request, env });
         }
      }

      // static assets will serve /ship-december/day-1/index.html automatically

      // Return 404 for anything not found in static assets
      return new Response('Not Found', { status: 404 });
   },
};
