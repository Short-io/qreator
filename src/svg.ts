import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { colorToHex, getOptions, getDotsSVGPath, getFindersSVGPath } from "./utils.js";
import { Base64 } from "js-base64";

interface FillSVGOptions extends Pick<ImageOptions, "color" | "bgColor" | "size" | "margin" | "borderRadius"> {
    blockSize?: number;
}

export function getSVG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({ ...inOptions, type: "svg" });

    let matrix = QR(text, options.ec_level, options.parse_url);
    matrix = zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight && !options.noExcavate) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    return createSVG({ matrix, ...options });
}

const te = new TextEncoder();

export function createSVG({
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
}): Uint8Array {
    const actualBlockSize = size || 9;
    const matrixSizePx = matrix.length * actualBlockSize;
    const marginPx = margin * actualBlockSize;
    const imageSizePx = matrixSizePx + 2 * marginPx;
    const imageWidthStr = imageWidth ? ` width="${imageWidth}"` : "";
    const imageHeightStr = imageHeight ? ` height="${imageWidth}"` : "";
    const xmlTag = `<?xml version="1.0" encoding="utf-8"?>`;
    const svgOpeningTag = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"${imageWidthStr}${imageHeightStr} viewBox="0 0 ${imageSizePx} ${imageSizePx}">`;

    const svgBody = getSVGBody(matrix, {
        color,
        bgColor,
        size: imageSizePx,
        margin,
        blockSize: actualBlockSize,
        borderRadius,
    });
    const svgEndTag = "</svg>";
    const logoImage = logo ? getLogoImage(logo, marginPx, matrixSizePx, logoWidth, logoHeight) : "";

    return te.encode(xmlTag + svgOpeningTag + svgBody + logoImage + svgEndTag);
}

function getSVGBody(matrix: Matrix, options: FillSVGOptions): string {
    const dotsPath = getDotsSVGPath(matrix, options.blockSize, options.margin * options.blockSize, options.borderRadius);
    const outerFindersPath = getFindersSVGPath(matrix, options.blockSize, options.margin * options.blockSize, options.borderRadius);
    let svgBody = `<rect width="${options.size}" height="${options.size}" fill="${colorToHex(
        options.bgColor
    )}"></rect>`;
    svgBody += `<path shape-rendering="geometricPrecision" d="${outerFindersPath}" fill-rule="evenodd" fill="${colorToHex(options.color)}"/>`;
    svgBody += `<path shape-rendering="geometricPrecision" d="${dotsPath}" fill="${colorToHex(options.color)}"/>`;
    return svgBody;
}

function getLogoImage(
    logo: ImageOptions["logo"],
    marginPx: number,
    matrixSizePx: number,
    logoWidth: ImageOptions["logoWidth"],
    logoHeight: ImageOptions["logoHeight"]
): string {
    const imageBase64 = `data:image/png;base64,${Base64.fromUint8Array(new Uint8Array(logo))}`;
    const logoWidthPx = (logoWidth / 100) * matrixSizePx;
    const logoHeightPx = (logoHeight / 100) * matrixSizePx;

    return (
        `<image ` +
        `width="${logoWidthPx}" ` +
        `height="${logoHeightPx}" ` +
        `xlink:href="${imageBase64}" ` +
        `x="${marginPx + (matrixSizePx - logoWidthPx) / 2}" ` +
        `y="${marginPx + (matrixSizePx - logoHeightPx) / 2}">` +
        `</image>`
    );
}
