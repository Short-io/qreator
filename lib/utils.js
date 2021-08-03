function getOptions(inOptions) {
  const type = !inOptions || !inOptions.type ? 'png' : inOptions.type;
  const defaults = type === 'png' ? BITMAP_OPTIONS : VECTOR_OPTIONS;
  return { ...defaults, ...inOptions };
}

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

module.exports = {
  getOptions,
};
