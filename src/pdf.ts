import { PDFDocument, PDFImage, rgb } from "pdf-lib";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions, getSVGPath } from "./utils.js";
import colorString from "color-string";

const textDec = new TextDecoder();

export async function getPDF(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return PDF({ matrix, ...options });
}

function colorToRGB(color: string | number): [number, number, number] {
    if (typeof color === "string") {
        const [red, green, blue] = colorString.get.rgb(color);
        return [red / 255, green / 255, blue / 255];
    }
    return [
        ((color >>> 24) % 256) / 255,
        ((color >>> 16) % 256) / 255,
        ((color >>> 8) % 256) / 255,
    ];
}

function getOpacity(color: string | number): number {
    if (typeof color === "string") {
        return colorString.get.rgb(color)[3];
    }
    return ((color % 256) / 255);
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
    const document = await PDFDocument.create();
    const pageSize = (matrix.length + 2 * margin) * size;
    const page = document.addPage([pageSize, pageSize]);
    page.drawSquare({
        size: pageSize,
        color: rgb(...colorToRGB(bgColor)),
    });
    page.moveTo(0, page.getHeight());
    const path = getSVGPath(matrix, size, margin * size, borderRadius);
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
        page.drawImage(logoData, {
            x: page.getWidth() / 2 - (logoWidth / 100) * (page.getWidth() / 2),
            y:
                page.getHeight() / 2 -
                (logoHeight / 100) * (page.getWidth() / 2),
            width: (logoWidth / 100) * page.getWidth(),
            height: (logoHeight / 100) * page.getHeight(),
        });
    }
    return document.save();
}
