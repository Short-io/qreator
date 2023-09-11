import { ImageOptions, Matrix } from "./typing/types";
import { QR } from "./qr-base.js";
import { createSVG } from './svg.js';
import { getOptions } from "./utils.js";
import sharp from "sharp";

export async function getPNG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({...inOptions, type: 'png'});
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
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
    const svg = await createSVG({
        matrix, size, margin, color, bgColor,
        imageWidth: imageSize, imageHeight: imageSize,
        borderRadius,
    });
    const qrImage = sharp(svg);
    const layers: sharp.OverlayOptions[] = [];
    if (logo) {
        const sharpLogo = sharp(logo).resize(imageSize * logoWidth / 100, imageSize * logoHeight / 100, {fit: 'contain'});
        const data = await sharpLogo.toBuffer()
        layers.push({
            input: data,
        })
        qrImage.composite(layers);
    }
    return await qrImage.png().toBuffer();
}
