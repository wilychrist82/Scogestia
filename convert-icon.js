const sharp = require('sharp');
const fs = require('fs');

async function convertImage() {
  try {
    await sharp('C:\\Users\\wilfriedbusiness.com\\.gemini\\antigravity-ide\\brain\\d2a68c85-693b-4e75-9051-128a503f7b4a\\.user_uploaded\\media_1788463618901.jpg')
      .toFormat('png')
      .toFile('public/icon.png');
    console.log('Converted successfully to public/icon.png');
  } catch (err) {
    console.error('Error converting image:', err);
  }
}

convertImage();
