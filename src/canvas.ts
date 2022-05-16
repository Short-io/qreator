import { ImageOptions, Matrix } from "./typing/types";
import CanvasModule from "canvas";

const { createCanvas, loadImage } = CanvasModule;

function colorToHex(color: number): string {
    return `#${(color >>> 8).toString(16).padStart(6, "0")}`;
}

function dataURItoArrayBuffer(dataURI: string) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  return ab
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

    const canvas = createCanvas(imageSize, imageSize);
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
    if (canvas.toBuffer) {
        return canvas.toBuffer('image/png');
    } else { // Frontend
        return dataURItoArrayBuffer(canvas.toDataURL('image/png'));
    }

}
