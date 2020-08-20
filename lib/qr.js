"use strict";

const { QR } = require('./qr-base');
const png = require('./png');
const vector = require('./vector');

const BITMAP_OPTIONS = {
    parse_url: false,
    ec_level: 'M',
    size: 5,
    margin: 4,
    customize: null,
    logo: undefined,
    logo_width: 20,
    logo_height: 20,
};

const VECTOR_OPTIONS = {
    parse_url: false,
    ec_level: 'M',
    margin: 1,
    size: 0,
    logo: undefined,
    logo_width: 20,
    logo_height: 20,
};

function get_options(options, force_type) {
    if (typeof options === 'string') {
        options = { 'ec_level': options }
    } else {
        options = options || {};
    }
    var _options = {
        type: String(force_type || options.type || 'png').toLowerCase()
    };

    var defaults = _options.type == 'png' ? BITMAP_OPTIONS : VECTOR_OPTIONS;

    for (var k in defaults) {
        _options[k] = k in options ? options[k] : defaults[k];
    }
    return _options;
}


async function qr_image(text, options) {
    options = get_options(options);

    var matrix = QR(text, options.ec_level, options.parse_url);
    var stream = [];
    var result;

    switch (options.type) {
    case 'svg':
    case 'pdf':
    case 'eps':
        result = await vector[options.type](matrix, stream, options.margin, options.size, options.logo, options.logo_width, options.logo_height);
        break;
    case 'png':
    default:
        return png.bitmap(matrix, options.size, options.margin, options.logo, options.logo_width, options.logo_height);
    }

    return result;
}

module.exports = {
    matrix: QR,
    image: qr_image,
};
