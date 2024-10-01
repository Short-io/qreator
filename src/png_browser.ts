import { QR } from "./qr-base.js";
import { colorToHex, getOptions, getDotsSVGPath, getFindersSVGPath } from "./utils.js";
import { ImageOptions, Matrix } from "./typing/types";
import { Base64 } from "js-base64";
import { clearMatrixCenter, zeroFillFinders } from "./matrix.js";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);

    let matrix = QR(text, options.ec_level, options.parse_url);
    zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    return generateImage({ matrix, ...options, type: "png" });
}

function dataURItoArrayBuffer(dataURI: string) {
    return Base64.toUint8Array(dataURI.split(",")[1]);
}

function blobToDataURL(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        try {
            var a = new FileReader();
            a.onload = function (e) {
                resolve(e.target.result as string);
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
}: ImageOptions & { matrix: Matrix }) {
    const marginPx = margin * size;
    const matrixSizePx = matrix.length * size;
    const imageSizePx = matrixSizePx + marginPx * 2;

    const canvas = document.createElement("canvas");
    canvas.width = imageSizePx;
    canvas.height = imageSizePx;
    const context = canvas.getContext("2d");
    context.fillStyle = colorToHex(bgColor);
    context.fillRect(0, 0, imageSizePx, imageSizePx);

    const findersPath = new Path2D(getFindersSVGPath(matrix, size, marginPx, borderRadius));
    context.fillStyle = colorToHex(color);
    context.fill(findersPath, "evenodd");
    const path = new Path2D(getDotsSVGPath(matrix, size, marginPx, borderRadius));
    context.fillStyle = colorToHex(color);
    context.fill(path);
    if (logo) {
        const logoImage = await new Promise<HTMLImageElement>(async (resolve, reject) => {
            try {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = await blobToDataURL(new window.Blob([logo]));
            } catch (e) {
                reject(e);
            }
        });
        const logoWidthPx = (logoWidth / 100) * matrixSizePx;
        const logoHeightPx = (logoHeight / 100) * matrixSizePx;
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
