import { ImageOptions, Matrix } from "./typing/types";
import { QR } from "./qr-base.js";
import { createSVG } from "./svg.js";
import { getOptions } from "./utils.js";
import sharp from "sharp";
import { clearMatrixCenter, zeroFillFinders } from "./matrix.js";

export async function getPNG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({ ...inOptions, type: "png" });

    let matrix = QR(text, options.ec_level, options.parse_url);
    zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    return generateImage({ matrix, ...options, type: "png" });
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

    if (size > 200) {
        throw new Error("Module size is too big, resulting image is too large: " + imageSizePx);
    }

    const svg = await createSVG({
        matrix,
        size,
        margin,
        color,
        bgColor,
        imageWidth: imageSizePx,
        imageHeight: imageSizePx,
        logoWidth: logo && logoWidth,
        logoHeight: logo && logoHeight,
        borderRadius,
    });
    const qrImage = sharp(svg);
    const layers: sharp.OverlayOptions[] = [];
    if (logo) {
        const sharpLogo = sharp(logo).resize(
            Math.round((matrixSizePx * logoWidth) / 100),
            Math.round((matrixSizePx * logoHeight) / 100),
            { fit: "contain" }
        );
        const data = await sharpLogo.toBuffer();
        layers.push({
            input: data,
        });
        qrImage.composite(layers);
    }
    const { data } = await qrImage
        .png({ palette: !logo }) // no logo results in much less colors
        .toBuffer({ resolveWithObject: true });
    return new Uint8ClampedArray(data.buffer);
}
