import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { colorToHex, computeLabelLayout, getOptions, getDotsSVGPath, getFindersSVGPath, getFinderOuterSVGPath, getFinderInnerSVGPath, LabelLayout } from "./utils.js";
import { Base64 } from "js-base64";

interface FillSVGOptions extends Pick<ImageOptions, "color" | "bgColor" | "size" | "margin" | "borderRadius" | "cornerMode" | "finderOuterShape" | "finderInnerShape" | "finderColor"> {
    blockSize?: number;
}

export function getSVG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({ ...inOptions, type: "svg" });

    let matrix = QR(text, options.ec_level, options.parse_url);
    matrix = zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight && !options.noExcavate) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    const actualBlockSize = options.size || 9;
    const marginPx = options.margin * actualBlockSize;
    const imageSizePx = matrix.length * actualBlockSize + 2 * marginPx;

    const layout = computeLabelLayout(options, imageSizePx, marginPx, actualBlockSize);

    return createSVG({ matrix, ...options, labelLayout: layout });
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
    cornerMode,
    finderOuterShape,
    finderInnerShape,
    finderColor,
    labelLayout,
}: ImageOptions & {
    matrix: Matrix;
    imageWidth?: number;
    imageHeight?: number;
    labelLayout?: LabelLayout | null;
}): Uint8Array {
    const actualBlockSize = size || 9;
    const matrixSizePx = matrix.length * actualBlockSize;
    const marginPx = margin * actualBlockSize;
    const imageSizePx = matrixSizePx + 2 * marginPx;

    const totalWidth = labelLayout?.totalWidth ?? imageSizePx;
    const totalHeight = labelLayout?.totalHeight ?? imageSizePx;

    const imageWidthStr = imageWidth ? ` width="${imageWidth}"` : "";
    const imageHeightStr = imageHeight ? ` height="${imageHeight}"` : "";
    const xmlTag = `<?xml version="1.0" encoding="utf-8"?>`;
    const svgOpeningTag = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"${imageWidthStr}${imageHeightStr} viewBox="0 0 ${totalWidth} ${totalHeight}">`;

    const svgBody = getSVGBody(matrix, {
        color,
        bgColor,
        size: imageSizePx,
        margin,
        blockSize: actualBlockSize,
        borderRadius,
        cornerMode,
        finderOuterShape,
        finderInnerShape,
        finderColor,
    }, totalWidth, totalHeight);
    const svgEndTag = "</svg>";
    const logoImage = logo ? getLogoImage(logo, marginPx, matrixSizePx, logoWidth, logoHeight) : "";
    const labelSVG = labelLayout ? getLabelSVG(labelLayout) : "";

    return te.encode(xmlTag + svgOpeningTag + svgBody + labelSVG + logoImage + svgEndTag);
}

function getSVGBody(matrix: Matrix, options: FillSVGOptions, totalWidth: number, totalHeight: number): string {
    const marginPx = options.margin * options.blockSize;
    const dotsPath = getDotsSVGPath(matrix, options.blockSize, marginPx, options.borderRadius, options.cornerMode);
    let svgBody = `<rect width="${totalWidth}" height="${totalHeight}" fill="${colorToHex(
        options.bgColor
    )}"></rect>`;

    const hasFinderOptions = options.finderOuterShape || options.finderInnerShape || options.finderColor;
    if (hasFinderOptions) {
        const finderColorHex = colorToHex(options.finderColor ?? options.color);
        const outerShape = options.finderOuterShape ?? 'rounded';
        const innerShape = options.finderInnerShape ?? 'rounded';
        const outerPath = getFinderOuterSVGPath(matrix, options.blockSize, marginPx, options.borderRadius, outerShape);
        const innerPath = getFinderInnerSVGPath(matrix, options.blockSize, marginPx, options.borderRadius, innerShape);
        svgBody += `<path shape-rendering="geometricPrecision" d="${outerPath}" fill-rule="evenodd" fill="${finderColorHex}"/>`;
        svgBody += `<path shape-rendering="geometricPrecision" d="${innerPath}" fill="${finderColorHex}"/>`;
    } else {
        const outerFindersPath = getFindersSVGPath(matrix, options.blockSize, marginPx, options.borderRadius);
        svgBody += `<path shape-rendering="geometricPrecision" d="${outerFindersPath}" fill-rule="evenodd" fill="${colorToHex(options.color)}"/>`;
    }

    svgBody += `<path shape-rendering="geometricPrecision" d="${dotsPath}" fill="${colorToHex(options.color)}"/>`;
    return svgBody;
}

function getLabelSVG(layout: LabelLayout): string {
    const { label } = layout;
    const escapedText = escapeXml(label.text);
    let svg = "";

    if (label.bgColor) {
        if (label.borderRadius > 0) {
            svg += `<rect x="${label.x - label.width / 2}" y="${label.y - label.height / 2}" width="${label.width}" height="${label.height}" rx="${label.borderRadius}" ry="${label.borderRadius}" fill="${label.bgColor}"/>`;
        } else {
            svg += `<rect x="${label.x - label.width / 2}" y="${label.y - label.height / 2}" width="${label.width}" height="${label.height}" fill="${label.bgColor}"/>`;
        }
    }

    svg += `<text x="${label.x}" y="${label.y}" text-anchor="middle" dominant-baseline="central" font-family="${label.fontFamily}" font-size="${label.fontSize}" font-weight="bold" fill="${label.textColor}">${escapedText}</text>`;

    return svg;
}

function escapeXml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
