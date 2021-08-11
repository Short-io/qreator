import { Jimp } from "@jimp/core";
import Blit from "@jimp/plugin-blit";
import { QR } from "./qr-base";
import { ImageOptions, Matrix } from "./typing/types";
import { getOptions } from "./utils";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return PNG({ matrix, ...options });
}

async function PNG({
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

    const { default: Jimp } = process.browser
        ? await import("jimp/browser/lib/jimp")
        : await import("jimp/es");

    const jimp = await new Promise<Jimp>(
        (resolve) =>
            new Jimp(imageSize, imageSize, bgColor, (err, image) =>
                resolve(image)
            )
    );
    for (let y = 0; y < N; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            for (let sizeX = 0; sizeX < size; sizeX += 1) {
                for (let sizeY = 0; sizeY < size; sizeY += 1) {
                    if (matrix[y][x]) {
                        jimp.setPixelColor(
                            color,
                            x * size + sizeX + marginPx,
                            y * size + sizeY + marginPx
                        );
                    }
                }
            }
        }
    }
    if (logo) {
        const logoJimp = await Jimp.read(logo);
        logoJimp.resize(
            (logoWidth / 100) * imageSize,
            (logoHeight / 100) * imageSize
        );
        Blit().blit(
            logoJimp,
            imageSize / 2 - (logoWidth / 2 / 100) * imageSize,
            imageSize / 2 - (logoHeight / 2 / 100) * imageSize
        );
    }

    return jimp.getBufferAsync("image/png");
}
