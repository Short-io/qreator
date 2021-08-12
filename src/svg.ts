import { QR } from "./qr-base";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions } from "./utils";

interface FillSVGOptions
    extends Pick<ImageOptions, "color" | "bgColor" | "size" | "margin"> {
    blockSize?: number;
}

export async function getSVG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return createSVG({ matrix, ...options });
}

function colorToHex(color: number): string {
    return `#${(color >>> 8).toString(16).padStart(6, "0")}`;
}

async function createSVG({
    matrix,
    margin,
    size,
    logo,
    logoWidth,
    logoHeight,
    color,
    bgColor,
}: ImageOptions & {
    matrix: Matrix;
}): Promise<Buffer> {
    const actualSize = size || 9;
    const X = matrix.length + 2 * margin;
    const XY = X * (actualSize || 1);

    const xmlTag = "<?xml version='1.0' encoding='utf-8'?>";
    const svgOpeningTag = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 ${XY} ${XY}'>`;
    const svgBody = getSVGBody(matrix, {
        color,
        bgColor,
        size: XY,
        blockSize: actualSize,
    });
    const svgEndTag = "</svg>";
    const logoImage = logo ? getLogoImage(logo, XY, logoWidth, logoHeight) : "";

    return Buffer.from(
        xmlTag + svgOpeningTag + svgBody + logoImage + svgEndTag
    );
}

function getSVGBody(matrix: Matrix, options: FillSVGOptions): string {
    let svgBody =
        `<rect width='${options.size}' height='${options.size}' ` +
        `fill='${colorToHex(options.bgColor)}'></rect>`;

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x]) {
                svgBody +=
                    `<rect width='${options.blockSize}' height='${options.blockSize}' ` +
                    `fill='${colorToHex(options.color)}' ` +
                    `stroke='${colorToHex(options.color)}' ` +
                    `x='${(x + 1) * options.blockSize}' ` +
                    `y='${(y + 1) * options.blockSize}'>` +
                    `</rect>`;
            }
        }
    }
    return svgBody;
}

function getLogoImage(
    logo: ImageOptions["logo"],
    XY: number,
    logoWidth: ImageOptions["logoWidth"],
    logoHeight: ImageOptions["logoHeight"]
): string {
    const imageBase64 = `data:image/png;base64,${
        Buffer.isBuffer(logo)
            ? logo.toString("base64")
            : Buffer.from(logo).toString("base64")
    }`;

    return (
        `<image ` +
        `width='${(logoWidth / 100) * XY}' ` +
        `height='${(logoHeight / 100) * XY}' ` +
        `xlink:href='${imageBase64}' ` +
        `x='${XY / 2 - ((logoWidth / 100) * XY) / 2}' ` +
        `y='${XY / 2 - ((logoHeight / 100) * XY) / 2}'>` +
        `</image>`
    );
}
