// @ts-ignore
import { registerWindow, SVG } from "@svgdotjs/svg.js";
import { QR } from "./qr-base";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions } from "./utils";

const { createSVGWindow } =
    typeof process === "object" ? require("svgdom") : () => window;

async function getSVG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return renderSVG({ matrix, ...options });
}

let svgWin = typeof process === "object" ? null : window;
if (!process.browser) {
    svgWin = createSVGWindow();
    registerWindow(svgWin, svgWin.document);
}

const colorToHex = (color) => `#${(color >>> 8).toString(16).padStart(6, "0")}`;

async function renderSVG({
    matrix,
    margin,
    size,
    logo,
    logoWidth,
    logoHeight,
    color,
    bgColor,
}: ImageOptions & { matrix: Matrix }) {
    const actualSize = size || 9;
    const X = matrix.length + 2 * margin;
    const XY = X * (actualSize || 1);
    const containerElement = svgWin.document.createElement("svg");
    containerElement.style.display = "none";
    svgWin.document.documentElement.appendChild(containerElement);
    const svg = SVG().addTo(containerElement).viewbox(0, 0, XY, XY);
    svg.rect(XY, XY).fill(colorToHex(bgColor));
    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            if (matrix[y][x]) {
                svg.rect(actualSize, actualSize)
                    .fill(colorToHex(color))
                    .stroke(colorToHex(color))
                    .move(
                        x * actualSize + margin * actualSize,
                        y * actualSize + margin * actualSize
                    );
            }
        }
    }
    if (logo) {
        const iriLogo = `data:image/png;base64,${
            Buffer.isBuffer(logo)
                ? logo.toString("base64")
                : Buffer.from(logo).toString("base64")
        }`;
        svg.image(iriLogo)
            .size((logoWidth / 100) * XY, (logoHeight / 100) * XY)
            .move(
                XY / 2 - ((logoWidth / 100) * XY) / 2,
                XY / 2 - ((logoHeight / 100) * XY) / 2
            );
    }
    return Buffer.from('<?xml version="1.0" encoding="utf-8"?>' + svg.svg());
}

module.exports = { getSVG };
