import { QR } from "./qr-base.js";
import { colorToHex, computeLabelLayout, getOptions, getDotsSVGPath, getFindersSVGPath, getFinderOuterSVGPath, getFinderInnerSVGPath, LabelLayout } from "./utils.js";
import { ImageOptions, Matrix } from "./typing/types.js";
import { Base64 } from "js-base64";
import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);

    let matrix = QR(text, options.ec_level, options.parse_url);
    matrix = zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight && !options.noExcavate) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    const marginPx = options.margin * options.size;
    const imageSizePx = matrix.length * options.size + marginPx * 2;
    const layout = computeLabelLayout(options, imageSizePx, marginPx, options.size);

    return generateImage({ matrix, ...options, type: "png", labelLayout: layout });
}

function dataURItoArrayBuffer(dataURI: string) {
    return Base64.toUint8Array(dataURI.split(",")[1]);
}

function blobToDataURL(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        try {
            var a = new FileReader();
            a.onload = function (e) {
                resolve(e.target!.result as string);
            };
            a.onerror = reject;
            a.readAsDataURL(blob);
        } catch (e) {
            reject(e);
        }
    });
}

export async function generateImage({
    matrix,
    size,
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
}: ImageOptions & { matrix: Matrix; labelLayout?: LabelLayout | null }) {
    const actualSize = size ?? 5;
    const actualMargin = margin ?? 1;
    const actualLogoWidth = logoWidth ?? 20;
    const actualLogoHeight = logoHeight ?? 20;
    const actualColor = color ?? 0x000000ff;
    const actualBgColor = bgColor ?? 0xffffffff;
    const marginPx = actualMargin * actualSize;
    const matrixSizePx = matrix.length * actualSize;
    const imageSizePx = matrixSizePx + marginPx * 2;

    const totalWidth = labelLayout?.totalWidth ?? imageSizePx;
    const totalHeight = labelLayout?.totalHeight ?? imageSizePx;

    const canvas = document.createElement("canvas");
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const context = canvas.getContext("2d")!;
    context.fillStyle = colorToHex(actualBgColor);
    context.fillRect(0, 0, totalWidth, totalHeight);

    const hasFinderOptions = finderOuterShape || finderInnerShape || finderColor;
    if (hasFinderOptions) {
        const finderColorHex = colorToHex(finderColor ?? actualColor);
        const outerPath = new Path2D(getFinderOuterSVGPath(matrix, actualSize, marginPx, borderRadius ?? 0, finderOuterShape ?? 'rounded'));
        const innerPath = new Path2D(getFinderInnerSVGPath(matrix, actualSize, marginPx, borderRadius ?? 0, finderInnerShape ?? 'rounded'));
        context.fillStyle = finderColorHex;
        context.fill(outerPath, "evenodd");
        context.fill(innerPath);
    } else {
        const findersPath = new Path2D(getFindersSVGPath(matrix, actualSize, marginPx, borderRadius));
        context.fillStyle = colorToHex(actualColor);
        context.fill(findersPath, "evenodd");
    }
    const path = new Path2D(getDotsSVGPath(matrix, actualSize, marginPx, borderRadius, cornerMode));
    context.fillStyle = colorToHex(actualColor);
    context.fill(path);

    if (labelLayout) {
        drawLabel(context, labelLayout);
    }

    if (logo) {
        const logoImage = await new Promise<HTMLImageElement>(async (resolve, reject) => {
            try {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = await blobToDataURL(new window.Blob([logo as BlobPart]));
            } catch (e) {
                reject(e);
            }
        });
        const logoWidthPx = (actualLogoWidth / 100) * matrixSizePx;
        const logoHeightPx = (actualLogoHeight / 100) * matrixSizePx;
        context.drawImage(
            logoImage,
            (imageSizePx - logoWidthPx) / 2,
            (imageSizePx - logoHeightPx) / 2,
            logoWidthPx,
            logoHeightPx
        );
    }
    return dataURItoArrayBuffer(canvas.toDataURL("image/png"));
}

function drawLabel(ctx: CanvasRenderingContext2D, layout: LabelLayout): void {
    const { label } = layout;

    if (label.bgColor) {
        ctx.fillStyle = label.bgColor;
        if (label.borderRadius > 0) {
            const x = label.x - label.width / 2;
            const y = label.y - label.height / 2;
            const r = label.borderRadius;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + label.width - r, y);
            ctx.arcTo(x + label.width, y, x + label.width, y + r, r);
            ctx.lineTo(x + label.width, y + label.height - r);
            ctx.arcTo(x + label.width, y + label.height, x + label.width - r, y + label.height, r);
            ctx.lineTo(x + r, y + label.height);
            ctx.arcTo(x, y + label.height, x, y + label.height - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(label.x - label.width / 2, label.y - label.height / 2, label.width, label.height);
        }
    }

    ctx.fillStyle = label.textColor;
    ctx.font = `bold ${label.fontSize}px ${label.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.text, label.x, label.y);
}
