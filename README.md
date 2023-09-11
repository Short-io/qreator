# @shortcm/qr-image

[![npm version](https://badge.fury.io/js/%40shortcm%2Fqr-image.svg)](https://badge.fury.io/js/%40shortcm%2Fqr-image)

QR Code generator for browser and node.js with tree shaking and logo support (based on [alexeyten/qr-image](https://github.com/alexeyten/qr-image)).

![image](https://github.com/Short-io/qr-image/assets/75169/02b84738-56f2-44d8-8d11-f40e263302ed)

## Overview

-   generate image in `png`, `svg` and `pdf` formats
-   numeric and alphanumeric modes
-   support UTF-8
-   supports color customization
-   supports logos
-   tree shaking support
-   browser / node.js

[Releases](https://github.com/Short-io/qr-image/releases)

## Installing

```shell
npm install @shortcm/qr-image
# or
yarn add @shortcm/qr-image
```

## Usage

Example:

```javascript
import { getSVG } from "@shortcm/qr-image/lib/svg";
import { getPNG } from "@shortcm/qr-image/lib/png"; // imports canvas implementation in browser and sharp module in node.js
import { getPDF } from "@shortcm/qr-image/lib/pdf"; // this import is large, consider async import
const svgString = await getSVG("I love QR", {
    logo: fs.openFileSync("my-logo.svg"),
    color: "#000000",
    bgColor: "#FFFFFF",
});
const pngBuffer = await getPNG("I love QR", {
    logo: fs.openFileSync("my-logo.svg"),
    color: "rgb(0, 0, 0)",
    bgColor: "rgb(255, 255, 255)",
});
```

[More examples](./examples)

### Syntax

-   `getPNG(text, [options])`: Readable stream with image data.
-   `getSVG(text, [options])`: Readable stream with image data.
-   `getPDF(text, [options])`: Readable stream with image data.

### Options

-   `text`: text to encode
-   `options`: additional image options object

#### Additional Options

|      Name      |                    Description                     |    Type     |    Possible Values    |                 Default                  |
| :------------: | :------------------------------------------------: | :---------: | :-------------------: | :--------------------------------------: |
|   `ec_level`   |               error correction level               |   string    |  `L`, `M`, `Q`, `H`   |                   `M`                    |
|     `type`     |                     image type                     |   string    |  `png`, `svg`, `pdf`  |                  `png`                   |
|     `size`     | png and svg only<br />size of one module in pixels |   number    |        `0` - n        |       `5` (png)<br />`0` (others)        |
|    `margin`    |       white space around QR image in modules       |   number    |        `0` - n        |       `4` (png)<br />`1` (others)        |
|  `parse_url`   | EXPERIMENTAL<br />try to optimize QR-code for URLs |   boolean   |    `true`, `false`    |                 `false`                  |
|     `logo`     |             buffer with png/jpeg image             | ArrayBuffer |           -           |               `undefined`                |
|  `logoWidth`   |             height of logo in percent              |   number    |      `0` - `100`      |                   `20`                   |
|  `logoHeight`  |              width of logo in percent              |   number    |      `0` - `100`      |                   `20`                   |
|    `color`     |         module color in rgba or hex format         |   number    | `#000000` - `#000000` | `#000000`<br />(black with 100% opacity) |
|   `bgColor`    |       background color in rgba or hex format       |   number    | `#000000` - `#FFFFFF` | `#FFFFFF`<br />(white with 100% opacity) |
| `borderRadius` |             border-radius (in pixels)              |   number    |    0 - `size / 2`     |                   `0`                    |

## Benchmarks

```
getPNG x 229 ops/sec ±0.45% (84 runs sampled)
getPDF x 186 ops/sec ±24.91% (86 runs sampled)
getSVG x 2,482 ops/sec ±0.18% (90 runs sampled)
getPNG with logo x 69.96 ops/sec ±0.72% (68 runs sampled)
getPDF with logo x 44.83 ops/sec ±9.52% (77 runs sampled)
getSVG with logo x 2,494 ops/sec ±0.19% (88 runs sampled)
```

## TODO

-   Use lighter versions of PDF library
-   Background
