/* eslint-disable no-bitwise */
const { SVG, registerWindow } = require('@svgdotjs/svg.js');
const { createSVGWindow } = process.browser ? () => window : require('svgdom');

let svgWin = typeof window === 'undefined' ? null : window;
if (!process.browser) {
  svgWin = createSVGWindow();
  registerWindow(svgWin, svgWin.document);
}

const colorToHex = (color) => `#${(color >>> 8).toString(16).padStart(6, '0')}`;

async function renderSVG({
  matrix, margin, size, logo, logoWidth, logoHeight, color, bgColor,
}) {
  const actualSize = size || 9;
  const X = matrix.length + 2 * margin;
  const XY = X * (actualSize || 1);
  const svg = SVG(svgWin.document.createElement('svg')).viewbox(0, 0, XY, XY);
  svg.rect(XY, XY).fill(colorToHex(bgColor));
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x]) {
        svg.rect(actualSize, actualSize).fill(
          colorToHex(color),
        ).stroke(
          colorToHex(color),
        ).move(x * actualSize + margin * actualSize, y * actualSize + margin * actualSize);
      }
    }
  }
  if (logo) {
    const iriLogo = `data:image/png;base64,${Buffer.isBuffer(logo) ? logo.toString('base64') : Buffer.from(logo).toString('base64')}`;
    svg.image(iriLogo).size((logoWidth / 100) * XY, (logoHeight / 100) * XY)
      .move(
        XY / 2 - ((logoWidth / 100) * XY) / 2 + margin * actualSize,
        XY / 2 - ((logoHeight / 100) * XY) / 2 + margin * actualSize,
      );
  }
  return Buffer.from(svg.svg());
}

module.exports = renderSVG;
