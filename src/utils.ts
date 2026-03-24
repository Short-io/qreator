import colorString from "color-string";
import { CornerMode, FinderShape, ImageOptions, ImageType, LabelStyle, Matrix } from "./typing/types";

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

function isActive(matrix: Matrix, x: number, y: number): boolean {
    return x >= 0 && x < matrix.length && y >= 0 && y < (matrix[0]?.length ?? 0) && !!matrix[x][y];
}

function getExposedCorners(matrix: Matrix, x: number, y: number): [boolean, boolean, boolean, boolean] {
    const left = isActive(matrix, x - 1, y);
    const right = isActive(matrix, x + 1, y);
    const top = isActive(matrix, x, y - 1);
    const bottom = isActive(matrix, x, y + 1);
    return [
        !left && !top,      // top-left: exposed only if both left and top are absent
        !right && !top,     // top-right
        !right && !bottom,  // bottom-right
        !left && !bottom,   // bottom-left
    ];
}

export function getDotsSVGPath(matrix: Matrix, size: number, margin: number = 0, borderRadius: number = 0, cornerMode: CornerMode = 'individual') {
    let rectangles = [];
    for (let x = 0; x < matrix.length; x++) {
        const column = matrix[x];
        for (let y = 0; y < column.length; y++) {
            if (column[y]) {
                const leftX = x * size + margin;
                const topY = y * size + margin;
                let rTL: number, rTR: number, rBR: number, rBL: number;
                if (cornerMode === 'merge') {
                    const [eTL, eTR, eBR, eBL] = getExposedCorners(matrix, x, y);
                    rTL = eTL ? borderRadius : 0;
                    rTR = eTR ? borderRadius : 0;
                    rBR = eBR ? borderRadius : 0;
                    rBL = eBL ? borderRadius : 0;
                } else {
                    rTL = rTR = rBR = rBL = borderRadius;
                }
                const rectangle = [
                    svgMove(leftX, topY + rTL),
                    svgVerticalDeltaLite(size - rTL - rBL),
                    svgDeltaArc(rBL, rBL, rBL),
                    svgHorizontalDeltaLine(size - rBL - rBR),
                    svgDeltaArc(rBR, rBR, -rBR),
                    svgVerticalDeltaLite(-(size - rBR - rTR)),
                    svgDeltaArc(rTR, -rTR, -rTR),
                    svgHorizontalDeltaLine(-(size - rTR - rTL)),
                    svgDeltaArc(rTL, -rTL, rTL),
                    svgReturn(),
                ];
                rectangles.push(...rectangle.flat());
            }
        }
    }
    return rectangles.join(" ");
}



// Per-corner border radius support for finder shapes
const FINDER_SIDES = [[0, 0], [1, 0], [0, 1]] as const;
const FINDER_END = 7; // finderSize(8) - 1

// Corner radii for the 4 arcs in drawing order.
// Index 1 is always the center-facing corner (toward QR center).
function getCornerRadii(shape: FinderShape, sideLength: number, borderRadius: number): [number, number, number, number] {
    const maxR = sideLength / 2;
    switch (shape) {
        case 'square': return [0, 0, 0, 0];
        case 'rounded': return [borderRadius, borderRadius, borderRadius, borderRadius];
        case 'circle': return [maxR, maxR, maxR, maxR];
        case 'drop': return [maxR, 0, maxR, maxR];
    }
}

function drawFinderRect(
    xCorner: number, yCorner: number,
    sideLength: number,
    xSign: number, ySign: number,
    sweep: number,
    cornerRadii: [number, number, number, number]
): (string | number)[] {
    const [r0, r1, r2, r3] = cornerRadii;
    return [
        svgMove(xCorner, yCorner + r3 * ySign),
        svgVerticalDeltaLite(ySign * (sideLength - r3 - r0)),
        svgDeltaArc(r0, r0 * xSign, r0 * ySign, sweep),
        svgHorizontalDeltaLine(xSign * (sideLength - r0 - r1)),
        svgDeltaArc(r1, r1 * xSign, -r1 * ySign, sweep),
        svgVerticalDeltaLite(-ySign * (sideLength - r1 - r2)),
        svgDeltaArc(r2, -r2 * xSign, -r2 * ySign, sweep),
        svgHorizontalDeltaLine(-xSign * (sideLength - r2 - r3)),
        svgDeltaArc(r3, -r3 * xSign, r3 * ySign, sweep),
        svgReturn(),
    ].flat();
}

