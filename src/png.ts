import { ImageOptions, Matrix } from "./typing/types";
import { QR } from "./qr-base.js";
import { getOptions } from "./utils.js";
import sharp from "sharp";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
}


function colorToHex(color: number): string {
    return `#${(color >>> 8).toString(16).padStart(6, "0")}`;
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
}: ImageOptions & { matrix: Matrix }) {
    const N = matrix.length;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;
    const qrImage = sharp({
        create: {
            width: imageSize,
            height: imageSize,
            channels: 4,
            background: colorToHex(bgColor),
        },
    });
    const layers: sharp.OverlayOptions[] = [];
    for (let y = 0; y < N; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            if (matrix[y][x]) {
                layers.push({
                    input: {
                        create: {
                            width: size,
                            height: size,
                            background: colorToHex(color),
                            channels: 4 as const,
                        },
                    },
                    left: x * size + marginPx,
                    top: y * size + marginPx,
                });
            }
        }
    }
    if (logo) {
        layers.push({
            input: await sharp(logo).resize(imageSize * logoWidth / 100, imageSize * logoHeight / 100).toBuffer(),
        })
        // context.drawImage(
        //     logoImage,
        //     imageSize / 2 - (logoWidth / 2 / 100) * imageSize,
        //     imageSize / 2 - (logoHeight / 2 / 100) * imageSize,
        //     (logoWidth / 100) * imageSize,
        //     (logoHeight / 100) * imageSize
        // );
    }
    qrImage.composite(layers);
    return await qrImage.png().toBuffer();
}
