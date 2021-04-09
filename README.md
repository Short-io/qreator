qr-image
========

[![npm version](https://badge.fury.io/js/%40shortcm%2Fqr-image.svg)](https://badge.fury.io/js/%40shortcm%2Fqr-image)

This is yet another QR Code generator (based on [alexeyten/qr-image](https://github.com/alexeyten/qr-image)).

Overview
--------

  * generate image in `png`, `svg`, `pdf` and `eps` formats
  * numeric and alphanumeric modes
  * support UTF-8

[Releases](https://github.com/Short-io/qr-image/releases)

Installing
-----

```shell
npm install @shortcm/qr-image
# or
yarn add @shortcm/qr-image
```

Usage
-----

Example:
```javascript
const qr = require('@shortcm/qr-image');
// or
import qr from '@shortcm/qr-image';

const svgString = await qr.image('I love QR!', { type: 'svg' });

const svgWithLogoString = await qr.image('I love QR!', { type: 'svg', logo: fs.openFileSync('my logo') });
```

[More examples](./examples)

### Methods

  * `qr.image(text, [options])`: Readable stream with image data.
  * `qr.matrix(text, [ec_level], [parse_url])`: 2D array of "booleans" (numbers). __Y__ is indexed first (e.g. `[y][x]` NOT `[x][y]`), `[0][0]` is the top left, and `1` (`true`) means black.

### Options

  * `text`: text to encode
  * `options`: image options object
    * `ec_level`: one of `L`, `M`, `Q`, `H`; default `M`
    * `type`: image type; possible values `png`, `svg`, `pdf` and `eps`; default `png`
    * `size`: (types `png` and `svg` only) size of one module in pixels; default `5` for `png` and `0` for `svg`
    * `margin`: white space around QR image in modules; default `4` for `png` and `1` for others
    * `parse_url`: (experimental) try to optimize QR-code for URLs; default `false`
    * `logo`: buffer with PNG image; default `undefined`
    * `logoWidth`: height of image (in percent); default `20`
    * `logoHeight`: width of image (in percent); default `20`
    * `color`: dot color in RGBA format; does not support CSS syntax; must be number; default `0x000000FF` for black with 100% opacity
    * `bgColor`: background color in RGBA format; does not support CSS syntax; must be number; default `0xFFFFFFFF` for white with 100% opacity

Changes
-------

  * Use `zlib.deflateSync` instead of `pako`
  * Fix deprecation warning for NodeJS 7
  * `customize` function removed

TODO
----

  * Tests
  * mixing modes
  * Kanji (???)
