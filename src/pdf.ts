import { PDFDocument, PDFImage, PDFOperator, PDFOperatorNames, PDFPage, rgb } from "pdf-lib";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions, getDotsSVGPath, getFindersSVGPath } from "./utils.js";
import colorString from "color-string";
import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";

const textDec = new TextDecoder();

export async function getPDF(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);

    let matrix = QR(text, options.ec_level, options.parse_url);
    matrix = zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight && !options.noExcavate) {
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

/**
 * This code is a piece of monkey patching to change the fill rule of the QR code. As pdf-lib does not support the even-odd fill rule, we need to patch the content stream of the page to change the fill rule from non-zero to even-odd.
 * @param page 
 */
function patchContentStream(page: PDFPage) {
    // @ts-expect-error patching private method
    page.prevGetContentStream = page.getContentStream;
    // @ts-expect-error patching private method
    page.getContentStream = (...args) => {
        // @ts-expect-error patching private method
        const contentStream = page.prevGetContentStream(...args);
        contentStream.prevPush = contentStream.push;
        contentStream.push = (...operators: PDFOperator[]) => {
            contentStream.prevPush(...operators.map((op: any) => {
                if (op.name == PDFOperatorNames.FillNonZeroAndStroke) {
                    return PDFOperator.of(PDFOperatorNames.FillEvenOddAndStroke, op.args);
                }
                if (op.name == PDFOperatorNames.FillNonZero) {
                    return PDFOperator.of(PDFOperatorNames.FillEvenOdd, op.args);
                }
                if (op.name == PDFOperatorNames.FillNonZeroAndStroke) {
                    return PDFOperator.of(PDFOperatorNames.FillEvenOddAndStroke, op.args);
                }
                return op;
            }));
        }
        return contentStream;
    }
}

function revertContentStream(page: PDFPage) {
    // @ts-expect-error patching private method
    page.getContentStream = page.prevGetContentStream;
    // @ts-expect-error patching private method
    page.contentStream.push = page.contentStream.prevPush;
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
    const findersPath = getFindersSVGPath(matrix, size, marginPx, borderRadius);
    patchContentStream(page);
    page.drawSvgPath(findersPath, {
        color: rgb(...colorToRGB(color)),
        opacity: getOpacity(color),
        borderColor: rgb(...colorToRGB(color)),
        borderOpacity: getOpacity(color),
    });
    revertContentStream(page);
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