export function getFinderOuterSVGPath(
    matrix: Matrix, size: number, margin: number,
    borderRadius: number, shape: FinderShape
): string {
    const matrixSize = matrix.length * size + margin * 2;
    const rectangles: (string | number)[] = [];
    for (const side of FINDER_SIDES) {
        const [xSign, ySign] = side.map(s => s === 0 ? 1 : -1);
        const sweep = side[1] | side[0];
        for (const offset of [0, 1]) {
            const sideLength = size * (FINDER_END - 2 * offset);
            const xCorner = matrixSize * side[0] + xSign * (margin + size * offset);
            const yCorner = matrixSize * side[1] + ySign * (margin + size * offset);
            const radii = getCornerRadii(shape, sideLength, borderRadius);
            rectangles.push(...drawFinderRect(xCorner, yCorner, sideLength, xSign, ySign, sweep, radii));
        }
    }
    return rectangles.join(" ");
}

export function getFinderInnerSVGPath(
    matrix: Matrix, size: number, margin: number,
    borderRadius: number, shape: FinderShape
): string {
    const matrixSize = matrix.length * size + margin * 2;
    const rectangles: (string | number)[] = [];
    for (const side of FINDER_SIDES) {
        const [xSign, ySign] = side.map(s => s === 0 ? 1 : -1);
        const sweep = side[1] | side[0];
        const sideLength = size * (FINDER_END - 2 * 2); // offset=2, inner dot = 3 modules
        const xCorner = matrixSize * side[0] + xSign * (margin + size * 2);
        const yCorner = matrixSize * side[1] + ySign * (margin + size * 2);
        const radii = getCornerRadii(shape, sideLength, borderRadius);
        rectangles.push(...drawFinderRect(xCorner, yCorner, sideLength, xSign, ySign, sweep, radii));
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

export interface LabelLayout {
    totalWidth: number;
    totalHeight: number;
    qrSize: number;
    label: {
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
        fontFamily: string;
        textColor: string;
        bgColor: string | null;
        borderRadius: number;
    };
}

export function computeLabelLayout(
    options: ImageOptions,
    qrSizePx: number,
    marginPx: number,
    moduleSize: number,
): LabelLayout | null {
    if (!options.labelText) return null;

    const style: LabelStyle = options.labelStyle ?? "below";
    const fontSize = (options.labelFontSize ?? 5) * moduleSize;
    const fontFamily = options.labelFontFamily ?? "sans-serif";
    const fgColor = colorToHex(options.color ?? 0x000000ff);
    const bgColorHex = colorToHex(options.bgColor ?? 0xffffffff);

    const textColor = options.labelColor
        ? colorToHex(options.labelColor)
        : style === "below" ? fgColor : bgColorHex;
    const labelBgColor = options.labelBgColor
        ? colorToHex(options.labelBgColor)
        : fgColor;

    if (style === "below") {
        const stripHeight = fontSize * 2.5;
        return {
            totalWidth: qrSizePx,
            totalHeight: qrSizePx + stripHeight,
            qrSize: qrSizePx,
            label: {
                text: options.labelText,
                x: qrSizePx / 2,
                y: qrSizePx + stripHeight / 2,
                width: qrSizePx,
                height: stripHeight,
                fontSize,
                fontFamily,
                textColor,
                bgColor: null,
                borderRadius: 0,
            },
        };
    }

    if (style === "pill") {
        const pillHeight = fontSize * 2.2;
        const estimatedTextWidth = options.labelText.length * fontSize * 0.7;
        const pillWidth = Math.min(Math.max(estimatedTextWidth + fontSize * 2, qrSizePx * 0.3), qrSizePx * 0.95);
        const stripHeight = pillHeight + fontSize * 0.6;
        return {
            totalWidth: qrSizePx,
            totalHeight: qrSizePx + stripHeight,
            qrSize: qrSizePx,
            label: {
                text: options.labelText,
                x: qrSizePx / 2,
                y: qrSizePx + stripHeight / 2,
                width: pillWidth,
                height: pillHeight,
                fontSize,
                fontFamily,
                textColor,
                bgColor: labelBgColor,
                borderRadius: pillHeight / 2,
            },
        };
    }

    // "box" style — full-width colored strip below
    const boxHeight = fontSize * 2.2;
    const stripHeight = boxHeight + fontSize * 0.4;
    return {
        totalWidth: qrSizePx,
        totalHeight: qrSizePx + stripHeight,
        qrSize: qrSizePx,
        label: {
            text: options.labelText,
            x: qrSizePx / 2,
            y: qrSizePx + stripHeight / 2,
            width: qrSizePx,
            height: boxHeight,
            fontSize,
            fontFamily,
            textColor,
            bgColor: labelBgColor,
            borderRadius: 0,
        },
    };
}
