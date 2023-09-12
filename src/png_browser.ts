import { QR } from "./qr-base.js";
import { getOptions, colorToHex, getSVGPath } from "./utils.js";
import { ImageOptions, Matrix } from "./typing/types";
import { Base64 } from "js-base64";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
}

function dataURItoArrayBuffer(dataURI: string) {
  return Base64.toUint8Array(dataURI.split(',')[1]);
}

function blobToDataURL(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        try {
            var a = new FileReader();
            a.onload = function(e) {resolve(e.target.result as string);}
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
    const imageSize = matrix.length * size + marginPx * 2;

    const canvas = document.createElement('canvas');
    canvas.width = imageSize;
    canvas.height = imageSize;
    const context = canvas.getContext('2d');
    context.fillStyle = colorToHex(bgColor);
    context.fillRect(0, 0, imageSize, imageSize);
    const path = new Path2D(getSVGPath(matrix, size, marginPx, borderRadius));
    context.fillStyle = colorToHex(color);
    if ('draw' in path) {
        // @ts-expect-error used in tests
        path.draw(context);
    }
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
        context.drawImage(
            logoImage,
            imageSize / 2 - (logoWidth / 2 / 100) * imageSize,
            imageSize / 2 - (logoHeight / 2 / 100) * imageSize,
            (logoWidth / 100) * imageSize,
            (logoHeight / 100) * imageSize
        );
    }
    return dataURItoArrayBuffer(canvas.toDataURL('image/png'));
}
