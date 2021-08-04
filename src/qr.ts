const { QR } = require('./qr-base');
const PDF = require('./pdf');
const PNG = require('./png');
const SVG = require('./svg');

const commonOptions = {
  type: 'png',
  parse_url: false,
  ec_level: 'M',
  logo: undefined,
  logoWidth: 20,
  logoHeight: 20,
  bgColor: 0xffffffff,
  color: 0x000000ff,
};

const BITMAP_OPTIONS = {
  ...commonOptions,
  margin: 4,
  size: 5,
};

const VECTOR_OPTIONS = {
  ...commonOptions,
  margin: 1,
  size: 0,
};

function getOptions(inOptions) {
  const type = !inOptions || !inOptions.type ? 'png' : inOptions.type;
  const defaults = type === 'png' ? BITMAP_OPTIONS : VECTOR_OPTIONS;
  return { ...defaults, ...inOptions };
}

async function qrImage(text, inOptions) {
  const options = getOptions(inOptions);

  const matrix = QR(text, options.ec_level, options.parse_url);

  switch (options.type) {
    case 'svg':
      return SVG({ matrix, ...options });
    case 'pdf':
      return PDF({ matrix, ...options });
    case 'png':
      return PNG({ matrix, ...options });
    default:
      throw new Error('Unknown type');
  }
}

module.exports = {
  matrix: QR,
  image: qrImage,
};
