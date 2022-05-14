import { generateImage } from "./canvas.js";
import { QR } from "./qr-base.js";
import { ImageOptions } from "./typing/types";
import { getOptions } from "./utils.js";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
}