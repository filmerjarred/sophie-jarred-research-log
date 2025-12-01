export async function onRequest(context) {
  // This handles /day-1 route
  // Later you could fetch the markdown file and render it

  const content = `
    <html>
      <head><title>Day 1 - Research Log</title></head>
      <body>
        <h1>Day 1</h1>
        <p>yay!</p>
        <p><a href="/">← Back</a></p>
      </body>
    </html>
  `;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
}
