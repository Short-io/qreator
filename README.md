qr-image
========

[![npm version](https://badge.fury.io/js/qr-image.svg)](https://badge.fury.io/js/qr-image)

This is yet another QR Code generator.

Overview
--------

  * No dependecies;
  * generate image in `png`, `svg` and `pdf` formats;
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
  * `qr.matrix(text, [ec_level])` — 2D array of booleans. __Y__ is indexed first (e.g. `[y][x]` NOT `[x][y]`), `[0][0]` is the top left, and `true` means black.


### Options

  * `text` — text to encode;
  * `options` — image options object:
    * `ec_level` — one of 'L', 'M', 'Q', 'H'. default `M`.
    * `type` — image type. Possible values `png` (default), `svg`, `pdf` and `eps`.
    * `size` (png and svg only) — size of one module in pixels. Default `5` for png and `undefined` for svg.
    * `margin` — white space around QR image in modules. Default `4` for `png` and `1` for others.
    * `customize` (only png) — function to customize qr bitmap before encoding to PNG.
    * `parse_url` (experimental, default `false`) — try to optimize QR-code for URLs.
    * `logo` — Buffer with PNG image
    * `logoWidth` — Height of image (in percent)
    * `logoHeight` — Width of image (in percent)
    * `color` - dot color
    * `bgColor` - background color

Changes
-------

  * Use `zlib.deflateSync` instead of `pako`.
  * Fix deprecation warning for NodeJS 7.


TODO
----

  * Tests;
  * mixing modes;
  * Kanji (???).
