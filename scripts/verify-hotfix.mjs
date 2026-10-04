import { performance } from 'perf_hooks';

async function verify() {
  console.log('--- Verifying Production Deployment ---');

  // 1. Check favicon.ico
  try {
    const start = performance.now();
    const res = await fetch('https://profalgerie.netlify.app/favicon.ico');
    const elapsed = Math.round(performance.now() - start);
    const buf = await res.arrayBuffer();
    console.log(`[Favicon] Status: ${res.status}, Size: ${buf.byteLength} bytes (Elapsed: ${elapsed}ms)`);
    if (buf.byteLength === 6455) {
      console.log('  ✅ PROF DZ custom favicon.ico is LIVE! (Netlify default 15KB replaced)');
    } else {
      console.log(`  ⏳ Favicon size ${buf.byteLength} bytes — waiting for deploy propagation...`);
    }
  } catch (e) {
    console.error('Favicon fetch error:', e.message);
  }

  // 2. Check manifest.json
  try {
    const res = await fetch('https://profalgerie.netlify.app/manifest.json');
    console.log(`[Manifest] Status: ${res.status}`);
    if (res.ok) {
      const json = await res.json();
      console.log(`  ✅ Manifest Name: "${json.name}"`);
    }
  } catch (e) {
    console.error('Manifest fetch error:', e.message);
  }

  // 3. Check Homepage Response & Latency
  try {
    const start = performance.now();
    const res = await fetch('https://profalgerie.netlify.app/');
    const elapsed = Math.round(performance.now() - start);
    const html = await res.text();
    console.log(`[Homepage] Status: ${res.status}, Latency: ${elapsed}ms, Cache-Control: ${res.headers.get('cache-control')}`);
    console.log(`  Has manifest link: ${html.includes('manifest.json')}`);
    console.log(`  Has custom favicon link: ${html.includes('favicon.ico')}`);
    console.log(`  Has PROF DZ title: ${html.includes('PROF DZ')}`);
  } catch (e) {
    console.error('Homepage fetch error:', e.message);
  }
}

verify().catch(console.error);
