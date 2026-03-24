import { ImageOptions, Matrix } from "./typing/types.js";
import { QR } from "./qr-base.js";
import { createSVG } from "./svg.js";
import { computeLabelLayout, getOptions } from "./utils.js";
import sharp from "sharp";
import { clearMatrixCenter, zeroFillFinders } from "./bitMatrix.js";

export async function getPNG(text: string, inOptions: ImageOptions = {}) {
    const options = getOptions({ ...inOptions, type: "png" });

    let matrix = QR(text, options.ec_level, options.parse_url);
    matrix = zeroFillFinders(matrix)
    if (options.logo && options.logoWidth && options.logoHeight && !options.noExcavate) {
        matrix = clearMatrixCenter(matrix, options.logoWidth, options.logoHeight);
    }

    const marginPx = options.margin * options.size;
    const imageSizePx = matrix.length * options.size + marginPx * 2;
    const layout = computeLabelLayout(options, imageSizePx, marginPx, options.size);

    return generateImage({ matrix, ...options, type: "png", labelLayout: layout });
}

export async function generateImage({
    matrix,
    size,
    margin,
    logo,
    logoWidth,
    logoHeight,
    labelLayout,
    ...rest
}: ImageOptions & { matrix: Matrix; labelLayout?: ReturnType<typeof computeLabelLayout> }) {
    const actualSize = size ?? 5;
    const actualMargin = margin ?? 1;
    const actualLogoWidth = logoWidth ?? 20;
    const actualLogoHeight = logoHeight ?? 20;
    const matrixSizePx = matrix.length * actualSize;
    const imageSizePx = matrixSizePx + actualMargin * actualSize * 2;
    const totalWidth = labelLayout?.totalWidth ?? imageSizePx;
    const totalHeight = labelLayout?.totalHeight ?? imageSizePx;

    if (actualSize > 200) {
        throw new Error("Module size is too big, resulting image is too large: " + imageSizePx);
    }

    const svg = createSVG({
        matrix,
        size: actualSize,
        margin: actualMargin,
        logoWidth: actualLogoWidth,
        logoHeight: actualLogoHeight,
        ...rest,
        imageWidth: totalWidth,
        imageHeight: totalHeight,
        labelLayout,
    });
    const qrImage = sharp(svg);
    const layers: sharp.OverlayOptions[] = [];
    if (logo) {
        const sharpLogo = sharp(logo as ArrayBuffer).resize(
            Math.round((matrixSizePx * actualLogoWidth) / 100),
            Math.round((matrixSizePx * actualLogoHeight) / 100),
            { fit: "contain" }
        );
        const logoWidthPx = Math.round((matrixSizePx * actualLogoWidth) / 100);
        const logoHeightPx = Math.round((matrixSizePx * actualLogoHeight) / 100);
        const data = await sharpLogo.toBuffer();
        layers.push({
            input: data,
            left: Math.round((imageSizePx - logoWidthPx) / 2),
            top: Math.round((imageSizePx - logoHeightPx) / 2),
        });
        qrImage.composite(layers);
    }
    const { data } = await qrImage
        .png({ palette: !logo }) // no logo results in much less colors
        .toBuffer({ resolveWithObject: true });
    return new Uint8ClampedArray(data.buffer);
}
