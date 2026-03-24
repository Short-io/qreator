# qreator

[![npm version](https://badge.fury.io/js/qreator.svg)](https://badge.fury.io/js/qreator)

QR Code generator for browser and node.js with tree shaking and logo support

<table>
<tr>
<td align="center"><img src="showcase/classic.png" width="180" /><br /><b>Classic</b></td>
<td align="center"><img src="showcase/rounded.png" width="180" /><br /><b>Rounded</b></td>
<td align="center"><img src="showcase/drops.png" width="180" /><br /><b>Custom finders</b></td>
<td align="center"><img src="showcase/logo.png" width="180" /><br /><b>Logo overlay</b></td>
</tr>
<tr>
<td align="center"><img src="showcase/label-below.png" width="180" /><br /><b>Label: below</b></td>
<td align="center"><img src="showcase/label-pill.png" width="180" /><br /><b>Label: pill</b></td>
<td align="center"><img src="showcase/label-box.png" width="180" /><br /><b>Label: box</b></td>
<td align="center"><img src="showcase/branded.png" width="180" /><br /><b>Branded</b></td>
</tr>
</table>

## Overview

-   generate image in `png`, `svg` and `pdf` formats
-   numeric and alphanumeric modes
-   support UTF-8
-   supports color customization
-   supports logos
-   supports border-radius
-   supports corner mode (merged rounded corners)
-   supports finder pattern customization (shape + color)
-   supports text labels (below, pill, box styles)
-   optional React component
-   tree shaking support
-   browser / node.js

[Releases](https://github.com/Short-io/qreator/releases)

## Installing

```shell
npm install qreator
# or
yarn add qreator
```

## Usage

Example:

```javascript
import { getSVG } from "qreator/lib/svg";
import { getPNG } from "qreator/lib/png"; // imports canvas implementation in browser and sharp module in node.js
import { getPDF } from "qreator/lib/pdf"; // this import is large, consider async import
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

### Label

```javascript
const png = await getPNG("https://example.com", {
    labelText: "SCAN ME",
    labelStyle: "pill", // "below", "pill", or "box"
});
```

### Finder pattern customization

```javascript
const svgString = await getSVG("I love QR", {
    finderOuterShape: "drop",
    finderInnerShape: "circle",
    finderColor: "#ff0000",
    borderRadius: 2,
    cornerMode: "merge",
});
```

### React

```jsx
import { QR } from "qreator/lib/react";

function App() {
    return <QR text="https://example.com" labelText="SCAN ME" labelStyle="pill" />;
}
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
| `cornerMode`   | how corners are rendered when borderRadius > 0     |   string    | `individual`, `merge` |              `individual`                |
| `finderOuterShape` | shape of the outer ring of finder patterns     |   string    | `square`, `rounded`, `circle`, `drop` |          `undefined`           |
| `finderInnerShape` | shape of the inner dot of finder patterns      |   string    | `square`, `rounded`, `circle`, `drop` |          `undefined`           |
| `finderColor`  | color of finder patterns (overrides `color`)       |   number/string   | same as `color` |              `undefined`                |
| `noExcavate`   |        don't remove partially covered modules      |   boolean   |    `true`, `false`    |                 `false`                  |
| `labelText`    |              text label to display below QR        |   string    |           -           |               `undefined`                |
| `labelStyle`   |              label presentation style              |   string    | `below`, `pill`, `box` |                `below`                  |
| `labelColor`   |              label text color                      |   number/string   | same as `color` |  `color` (below) / `bgColor` (pill/box)  |
| `labelBgColor` |       label background color (pill/box only)       |   number/string   | same as `color` |              same as `color`              |
| `labelFontSize`|       font size as multiple of module size         |   number    |        `1` - n        |                   `5`                    |
| `labelFontFamily`|              font family                         |   string    |           -           |              `sans-serif`                |


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
