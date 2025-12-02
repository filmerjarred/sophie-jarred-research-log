// worker.js - handles routes not covered by static assets
export default {
   async fetch(request, env) {
      const url = new URL(request.url);

      // For paths like /ship-december/day-1 (no trailing slash),
      // the static assets will serve /ship-december/day-1/index.html automatically

      // Return 404 for anything not found in static assets
      return new Response('Not Found', { status: 404 });
   },
};
