qr-image
========

[![npm version](https://badge.fury.io/js/%40shortcm%2Fqr-image.svg)](https://badge.fury.io/js/%40shortcm%2Fqr-image)

This is yet another QR Code generator (based on [alexeyten/qr-image](https://github.com/alexeyten/qr-image)).

Overview
--------

  * generate image in `png`, `svg` and `pdf` formats
  * numeric and alphanumeric modes
  * support UTF-8
  * supports color customization
  * supports logos

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

// or

import { getSVG } from '@shortcm/qr-image/lib/svg.js';
const svgString = await getSVG('I love QR', { logo: fs.openFileSync('my-logo.svg')})
```

[More examples](./examples)

### Methods

  * `qr.image(text, [options])`: Readable stream with image data.
  * `qr.matrix(text, [ec_level], [parse_url])`: 2D array of "booleans" (numbers). __Y__ is indexed first (e.g. `[y][x]` NOT `[x][y]`), `[0][0]` is the top left, and `1` (`true`) means black.

### Options

  * `text`: text to encode
  * `options`: additional image options object

#### Additional Options ####

| Name         | Description                                        | Type    | Possible Values     | Default                     |
| :---:        | :---:                                              | :---:   | :---:               | :---:                       |
| `ec_level`   | error correction level                             | string  | `L`, `M`, `Q`, `H`  | `M`                         |
| `type`       | image type                                         | string  | `png`, `svg`, `pdf` | `png`                       |
| `size`       | png and svg only<br />size of one module in pixels | number  | `0` - n             | `5` (png)<br />`0` (others) |
| `margin`     | white space around QR image in modules             | number  | `0` - n             | `4` (png)<br />`1` (others) |
| `parse_url`  | EXPERIMENTAL<br />try to optimize QR-code for URLs | boolean | `true`, `false`     | `false`                     |
| `logo`       | buffer with png image                              | Buffer  | -                   | `undefined`                 |
| `logoWidth`  | height of logo in percent                          | number  | `0` - `100`         | `20`                        |
| `logoHeight` | width of logo in percent                           | number  | `0` - `100`         | `20`                        |
| `color`      | module color in RGBA format<br />does not support CSS syntax | number | `0x00000000` - `0xFFFFFFFF` | `0x000000FF`<br />(black with 100% opacity) |
| `bgColor`    | background color in RGBA format<br />does not support CSS syntax | number | `0x00000000` - `0xFFFFFFFF` | `0xFFFFFFFF`<br />(white with 100% opacity) |

Changes
-------

  * Use `zlib.deflateSync` instead of `pako`
  * Fix deprecation warning for NodeJS 7
  * `customize` function removed
  * Add TypeScript definitions

TODO
----

  * Use lighter versions of SVG/PNG/PDF libraries
