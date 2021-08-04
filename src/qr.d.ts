declare module '@shortcm/qr-image' {
  /**
   * Error correction level, one of 'L', 'M', 'Q', 'H'.
   * @default 'M'
   */
  export type EcLevel = 'L' | 'M' | 'Q' | 'H';

  /**
   * Output type, one of 'png', 'svg', 'pdf'.
   * @default 'png'
   */
  export type ImageType = 'png' | 'svg' | 'pdf';

  /**
   * Image options.
   */
  export interface Options {
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
    logo?: Buffer;

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
    color?: number;

    /**
     * Background color in RGBA format.
     * @default 0xFFFFFFFF
     */
    bgColor?: number;
  }

  /**
   * Generates a QR code image.
   * @param {string} text The text to encode.
   * @param {Options} options Image options, like format, size, etc.
   * @returns {Promise<Buffer>} A promise to the image buffer.
   */
  export function image(text: string, options?: Options): Promise<Buffer>;

  /**
   * Generates a png QR code image.
   * @param {string} text The text to encode.
   * @param {Options} options Image options, like format, size, etc.
   * @returns {Promise<Buffer>} A promise to the png image buffer.
   */
  export function getPNG(text: string, options?: Options): Promise<Buffer>;

  /**
   * Generates a svg QR code image.
   * @param {string} text The text to encode.
   * @param {Options} options Image options, like format, size, etc.
   * @returns {Promise<Buffer>} A promise to the png image buffer.
   */
  export function getSVG(text: string, options?: Options): Promise<Buffer>;

  /**
   * Generates a pdf QR code image.
   * @param {string} text The text to encode.
   * @param {Options} options Image options, like format, size, etc.
   * @returns {Promise<Buffer>} A promise to the png image buffer.
   */
  export function getPDF(text: string, options?: Options): Promise<Buffer>;

  /**
   * Generates a 2D array of "booleans" (numbers).
   * Y is indexed first, e.g. `[y][x]`, not `[x][y]`.
   * `[0][0]` is the top left and `1` (`true`) means foreground, `0` (`false`) means background.
   * @param {string} text The text to encode.
   * @param {EcLevel} ec_level The error correction level to use.
   * @param {boolean} parse_url (EXPERIMENTAL) Try to optimize QR code for URLs.
   * @returns {any[][]} 2D array of booleans representing the QR code.
   */
  export function matrix(
    text: string,
    ec_level?: EcLevel,
    parse_url?: boolean
  ): number[][];
}

declare module '@shortcm/qr-image/lib/png' {
  export { getPNG } from '@shortcm/qr-image';
}

declare module '@shortcm/qr-image/lib/pdf' {
  export { getPDF } from '@shortcm/qr-image';
}

declare module '@shortcm/qr-image/lib/svg' {
  export { getSVG } from '@shortcm/qr-image';
}
