import { generateImage } from "./canvas";
import { QR } from "./qr-base";
import { ImageOptions } from "./typing/types";
import { getOptions } from "./utils";

export async function getPNG(text: string, inOptions: ImageOptions) {
    const options = getOptions(inOptions);
    const matrix = QR(text, options.ec_level, options.parse_url);
    return generateImage({ matrix, ...options, type: 'png' });
}