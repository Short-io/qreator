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
  * tree shaking support
  * browser / node.js

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
import { getSVG } from '@shortcm/qr-image/svg';
import { getPNG } from '@shortcm/qr-image/png';
const svgString = await getSVG('I love QR', { logo: fs.openFileSync('my-logo.svg'), color: 0x000000, bgColor: 0xFFFFFF})
const pngBuffer = await getPNG('I love QR', { logo: fs.openFileSync('my-logo.svg'), color: 0x000000, bgColor: 0xFFFFFF})
```

[More examples](./examples)

### Syntax

  * `getPNG(text, [options])`: Readable stream with image data.
  * `getSVG(text, [options])`: Readable stream with image data.
  * `getPDF(text, [options])`: Readable stream with image data.

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

TODO
----

  * Use lighter versions of PDF library
