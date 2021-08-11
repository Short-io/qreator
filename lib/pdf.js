"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPDF = void 0;
const pdf_lib_1 = require("pdf-lib");
const qr_base_1 = require("./qr-base");
const utils_1 = require("./utils");
async function getPDF(text, inOptions) {
    const options = utils_1.getOptions(inOptions);
    const matrix = qr_base_1.QR(text, options.ec_level, options.parse_url);
    return PDF({ matrix, ...options });
}
exports.getPDF = getPDF;
function colorToRGB(color) {
    return [
        ((color >>> 24) % 256) / 255,
        ((color >>> 16) % 256) / 255,
        ((color >>> 8) % 256) / 255,
    ];
}
async function PDF({ matrix, margin, logo, logoWidth, logoHeight, color, bgColor, }) {
    const size = 9;
    const document = await pdf_lib_1.PDFDocument.create();
    const pageSize = (matrix.length + 2 * margin) * size;
    const page = document.addPage([pageSize, pageSize]);
    page.drawRectangle({
        width: pageSize,
        height: pageSize,
        color: pdf_lib_1.rgb(...colorToRGB(bgColor)),
    });
    page.moveTo(margin * size, page.getHeight() - margin * size - size);
    for (const column of matrix) {
        for (const y of column) {
            if (y) {
                page.drawRectangle({
                    width: size,
                    height: size,
                    color: pdf_lib_1.rgb(...colorToRGB(color)),
                    borderColor: pdf_lib_1.rgb(...colorToRGB(color)),
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
            y: page.getHeight() / 2 -
                (logoHeight / 100) * (page.getWidth() / 2),
            width: (logoWidth / 100) * page.getWidth(),
            height: (logoHeight / 100) * page.getHeight(),
        });
    }
    return document.save();
}
