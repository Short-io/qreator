"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQRImage = void 0;
const pdf_1 = require("./pdf");
const png_1 = require("./png");
const svg_1 = require("./svg");
async function getQRImage(text, options) {
    switch (options.type) {
        case "svg":
            return svg_1.getSVG(text, options);
        case "pdf":
            return pdf_1.getPDF(text, options);
        case "png":
            return png_1.getPNG(text, options);
        default:
            throw new Error("Unknown type");
    }
}
exports.getQRImage = getQRImage;
