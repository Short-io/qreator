import { PDFDocument, rgb } from "pdf-lib";
import { QR } from "./qr-base";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions } from "./utils";

export async function getPDF(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return PDF({ matrix, ...options });
}

function colorToRGB(color: number): [number, number, number] {
    return [
        ((color >>> 24) % 256) / 255,
        ((color >>> 16) % 256) / 255,
        ((color >>> 8) % 256) / 255,
    ];
}

async function PDF({
    matrix,
    margin,
    logo,
    logoWidth,
    logoHeight,
    color,
    bgColor,
}: ImageOptions & {
    matrix: Matrix;
}) {
    const size = 9;
    const document = await PDFDocument.create();
    const pageSize = (matrix.length + 2 * margin) * size;
    const page = document.addPage([pageSize, pageSize]);
    page.drawRectangle({
        width: pageSize,
        height: pageSize,
        color: rgb(...colorToRGB(bgColor)),
    });
    page.moveTo(margin * size, page.getHeight() - margin * size - size);
    for (const column of matrix) {
        for (const y of column) {
            if (y) {
                page.drawRectangle({
                    width: size,
                    height: size,
                    color: rgb(...colorToRGB(color)),
                    borderColor: rgb(...colorToRGB(color)),
                });
            }
            page.moveDown(size);
        }
        page.moveUp(size * column.length);
        page.moveRight(size);
    }
    if (logo) {
        const logoData = await document.embedPng(logo);
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
