/**
 * Netlify Edge Function — runs at the CDN edge on all HTML requests.
 * Strips any injected provider comments or badges before sending the response to the browser.
 */
export default async function handler(request, context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  // Only transform HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  const text = await response.text();
  const cleaned = text.replace(
    /<!--\s*This site is hosted on Netlify[\s\S]*?-->/gi,
    ''
  );

  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(cleaned, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
