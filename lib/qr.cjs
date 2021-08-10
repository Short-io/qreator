const { QR } = require('./qr-base');
const PDF = require('./pdf');
const PNG = require('./png');
const SVG = require('./svg');

async function qrImage(text, options) {
  switch (options.type) {
    case 'svg':
      return SVG.getSVG(text, options);
    case 'pdf':
      return PDF.getPDF(text, options);
    case 'png':
      return PNG.getPNG(text, options);
    default:
      throw new Error('Unknown type');
  }
}

module.exports = {
  matrix: QR,
  image: qrImage,
};
