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

const svgMove = (left: number, top: number) => ['M', left, top]
const svgReturn = () => ['z']
const svgDeltaArc = (borderRadius: number, dx: number, dy: number, sweep: number = 0) => borderRadius > 0 ? ['a', borderRadius, borderRadius, 0, 0, sweep, dx, dy] : [];
const svgVerticalDeltaLite = (dy: number) => ['v', dy];
const svgHorizontalDeltaLine = (dx: number) => ['h', dx];


export function getFindersSVGPath(matrix: Matrix, size: number = 0, margin: number = 0, borderRadius: number = 0) {
    const matrixSize = matrix.length * size + margin * 2;
    let finderSize = 8;
    let finderEnd = finderSize - 1;
    const sides = [[0, 0], [1, 0], [0, 1]] as const;
    const rectangles = [];
    for (const side of sides) {
        const [ xSign, ySign ] = side.map(sidePoint => sidePoint == 0 ? 1 : -1);
        for (const offset of [0, 1, 2]) {
            let xCorner = matrixSize * side[0] + xSign * (margin + size * offset);
            let yCorner = matrixSize * side[1] + ySign * (margin + size * offset);

            const xDelta = xSign * (size * (finderEnd - 2 * offset) - 2 * borderRadius);
            const yDelta = ySign * (size * (finderEnd - 2 * offset) - 2 * borderRadius);
            let rectangle = [
                svgMove(xCorner, yCorner + borderRadius * ySign),
                svgVerticalDeltaLite(yDelta),
                svgDeltaArc(borderRadius, borderRadius * xSign, borderRadius * ySign, side[1] | side[0]),
                svgHorizontalDeltaLine(xDelta),
                svgDeltaArc(borderRadius, borderRadius * xSign, - borderRadius * ySign, (side[1] | side[0])),
                svgVerticalDeltaLite(-yDelta),
                svgDeltaArc(borderRadius, - borderRadius * xSign, - borderRadius * ySign, (side[1] | side[0])),
                svgHorizontalDeltaLine(-xDelta),
                svgDeltaArc(borderRadius, - borderRadius * xSign, borderRadius * ySign, (side[1] | side[0])),
                svgReturn(),
            ]
            rectangles.push(...rectangle.flat())
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
                const topY = y * size + margin;
                const delta = size - 2 * borderRadius;
                const rectangle = [
                    svgMove(leftX, topY + borderRadius),
                    svgVerticalDeltaLite(delta),
                    svgDeltaArc(borderRadius, borderRadius, borderRadius),
                    svgHorizontalDeltaLine(delta),
                    svgDeltaArc(borderRadius, borderRadius, -borderRadius),
                    svgVerticalDeltaLite(-delta),
                    svgDeltaArc(borderRadius, -borderRadius, -borderRadius),
                    svgHorizontalDeltaLine(-delta),
                    svgDeltaArc(borderRadius, -borderRadius, borderRadius),
                    svgReturn(),
                ];
                rectangles.push(...rectangle.flat());
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
