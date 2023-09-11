import colorString from "color-string";
import { ImageOptions, ImageType, Matrix } from "./typing/types";

export function getOptions(inOptions: ImageOptions) {
    const type: ImageType = inOptions?.type ?? "png";
    const defaults = type === "png" ? BITMAP_OPTIONS : VECTOR_OPTIONS;
    return { ...defaults, ...inOptions };
}

export function colorToHex(color: number | string): string {
    if (typeof color === "string") {
        return colorString.to.hex(colorString.get.rgb(color));
    }
    return `#${(color >>> 8).toString(16).padStart(6, "0")}`;
}

export function getSVGPath(matrix: Matrix, size: number, margin: number = 0, borderRadius: number = 0) {
    let rectangles = [];
    for (let x = 0; x < matrix.length; x++) {
        const column = matrix[x];
        for (let y = 0; y < column.length; y++) {
            if (column[y]) {
                const leftX = x * size + margin;
                const rightX = (x + 1) * size + margin;
                const topY = y * size + margin;
                const bottomY = (y + 1) * size + margin;
                const rectangle = [];
                rectangle.push(`M ${leftX} ${topY + borderRadius}`)
                rectangle.push(`L ${leftX} ${bottomY - borderRadius}`)
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${leftX + borderRadius} ${bottomY} `)
                }
                rectangle.push(`L ${rightX - borderRadius} ${bottomY}`)
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${rightX} ${bottomY - borderRadius}`)
                }
                rectangle.push(`L ${rightX} ${topY + borderRadius}`)
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${rightX - borderRadius} ${topY}`)
                }
                rectangle.push(`L ${leftX + borderRadius} ${topY}`)
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${leftX} ${topY + borderRadius}`)
                }
                rectangle.push(`z`)
                rectangles.push(rectangle.join(" "));
            }
        }
    }
    return rectangles.join(" ");
}



const commonOptions: Pick<
    ImageOptions,
    | "type"
    | "parse_url"
    | "ec_level"
    | "logo"
    | "logoWidth"
    | "logoHeight"
    | "bgColor"
    | "color"
> = {
    type: "png",
    parse_url: false,
    ec_level: "M",
    logo: undefined,
    logoWidth: 20,
    logoHeight: 20,
    bgColor: 0xffffffff,
    color: 0x000000ff,
};

const BITMAP_OPTIONS: ImageOptions = {
    ...commonOptions,
    margin: 1,
    size: 5,
};

const VECTOR_OPTIONS: ImageOptions = {
    ...commonOptions,
    margin: 1,
    size: 0,
};
