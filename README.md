qr-image
========

[![npm version](https://badge.fury.io/js/qr-image.svg)](https://badge.fury.io/js/qr-image)

This is yet another QR Code generator.

Overview
--------

  * No dependecies;
  * generate image in `png`, `svg`, `eps` and `pdf` formats;
  * numeric and alphanumeric modes;
  * support UTF-8.

[Releases](https://github.com/alexeyten/qr-image/releases/)


Installing
-----

```shell
npm install @shortcm/qr-image
```

Usage
-----

Example:
```javascript
const qr = require('@shortcm/qr-image');

const svgString = await qr.image('I love QR!', { type: 'svg' });

const svgWithLogoString = await qr.image('I love QR!', { type: 'svg', logo: fs.openFileSync('my logo') });


```

[More examples](./examples)

`qr = require('qr-image')`

### Methods

  * `qr.image(text, [ec_level | options])` — Readable stream with image data;
  * `qr.imageSync(text, [ec_level | options])` — string with image data. (Buffer for `png`);
  * `qr.svgObject(text, [ec_level | options])` — object with SVG path and size;
  * `qr.matrix(text, [ec_level])` — 2D array of booleans. __Y__ is indexed first (e.g. `[y][x]` NOT `[x][y]`), `[0][0]` is the top left, and `true` means black.


### Options

  * `text` — text to encode;
  * `ec_level` — error correction level. One of `L`, `M`, `Q`, `H`. Default `M`.
  * `logo` — Buffer with PNG image
  * `logo_width` — Height of image (in percent)
  * `logo_height` — Width of image (in percent)
  * `options` — image options object:
    * `ec_level` — default `M`.
    * `type` — image type. Possible values `png` (default), `svg`, `pdf` and `eps`.
    * `size` (png and svg only) — size of one module in pixels. Default `5` for png and `undefined` for svg.
    * `margin` — white space around QR image in modules. Default `4` for `png` and `1` for others.
    * `customize` (only png) — function to customize qr bitmap before encoding to PNG.
    * `parse_url` (experimental, default `false`) — try to optimize QR-code for URLs.

Changes
-------

  * Use `zlib.deflateSync` instead of `pako`.
  * Fix deprecation warning for NodeJS 7.


TODO
----

  * Tests;
  * mixing modes;
  * Kanji (???).
