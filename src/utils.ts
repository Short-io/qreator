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


export function getFindersSVGPath(matrix: Matrix, size: number = 0, margin: number = 0, borderRadius: number = 0) {
    const matrixSize = matrix.length * size + margin * 2;
    let finderSize = 8;
    let finderEnd = finderSize - 1;
    const sides = [[0, 0], [1, 0], [0, 1]]
    const rectangles = [];
    for (const side of sides) {
        const signs = side.map(sidePoint => sidePoint == 0 ? 1 : -1);
        for (const offset of [0, 1, 2]) {
            let corners = [
                [matrixSize * side[0] + signs[0] * (margin + size * offset),               matrixSize * side[1] + signs[1] * (margin + size * offset)],
                [matrixSize * side[0] + signs[0] * (margin + size * (finderEnd - offset)), matrixSize * side[1] + signs[1] * (margin + size * (finderEnd - offset))],
            ]
            let rectangle = [
                'M', corners[0][0], corners[0][1],
                'L', corners[0][0], corners[1][1],
                'L', corners[1][0], corners[1][1],
                'L', corners[1][0], corners[0][1],
                'z',
            ]
            rectangles.push(...rectangle)
        }
    }

    return rectangles.join(" ")
}

export function getDotsSVGPath(matrix: Matrix, size: number, margin: number = 0, borderRadius: number = 0) {
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
                rectangle.push(`M ${leftX} ${topY + borderRadius}`);
                rectangle.push(`L ${leftX} ${bottomY - borderRadius}`);
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${leftX + borderRadius} ${bottomY}`);
                }
                rectangle.push(`L ${rightX - borderRadius} ${bottomY}`);
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${rightX} ${bottomY - borderRadius}`);
                }
                rectangle.push(`L ${rightX} ${topY + borderRadius}`);
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${rightX - borderRadius} ${topY}`);
                }
                rectangle.push(`L ${leftX + borderRadius} ${topY}`);
                if (borderRadius > 0) {
                    rectangle.push(`A ${borderRadius} ${borderRadius} 0 0 0 ${leftX} ${topY + borderRadius}`);
                }
                rectangle.push(`z`); 
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
