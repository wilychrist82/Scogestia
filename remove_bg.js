const Jimp = require('jimp');

async function removeWhiteBg() {
  try {
    const image = await Jimp.read('public/logo-scogestia.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Seuil pour le blanc (240-255)
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // Transparence à 0
      }
    });
    
    await image.writeAsync('public/logo-scogestia-transparent.png');
    console.log('Fond blanc supprimé avec succès !');
  } catch (err) {
    console.error('Erreur:', err);
  }
}

removeWhiteBg();
