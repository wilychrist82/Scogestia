const sharp = require('sharp');

async function resizeIcons() {
  try {
    await sharp('public/icon.png')
      .resize(192, 192)
      .toFile('public/icon-192x192.png');
    console.log('192x192 icon created');

    await sharp('public/icon.png')
      .resize(512, 512)
      .toFile('public/icon-512x512.png');
    console.log('512x512 icon created');
    
    // Also create apple-touch-icon.png
    await sharp('public/icon.png')
      .resize(180, 180)
      .toFile('public/apple-touch-icon.png');
    console.log('apple-touch-icon created');
  } catch (err) {
    console.error('Error resizing images:', err);
  }
}

resizeIcons();
