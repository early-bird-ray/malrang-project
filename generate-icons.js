const sharp = require('sharp');
const path = require('path');

async function generate() {
  const publicDir = path.join(__dirname, 'public');
  const originalLogo = path.join(__dirname, 'logo_final.png');

  // Generate logo512.png from original
  await sharp(originalLogo)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(path.join(publicDir, 'logo512.png'));
  console.log('Created logo512.png');

  // Generate logo192.png from original
  await sharp(originalLogo)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(path.join(publicDir, 'logo192.png'));
  console.log('Created logo192.png');

  // Generate favicon.ico (32x32 PNG)
  await sharp(originalLogo)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  console.log('All icons generated from logo_final.png!');
}

generate().catch(err => console.error(err));
