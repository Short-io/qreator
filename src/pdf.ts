import { PDFDocument, PDFImage, rgb } from "pdf-lib";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions, getDotsSVGPath } from "./utils.js";
import colorString from "color-string";
import { clearMatrixCenter, zeroFillFinders } from "./matrix.js";

const textDec = new TextDecoder();

export async function getPDF(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);

    let matrix = QR(text, options.ec_level, options.parse_url);
    zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    return PDF({ matrix, ...options });
}

function colorToRGB(color: string | number): [number, number, number] {
    if (typeof color === "string") {
        const [red, green, blue] = colorString.get.rgb(color);
        return [red / 255, green / 255, blue / 255];
    }
    return [((color >>> 24) % 256) / 255, ((color >>> 16) % 256) / 255, ((color >>> 8) % 256) / 255];
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

    const document = await PDFDocument.create();
    const page = document.addPage([imageSizePx, imageSizePx]);
    page.drawSquare({
        size: imageSizePx,
        color: rgb(...colorToRGB(bgColor)),
    });
    page.moveTo(0, page.getHeight());

    const path = getDotsSVGPath(matrix, size, marginPx, borderRadius);
    page.drawSvgPath(path, {
        color: rgb(...colorToRGB(color)),
        opacity: getOpacity(color),
        borderColor: rgb(...colorToRGB(color)),
        borderOpacity: getOpacity(color),
    });
    if (logo) {
        let logoData: PDFImage;
        const header = new Uint8Array(logo.slice(0, 4));
        if (textDec.decode(header.slice(1, 4)) === "PNG" && header.at(0) === 0x89) {
            logoData = await document.embedPng(logo);
        } else {
            logoData = await document.embedJpg(logo);
        }
        const logoWidthPx = (logoWidth / 100) * matrixSizePx;
        const logoHeightPx = (logoHeight / 100) * matrixSizePx;
        page.drawImage(logoData, {
            x: (imageSizePx - logoWidthPx) / 2,
            y: (imageSizePx - logoHeightPx) / 2,
            width: logoWidthPx,
            height: logoHeightPx,
        });
    }
    return document.save();
}
