import { getPDF } from "./pdf";
import { getPNG } from "./png";
import { getSVG } from "./svg";
import { ImageOptions } from "./typing/types";

export async function getQRImage(text: string, options: ImageOptions) {
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
