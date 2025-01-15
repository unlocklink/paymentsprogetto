const withOptimizedImages = require('next-optimized-images');

module.exports = withOptimizedImages({
  // Configurazione ottimizzazione immagini
  optimizeImages: true,
  optimizeImagesInDev: false,
  responsive: {
    adapter: require('responsive-loader/sharp')
  }
}); 