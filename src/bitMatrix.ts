import { BitMatrix } from "./typing/types";

/**
 * Finders require different UI representation, so we zero-fill finders and draw them later
 */
export function zeroFillFinders(matrix: BitMatrix): BitMatrix {
    matrix = structuredClone(matrix); // avoid mutating input arg
    const N = matrix.length;
    const zeroPixel = 0;
    // squares
    for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
            matrix[3 + i][3 + j] = zeroPixel;
            matrix[3 + i][N - 4 + j] = zeroPixel;
            matrix[N - 4 + i][3 + j] = zeroPixel;
        }
    }
    // border
    for (let i = 0; i < 8; i++) {
        matrix[7][i] =
            matrix[i][7] =
            matrix[7][N - i - 1] =
            matrix[i][N - 8] =
            matrix[N - 8][i] =
            matrix[N - 1 - i][7] =
            zeroPixel;
    }
    return matrix;
}

/**
 * Before we insert logo in the QR we need to clear pixels under the logo. This function clears pixels
 */
export function clearMatrixCenter(matrix: BitMatrix, widthPct: number, heightPct: number): BitMatrix {
    matrix = structuredClone(matrix); // avoid mutating input arg

    // TODO: Here's a homegrown formula, perhaps could be simplified
    const mW = matrix.length;
    const cW = Math.ceil(((mW * widthPct) / 100 + (mW % 2)) / 2) * 2 - (mW % 2);
    const mH = matrix[0]?.length ?? 0;
    const cH = Math.ceil(((mH * heightPct) / 100 + (mH % 2)) / 2) * 2 - (mH % 2);

    // Given the formula, these must be whole numbers, but round anyway to account for js EPSILON
    const clearStartX = Math.round((mW - cW) / 2);
    const clearStartY = Math.round((mH - cH) / 2);

    for (let x = clearStartX; x < clearStartX + cW; x += 1) {
        for (let y = clearStartY; y < clearStartY + cH; y += 1) {
            matrix[x][y] = 0;
        }
    }
    return matrix;
}
