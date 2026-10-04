async function main() {
  const r = await fetch('https://profalgerie.netlify.app/');
  console.log('Date:', r.headers.get('date'));
  console.log('Age:', r.headers.get('age'));
  console.log('x-nextjs-date:', r.headers.get('x-nextjs-date'));
  console.log('Cache-Status:', r.headers.get('cache-status'));
  console.log('Cache-Control:', r.headers.get('cache-control'));
  console.log('x-nf-request-id:', r.headers.get('x-nf-request-id'));

  const html = await r.text();
  const scripts = html.match(/src="\/_next\/static\/chunks\/[^"]+"/g) || [];
  console.log('Sample script chunks:', scripts.slice(0, 5));
  console.log('Has manifest in HTML:', html.includes('manifest.json'));
  console.log('Has favicon.ico in HTML:', html.includes('favicon.ico'));
  console.log('Has logok in HTML:', html.includes('logok.png'));

  // Also check /about
  const aboutRes = await fetch('https://profalgerie.netlify.app/about');
  const aboutHtml = await aboutRes.text();
  console.log('About page has 9ERQ4_v7B7c:', aboutHtml.includes('9ERQ4_v7B7c'));
  console.log('About page has iframe:', aboutHtml.includes('iframe'));
}

main().catch(console.error);
