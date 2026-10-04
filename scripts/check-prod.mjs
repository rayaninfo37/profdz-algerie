async function main() {
  const res = await fetch('https://profalgerie.netlify.app/');
  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  const text = await res.text();
  console.log('Body length:', text.length);

  const base64Matches = text.match(/data:image\/[^;]+;base64,[^"]+/g);
  console.log('Base64 images count:', base64Matches ? base64Matches.length : 0);
  if (base64Matches) {
    let totalLen = 0;
    for (const b of base64Matches) totalLen += b.length;
    console.log('Total base64 bytes:', totalLen);
  }

  // Check what else is big
  const scripts = text.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log('Total scripts count:', scripts.length);
  let scriptLen = 0;
  for (const s of scripts) scriptLen += s.length;
  console.log('Total scripts chars:', scriptLen);

  console.log('Has netlify comment:', text.includes('This site is hosted on Netlify'));
  console.log('Has logok:', text.includes('logok.png'));
  console.log('Has favicon.ico:', text.includes('favicon.ico'));
}

main().catch(console.error);
