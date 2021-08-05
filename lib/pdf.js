/* eslint-disable no-bitwise */
const pdflib = require('pdf-lib');
const { QR } = require('./qr-base');
const { getOptions } = require('./utils');

async function getPDF(text, inOptions) {
  const options = getOptions(inOptions);
  const matrix = QR(text, options.ec_level, options.parse_url);
  return PDF({ matrix, ...options });
}

function colorToRGB(color) {
  return [
    ((color >>> 24) % 256) / 255,
    ((color >>> 16) % 256) / 255,
    ((color >>> 8) % 256) / 255,
  ];
}

async function PDF({
  matrix,
  margin,
  logo,
  logoWidth,
  logoHeight,
  color,
  bgColor,
}) {
  const size = 9;
  const document = await pdflib.PDFDocument.create();
  const pageSize = (matrix.length + 2 * margin) * size;
  const page = document.addPage([pageSize, pageSize]);
  page.drawRectangle({
    width: pageSize,
    height: pageSize,
    color: pdflib.rgb(...colorToRGB(bgColor)),
  });
  page.moveTo(margin * size, page.getHeight() - margin * size - size);
  for (const column of matrix) {
    for (const y of column) {
      if (y) {
        page.drawRectangle({
          width: size,
          height: size,
          color: pdflib.rgb(...colorToRGB(color)),
          borderColor: pdflib.rgb(...colorToRGB(color)),
        });
      }
      page.moveDown(size);
    }
    page.moveUp(size * column.length);
    page.moveRight(size);
  }
  if (logo) {
    const logoData = await document.embedPng(logo);
    page.drawImage(logoData, {
      x: page.getWidth() / 2 - (logoWidth / 100) * (page.getWidth() / 2),
      y: page.getHeight() / 2 - (logoHeight / 100) * (page.getWidth() / 2),
      width: (logoWidth / 100) * page.getWidth(),
      height: (logoHeight / 100) * page.getHeight(),
    });
  }
  return document.save();
}

module.exports = { getPDF };
