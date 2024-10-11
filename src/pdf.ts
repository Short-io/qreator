import PDFDocument from 'pdfkit';
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions, getDotsSVGPath, getFindersSVGPath } from "./utils.js";
import colorString from "color-string";
import { clearMatrixCenter, zeroFillFinders } from "./matrix.js";

export async function getPDF(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);

    let matrix = QR(text, options.ec_level, options.parse_url);
    zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    return PDF({ matrix, ...options });
}

function colorToRGB(color: string | number): string {
    if (typeof color === "string") {
        return colorString.to.hex(colorString.get.rgb(color));
    }
    return '#' + (color >>> 8).toString(16).padStart(6, "0");
}

function getOpacity(color: string | number): number {
    if (typeof color === "string") {
        return colorString.get.rgb(color)[3];
    }
    return (color % 256) / 255;
}

async function PDF({
    matrix,
    margin,
    logo,
    logoWidth,
    logoHeight,
    color,
    bgColor,
    borderRadius,
}: ImageOptions & {
    matrix: Matrix;
}) {
    const size = 9;
    const marginPx = margin * size;
    const matrixSizePx = matrix.length * size;
    const imageSizePx = matrixSizePx + 2 * marginPx;

    const document = new PDFDocument({
        size: [imageSizePx, imageSizePx],
        font: "",
    });
    document.rect(0, 0, imageSizePx, imageSizePx).fill(colorToRGB(bgColor), "nonzero").fillOpacity(getOpacity(bgColor));

    const path = getDotsSVGPath(matrix, size, marginPx, borderRadius);
    document.path(path).fill(colorToRGB(color), "non-zero").fillOpacity(getOpacity(color));
    const findersPath = getFindersSVGPath(matrix, size, marginPx, borderRadius);
    document.path(findersPath).fill(colorToRGB(color), "even-odd").fillOpacity(getOpacity(color));

    if (logo) {
        const logoWidthPx = (logoWidth / 100) * matrixSizePx;
        const logoHeightPx = (logoHeight / 100) * matrixSizePx;
        document.image(logo, (imageSizePx - logoWidthPx) / 2, (imageSizePx - logoHeightPx) / 2, {
            width: logoWidthPx,
            height: logoHeightPx,
        });
    }
    let buffers: Buffer[] = [];
    document.on('data', buffers.push.bind(buffers));
    const docPromise = new Promise((resolve) => document.on('end', resolve));
    document.end();
    await docPromise;
    return Buffer.concat(buffers);
}
