import { QR } from "./qr-base.js";
import { getOptions, colorToHex } from "./utils.js";
import { ImageOptions, Matrix } from "./typing/types";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
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

function blobToDataURL(blob: Blob) {
    return new Promise<string>((resolve) => {
        var a = new FileReader();
        a.onload = function(e) {resolve(e.target.result as string);}
        a.readAsDataURL(blob);
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
}: ImageOptions & { matrix: Matrix }) {
    const N = matrix.length;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;

    const canvas = document.createElement('canvas');
    canvas.width = imageSize;
    canvas.height = imageSize;
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
        const logoImage = await new Promise<HTMLImageElement>(async (resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = await blobToDataURL(new window.Blob([logo]));
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
