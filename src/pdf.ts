import { PDFDocument, PDFImage, PDFOperator, PDFOperatorNames, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { computeLabelLayout, getOptions, getDotsSVGPath, getFindersSVGPath, getFinderOuterSVGPath, getFinderInnerSVGPath, LabelLayout } from "./utils.js";
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

    const pdfSize = 9;
    const marginPx = options.margin * pdfSize;
    const imageSizePx = matrix.length * pdfSize + 2 * marginPx;
    const layout = computeLabelLayout(options, imageSizePx, marginPx, pdfSize);

    return PDF({ matrix, ...options, labelLayout: layout });
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
    cornerMode,
    finderOuterShape,
    finderInnerShape,
    finderColor,
    labelLayout,
}: ImageOptions & {
    matrix: Matrix;
    labelLayout?: LabelLayout | null;
}) {
    const size = 9;
    const marginPx = margin * size;
    const matrixSizePx = matrix.length * size;
    const imageSizePx = matrixSizePx + 2 * marginPx;

    const totalWidth = labelLayout?.totalWidth ?? imageSizePx;
    const totalHeight = labelLayout?.totalHeight ?? imageSizePx;

    const document = await PDFDocument.create();
    const page = document.addPage([totalWidth, totalHeight]);
    page.drawRectangle({
        x: 0,
        y: 0,
        width: totalWidth,
        height: totalHeight,
        color: rgb(...colorToRGB(bgColor)),
    });
    page.moveTo(0, page.getHeight());

    const fgRGB = rgb(...colorToRGB(color));
    const fgOpacity = getOpacity(color);
    const fgStyle = { color: fgRGB, opacity: fgOpacity, borderColor: fgRGB, borderOpacity: fgOpacity };

    const path = getDotsSVGPath(matrix, size, marginPx, borderRadius, cornerMode);
    page.drawSvgPath(path, fgStyle);

    const hasFinderOptions = finderOuterShape || finderInnerShape || finderColor;
    if (hasFinderOptions) {
        const fc = finderColor ?? color;
        const fcRGB = rgb(...colorToRGB(fc));
        const fcOpacity = getOpacity(fc);
        const fcStyle = { color: fcRGB, opacity: fcOpacity, borderColor: fcRGB, borderOpacity: fcOpacity };
        const outerPath = getFinderOuterSVGPath(matrix, size, marginPx, borderRadius, finderOuterShape ?? 'rounded');
        patchContentStream(page);
        page.drawSvgPath(outerPath, fcStyle);
        revertContentStream(page);
        const innerPath = getFinderInnerSVGPath(matrix, size, marginPx, borderRadius, finderInnerShape ?? 'rounded');
        page.drawSvgPath(innerPath, fcStyle);
    } else {
        const findersPath = getFindersSVGPath(matrix, size, marginPx, borderRadius);
        patchContentStream(page);
        page.drawSvgPath(findersPath, fgStyle);
        revertContentStream(page);
    }
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

    if (labelLayout) {
        await drawPDFLabel(document, page, labelLayout, totalHeight);
    }

    return document.save();
}

async function drawPDFLabel(
    document: PDFDocument,
    page: PDFPage,
    layout: LabelLayout,
    totalHeight: number,
): Promise<void> {
    const { label } = layout;
    const font = await document.embedFont(StandardFonts.Helvetica);

    // pdf-lib Y-axis is bottom-up, so convert from SVG top-down coordinates
    const pdfLabelCenterY = totalHeight - label.y;

    if (label.bgColor) {
        const [r, g, b] = colorToRGB(label.bgColor);
        const rectX = label.x - label.width / 2;
        const rectY = pdfLabelCenterY - label.height / 2;

        if (label.borderRadius > 0) {
            // Draw rounded rect as SVG path
            const w = label.width;
            const h = label.height;
            const rad = Math.min(label.borderRadius, w / 2, h / 2);
            // SVG path for rounded rect, drawn relative to page moveTo
            const pillPath = `M ${rectX + rad} 0 h ${w - 2 * rad} a ${rad} ${rad} 0 0 1 ${rad} ${-rad} v ${-(h - 2 * rad)} a ${rad} ${rad} 0 0 1 ${-rad} ${-rad} h ${-(w - 2 * rad)} a ${rad} ${rad} 0 0 1 ${-rad} ${rad} v ${h - 2 * rad} a ${rad} ${rad} 0 0 1 ${rad} ${rad} z`;
            page.moveTo(0, rectY + label.height);
            page.drawSvgPath(pillPath, {
                color: rgb(r, g, b),
            });
            page.moveTo(0, page.getHeight());
        } else {
            page.drawRectangle({
                x: rectX,
                y: rectY,
                width: label.width,
                height: label.height,
                color: rgb(r, g, b),
            });
        }
    }

    const textWidth = font.widthOfTextAtSize(label.text, label.fontSize);
    const [tr, tg, tb] = colorToRGB(label.textColor);
    page.drawText(label.text, {
        x: label.x - textWidth / 2,
        y: pdfLabelCenterY - label.fontSize * 0.35,
        size: label.fontSize,
        font,
        color: rgb(tr, tg, tb),
    });
}
