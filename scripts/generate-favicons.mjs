import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const src = 'public/logok.png';
  if (!fs.existsSync(src)) {
    throw new Error('public/logok.png not found');
  }

  console.log('Generating optimized favicons and app icons from public/logok.png...');

  // 1. Generate 32x32 PNG (favicon-32x32.png)
  const png32Buffer = await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/favicon-32x32.png', png32Buffer);

  // 2. Generate 16x16 PNG
  const png16Buffer = await sharp(src)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/favicon-16x16.png', png16Buffer);

  // 3. Generate 48x48 PNG
  const png48Buffer = await sharp(src)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/favicon-48x48.png', png48Buffer);

  // 4. Generate standard multi-size ICO file for /favicon.ico
  // An ICO header format with 16x16 and 32x32 PNG entries
  function createIco(images) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // ICO type = 1
    header.writeUInt16LE(images.length, 4); // count of images

    let offset = 6 + (images.length * 16);
    const directoryEntries = [];
    const imageBuffers = [];

    for (const img of images) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
      entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
      entry.writeUInt8(0, 2); // color palette count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(img.data.length, 8); // size of image data
      entry.writeUInt32LE(offset, 12); // offset of data

      directoryEntries.push(entry);
      imageBuffers.push(img.data);
      offset += img.data.length;
    }

    return Buffer.concat([header, ...directoryEntries, ...imageBuffers]);
  }

  const icoBuffer = createIco([
    { width: 16, height: 16, data: png16Buffer },
    { width: 32, height: 32, data: png32Buffer },
    { width: 48, height: 48, data: png48Buffer },
  ]);

  fs.writeFileSync('public/favicon.ico', icoBuffer);
  fs.writeFileSync('src/app/favicon.ico', icoBuffer);
  console.log('✅ Created public/favicon.ico and src/app/favicon.ico (size:', icoBuffer.length, 'bytes)');

  // 5. Generate Apple Touch Icon 180x180
  const appleTouchBuffer = await sharp(src)
    .resize(180, 180, { fit: 'contain', background: { r: 14, g: 165, b: 233, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', appleTouchBuffer);
  console.log('✅ Created public/apple-touch-icon.png');

  // 6. Generate Android / PWA Icons (192x192, 512x512)
  const icon192 = await sharp(src)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/icon-192.png', icon192);

  const icon512 = await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync('public/icon-512.png', icon512);
  console.log('✅ Created public/icon-192.png and public/icon-512.png');
}

generate().catch(console.error);
