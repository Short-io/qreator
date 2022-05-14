import { getPDF } from "./pdf.js";
import { getPNG } from "./png.js";
import { getSVG } from "./svg.js";
import { ImageOptions } from "./typing/types";

export async function getQRImage(
    text: string,
    options: Omit<ImageOptions, "type"> & Required<Pick<ImageOptions, "type">>
) {
    switch (options.type) {
        case "svg":
            return getSVG(text, options);
        case "pdf":
            return getPDF(text, options);
        case "png":
            return getPNG(text, options);
        default:
            throw new Error("Unknown type");
    }
}
