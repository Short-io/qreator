export type MatrixValue = 0 | 1 | 128 | 129;
export type Matrix = MatrixValue[][];
export type BitMatrix = (0 | 1)[][];

export interface Data {
    blocks: number[][];
    ec: number[][];
    ec_len: number;
    ec_level: EcLevel;
    version: number;
    data_len: number;
}

export interface NumberData {
    [key: string]: number[];
}

/**
 * Error correction level, one of 'L', 'M', 'Q', 'H'.
 * @default 'M'
 */
export type EcLevel = "L" | "M" | "Q" | "H";

/**
 * Output type, one of 'png', 'svg', 'pdf'.
 * @default 'png'
 */
export type ImageType = "png" | "svg" | "pdf";

/**
 * Shape of the finder pattern (corner) elements.
 * - 'square': sharp corners
 * - 'rounded': rounded corners using the borderRadius value
 * - 'circle': fully rounded (maximum border radius)
 * - 'drop': 3 rounded corners + 1 sharp corner pointing toward the QR center
 */
export type FinderShape = "square" | "rounded" | "circle" | "drop";

/**
 * How corners of data modules are rendered when borderRadius > 0.
 * - 'individual': each module has independently rounded corners (default)
 * - 'merge': adjacent modules share edges; only outer corners are rounded
 */
export type CornerMode = "individual" | "merge";

/**
 * Label presentation style.
 * - 'below': plain text beneath the QR code
 * - 'pill': rounded pill/badge with colored background beneath the QR code
 * - 'box': full-width colored strip beneath the QR code
 */
export type LabelStyle = "below" | "pill" | "box";

/**
 * Image options.
 */
export interface ImageOptions {
    /**
     * Error correction level, one of 'L', 'M', 'Q', 'H'.
     * @default 'M'
     */
    ec_level?: EcLevel;

    /**
     * Output type, one of 'png', 'svg', 'pdf'.
     * Documentation is wrong though, it's `undefined`!
     * @default 'png'
     */
    type?: ImageType;

    /**
     * (PNG and SVG only) Module size in pixels.
     * @default 5 //for PNG
     * @default 0 //for others
     */
    size?: number;

    /**
     * Margin of the resulting image in modules.
     * @default 4 //for PNG
     * @default 1 //for others
     */
    margin?: number;

    /**
     * (EXPERIMENTAL) Try to optimize QR code for URLs.
     * @default false
     */
    parse_url?: boolean;

    /**
     * Buffer with PNG image to draw on top of QR code.
     * @default undefined
     */
    logo?: ArrayBufferLike;

    /**
     * Width of the overlay logo in percent.
     * @default 20
     */
    logoWidth?: number;

    /**
     * Height of the overlay logo in percent.
     * @default 20
     */
    logoHeight?: number;

    /**
     * by default we remove partially covered modules under the logo, this option disables such behaviour
     */
    noExcavate?: boolean;
    /**
     * Foreground color in RGBA format.
     * @default 0x000000FF
     */
    color?: number | string;

    /**
     * Background color in RGBA format.
     * @default 0xFFFFFFFF
     */
    bgColor?: number | string;

    /**
     * border radius of the points
     */
    borderRadius?: number;

    /**
     * How corners of data modules are rendered when borderRadius > 0.
     * - 'individual': each module has independently rounded corners (default)
     * - 'merge': adjacent modules share edges; only outer corners are rounded
     * @default 'individual'
     */
    cornerMode?: CornerMode;

    /**
     * Shape of the outer ring of finder patterns (corners).
     * When set, overrides borderRadius for the finder outer ring.
     * @default undefined (uses borderRadius)
     */
    finderOuterShape?: FinderShape;

    /**
     * Shape of the inner dot of finder patterns (corners).
     * When set, overrides borderRadius for the finder inner dot.
     * @default undefined (uses borderRadius)
     */
    finderInnerShape?: FinderShape;

    /**
     * Color of the finder patterns (corners). Overrides `color` for finders only.
     * Accepts same formats as `color` (number 0xRRGGBBAA or CSS string).
     * @default undefined (uses color)
     */
    finderColor?: number | string;

    /**
     * Text to display as a label on the QR code.
     * @default undefined
     */
    labelText?: string;

    /**
     * Label presentation style.
     * - 'below': plain text beneath the QR code
     * - 'pill': rounded pill/badge with colored background beneath the QR code
     * - 'box': full-width colored strip beneath the QR code
     * @default 'below'
     */
    labelStyle?: LabelStyle;

    /**
     * Label text color. Accepts same formats as `color`.
     * @default For 'below': same as `color`. For 'banner'/'tab': same as `bgColor`.
     */
    labelColor?: number | string;

    /**
     * Label background color (used by 'banner' and 'tab' styles).
     * Accepts same formats as `color`.
     * @default same as `color` (foreground)
     */
    labelBgColor?: number | string;

    /**
     * Label font size as a multiple of the module size.
     * @default 5
     */
    labelFontSize?: number;

    /**
     * Label font family.
     * @default 'sans-serif'
     */
    labelFontFamily?: string;
}
