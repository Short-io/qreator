export type Matrix = number[][];

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
    logo?: ArrayBufferLike | Buffer;

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
}
