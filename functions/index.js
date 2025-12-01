export async function onRequest(context) {
  // context.env - environment variables
  // context.params - URL parameters
  // context.request - the incoming request

  const url = new URL(context.request.url);

  // For now, just serve a simple response
  // Later you can add markdown rendering, routing, etc.

  if (url.pathname === '/') {
    return new Response(`
      <html>
        <head><title>Research Log</title></head>
        <body>
          <h1>Sophie & Jarred Research Log</h1>
          <ul>
            <li><a href="/day-1">Day 1</a></li>
          </ul>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Let other requests fall through to static assets
  return context.next();
}
