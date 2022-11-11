import { ImageOptions } from "./typing/types";
export type QRImageOptions = Omit<ImageOptions, "type"> & Required<Pick<ImageOptions, "type">>;

/**
 * @deprecated
 * 
 * @param text text to encode
 * @param options options
 * @returns Buffer of the image
 */
export async function getQRImage(
    text: string,
    options: QRImageOptions
) {
    throw new Error("getQRImage is deprecated. Use getPNG, getSVG or getPDF instead. If will save your memory and bundle size.");
}
