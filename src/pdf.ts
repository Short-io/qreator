import { PDFWriter } from "./pdf-writer/index.js";
import { QR } from "./qr-base.js";
import { ImageOptions, Matrix } from "./typing/types";
import { computeLabelLayout, getOptions, getDotsSVGPath, getFindersSVGPath, getFinderOuterSVGPath, getFinderInnerSVGPath, LabelLayout } from "./utils.js";
import colorString from "color-string";
import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";

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

    const writer = new PDFWriter(totalWidth, totalHeight);

    // Background
    const [bgR, bgG, bgB] = colorToRGB(bgColor);
    writer.drawRectangle(0, 0, totalWidth, totalHeight, bgR, bgG, bgB);

    // QR dots
    const [fgR, fgG, fgB] = colorToRGB(color);
    const fgOpacity = getOpacity(color);

    const path = getDotsSVGPath(matrix, size, marginPx, borderRadius, cornerMode);
    writer.drawSvgPath(path, 0, writer.getHeight(), fgR, fgG, fgB, fgOpacity, false);

    // Finder patterns
    const hasFinderOptions = finderOuterShape || finderInnerShape || finderColor;
    if (hasFinderOptions) {
        const fc = finderColor ?? color;
        const [fcR, fcG, fcB] = colorToRGB(fc);
        const fcOpacity = getOpacity(fc);
        const outerPath = getFinderOuterSVGPath(matrix, size, marginPx, borderRadius, finderOuterShape ?? 'rounded');
        writer.drawSvgPath(outerPath, 0, writer.getHeight(), fcR, fcG, fcB, fcOpacity, true); // even-odd
        const innerPath = getFinderInnerSVGPath(matrix, size, marginPx, borderRadius, finderInnerShape ?? 'rounded');
        writer.drawSvgPath(innerPath, 0, writer.getHeight(), fcR, fcG, fcB, fcOpacity, false);
    } else {
        const findersPath = getFindersSVGPath(matrix, size, marginPx, borderRadius);
        writer.drawSvgPath(findersPath, 0, writer.getHeight(), fgR, fgG, fgB, fgOpacity, true); // even-odd
    }

    // Logo
    if (logo) {
        const logoData = logo instanceof Uint8Array ? logo : new Uint8Array(logo);
        const imgName = await writer.embedImage(logoData);
        const logoWidthPx = (logoWidth / 100) * matrixSizePx;
        const logoHeightPx = (logoHeight / 100) * matrixSizePx;
        writer.drawImage(
            imgName,
            (imageSizePx - logoWidthPx) / 2,
            (imageSizePx - logoHeightPx) / 2,
            logoWidthPx,
            logoHeightPx,
        );
    }

    // Label
    if (labelLayout) {
        drawPDFLabel(writer, labelLayout, totalHeight);
    }

    return writer.save();
}

function drawPDFLabel(
    writer: PDFWriter,
    layout: LabelLayout,
    totalHeight: number,
): void {
    const { label } = layout;

    // PDF Y-axis is bottom-up, convert from SVG top-down coordinates
    const pdfLabelCenterY = totalHeight - label.y;

    if (label.bgColor) {
        const [r, g, b] = colorToRGB(label.bgColor);
        const rectX = label.x - label.width / 2;
        const rectY = pdfLabelCenterY - label.height / 2;

        if (label.borderRadius > 0) {
            const w = label.width;
            const h = label.height;
            const rad = Math.min(label.borderRadius, w / 2, h / 2);
            const pillPath = `M ${rectX + rad} 0 h ${w - 2 * rad} a ${rad} ${rad} 0 0 1 ${rad} ${-rad} v ${-(h - 2 * rad)} a ${rad} ${rad} 0 0 1 ${-rad} ${-rad} h ${-(w - 2 * rad)} a ${rad} ${rad} 0 0 1 ${-rad} ${rad} v ${h - 2 * rad} a ${rad} ${rad} 0 0 1 ${rad} ${rad} z`;
            writer.drawSvgPath(pillPath, 0, rectY + label.height, r, g, b, 1, false);
        } else {
            writer.drawRectangle(rectX, rectY, label.width, label.height, r, g, b);
        }
    }

    const textWidth = writer.measureText(label.text, label.fontSize);
    const [tr, tg, tb] = colorToRGB(label.textColor);
    writer.drawText(
        label.text,
        label.fontSize,
        label.x - textWidth / 2,
        pdfLabelCenterY - label.fontSize * 0.35,
        tr, tg, tb,
    );
}
