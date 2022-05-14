import { ImageOptions, Matrix } from "./typing/types";
import { createCanvas, loadImage } from "canvas";

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
    type
}: ImageOptions & { matrix: Matrix }) {
    const N = matrix.length;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;

    const canvas = createCanvas(imageSize, imageSize, type === 'png' ? undefined : type);
    const context = canvas.getContext('2d');
    context.fillStyle = colorToHex(bgColor);
    context.fillRect(0, 0, imageSize, imageSize);

    for (let y = 0; y < N; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            if (matrix[y][x]) {
                context.fillStyle = colorToHex(color);
                context.fillRect(
                    x * size + marginPx,
                    y * size + marginPx,
                    size,
                    size
                );
            }
        }
    }
    if (logo) {
        const logoImage = await loadImage(logo instanceof ArrayBuffer ? Buffer.from(logo) : logo, { maxWidth: 1200, maxHeight: 1200 });
        context.drawImage(
            logoImage,
            imageSize / 2 - (logoWidth / 2 / 100) * imageSize,
            imageSize / 2 - (logoHeight / 2 / 100) * imageSize,
            (logoWidth / 100) * imageSize,
            (logoHeight / 100) * imageSize
        );
    }

    if (type === 'svg') {
        return canvas.toBuffer();
    } else if (type === 'pdf') {
        return canvas.toBuffer('application/pdf');
    }

    return canvas.toBuffer('image/png');
}
