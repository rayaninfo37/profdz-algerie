/**
 * Netlify Edge Function — strip Netlify's injected HTML comment from all page responses.
 * This removes the "This site is hosted on Netlify" comment that Netlify injects into
 * HTML responses at the CDN layer. Runs at the Edge (0ms overhead, no cold start).
 */
export default async function handler(req: Request) {
  const response = await fetch(req);

  const contentType = response.headers.get('content-type') || '';
  // Only process HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();

  // Remove the Netlify-injected promotional HTML comment block
  const cleaned = html.replace(
    /<!--\s*This site is hosted on Netlify[\s\S]*?-->/g,
    ''
  );

  return new Response(cleaned, {
    status: response.status,
    headers: response.headers,
  });
}

export const config = {
  path: '/*',
};
