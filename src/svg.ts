import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions, colorToHex, getSVGPath } from "./utils.js";
import { Base64 } from 'js-base64';

interface FillSVGOptions
    extends Pick<ImageOptions, "color" | "bgColor" | "size" | "margin" | "borderRadius"> {
    blockSize?: number;
}

export async function getSVG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({...inOptions, type: "svg"});
    const matrix = QR(text, options.ec_level, options.parse_url);
    return createSVG({ matrix, ...options });
}

const te = new TextEncoder();

export async function createSVG({
    matrix,
    margin,
    size,
    logo,
    logoWidth,
    logoHeight,
    color,
    bgColor,
    imageWidth,
    imageHeight,
    borderRadius,
}: ImageOptions & {
    matrix: Matrix;
    imageWidth?: number;
    imageHeight?: number;
}): Promise<Uint8Array> {
    const actualSize = size || 9;
    const X = matrix.length + 2 * margin;
    const XY = X * (actualSize || 1);
    const imageWidthStr = imageWidth ? ` width="${imageWidth}"` : "";
    const imageHeightStr = imageHeight ? `height="${imageWidth}" ` : "";
    const xmlTag = `<?xml version="1.0" encoding="utf-8"?>`;
    const svgOpeningTag = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"${imageWidthStr} ${imageHeightStr}viewBox="0 0 ${XY} ${XY}">`;
    const svgBody = getSVGBody(matrix, {
        color,
        bgColor,
        size: XY,
        margin,
        blockSize: actualSize,
        borderRadius,
    });
    const svgEndTag = "</svg>";
    const logoImage = logo ? getLogoImage(logo, XY, logoWidth, logoHeight) : "";

    return te.encode(
        xmlTag + svgOpeningTag + svgBody + logoImage + svgEndTag
    );
}

function getSVGBody(matrix: Matrix, options: FillSVGOptions): string {
    const path = getSVGPath(matrix, options.blockSize, options.margin * options.blockSize, options.borderRadius);
    let svgBody =
    `<rect width="${options.size}" height="${options.size}" ` +
    `fill="${colorToHex(options.bgColor)}"></rect>`;
    svgBody += '<path shape-rendering="geometricPrecision" d="' + path + '" fill="' + colorToHex(options.color) + '"/>';
    return svgBody;
}

function getLogoImage(
    logo: ImageOptions["logo"],
    XY: number,
    logoWidth: ImageOptions["logoWidth"],
    logoHeight: ImageOptions["logoHeight"]
): string {
    const imageBase64 = `data:image/png;base64,${
        typeof Buffer !== "undefined" && Buffer.isBuffer(logo)
            ? logo.toString("base64")
            : Base64.fromUint8Array(new Uint8Array(logo))
    }`;

    return (
        `<image ` +
        `width="${(logoWidth / 100) * XY}" ` +
        `height="${(logoHeight / 100) * XY}" ` +
        `xlink:href="${imageBase64}" ` +
        `x="${XY / 2 - ((logoWidth / 100) * XY) / 2}" ` +
        `y="${XY / 2 - ((logoHeight / 100) * XY) / 2}">` +
        `</image>`
    );
}
