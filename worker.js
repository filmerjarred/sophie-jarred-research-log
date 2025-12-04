// worker.js - handles routes not covered by static assets

// Import API handlers - add new ones here
import * as day4Comment from './ship-december/day-4/api/comment.js';

const apiRoutes = {
   '/ship-december/day-4/api/comment': day4Comment,
};

export default {
   async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;

      // Check for API routes
      if (apiRoutes[path]) {
         const handler = apiRoutes[path];
         if (handler.onRequest) {
            return handler.onRequest({ request, env });
         }
      }

      // For paths like /ship-december/day-1 (no trailing slash),
      // the static assets will serve /ship-december/day-1/index.html automatically

      // Return 404 for anything not found in static assets
      return new Response('Not Found', { status: 404 });
   },
};
