import { Data, EcLevel, Matrix } from "./typing/types";

// {{{1 Initialize matrix with zeros
export function init(version: number): Matrix {
    const N = (version << 2) + 0b10001;
    const matrix: Matrix = [];
    let zeros: number[] = Array(N).fill(0);
    for (let i = 0; i < N; i++) {
        matrix[i] = [...zeros];
    }
    return matrix;
}

// {{{1 Put finders into matrix
export function fillFinders(matrix: Matrix) {
    const N = matrix.length;
    for (var i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
            const max = Math.max(i, j);
            const min = Math.min(i, j);
            const pixel =
                (max == 2 && min >= -2) || (min == -2 && max <= 2)
                    ? 0x80
                    : 0x81;
            matrix[3 + i][3 + j] = pixel;
            matrix[3 + i][N - 4 + j] = pixel;
            matrix[N - 4 + i][3 + j] = pixel;
        }
    }
    for (var i = 0; i < 8; i++) {
        matrix[7][i] =
            matrix[i][7] =
            matrix[7][N - i - 1] =
            matrix[i][N - 8] =
            matrix[N - 8][i] =
            matrix[N - 1 - i][7] =
                0x80;
    }
}

// {{{1 Put align and timinig
export function fillAlignAndTiming(matrix: Matrix) {
    const N = matrix.length;
    if (N > 21) {
        const len = N - 13;
        let delta = Math.round(len / Math.ceil(len / 28));
        if (delta % 2) delta++;
        const res = [];
        for (let p = len + 6; p > 10; p -= delta) {
            res.unshift(p);
        }
        res.unshift(6);
        for (var i = 0; i < res.length; i++) {
            for (let j = 0; j < res.length; j++) {
                const x = res[i];
                const y = res[j];
                if (matrix[x][y]) continue;
                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        const max = Math.max(r, c);
                        const min = Math.min(r, c);
                        const pixel =
                            (max == 1 && min >= -1) || (min == -1 && max <= 1)
                                ? 0x80
                                : 0x81;
                        matrix[x + r][y + c] = pixel;
                    }
                }
            }
        }
    }
    for (var i = 8; i < N - 8; i++) {
        matrix[6][i] = matrix[i][6] = i % 2 ? 0x80 : 0x81;
    }
}

// {{{1 Fill reserved areas with zeroes
export function fillStub(matrix: Matrix) {
    const N = matrix.length;
    for (var i = 0; i < 8; i++) {
        if (i != 6) {
            matrix[8][i] = matrix[i][8] = 0x80;
        }
        matrix[8][N - 1 - i] = 0x80;
        matrix[N - 1 - i][8] = 0x80;
    }
    matrix[8][8] = 0x80;
    matrix[N - 8][8] = 0x81;

    if (N < 45) return;

    for (var i = N - 11; i < N - 8; i++) {
        for (let j = 0; j < 6; j++) {
            matrix[i][j] = matrix[j][i] = 0x80;
        }
    }
}

// {{{1 Fill reserved areas
export const fillReserved = (function () {
    const FORMATS: number[] = Array(32);
    const VERSIONS: number[] = Array(40);

    const gf15 = 0x0537;
    const gf18 = 0x1f25;
    const formats_mask = 0x5412;

    for (let format = 0; format < 32; format++) {
        let res = format << 10;
        for (let i = 5; i > 0; i--) {
            if (res >>> (9 + i)) {
                res ^= gf15 << (i - 1);
            }
        }
        FORMATS[format] = (res | (format << 10)) ^ formats_mask;
    }

    for (let version = 7; version <= 40; version++) {
        let res = version << 12;
        for (let i = 6; i > 0; i--) {
            if (res >>> (11 + i)) {
                res ^= gf18 << (i - 1);
            }
        }
        VERSIONS[version] = res | (version << 12);
    }

    const EC_LEVELS: { [K in EcLevel]: number } = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2,
    };

    return function fillReserved(
        matrix: Matrix,
        ec_level: EcLevel,
        mask: number
    ) {
        const N = matrix.length;
        const format = FORMATS[(EC_LEVELS[ec_level] << 3) | mask];

        function F(k: number) {
            return (format >> k) & 1 ? 0x81 : 0x80;
        }
        for (var i = 0; i < 8; i++) {
            matrix[8][N - 1 - i] = F(i);
            if (i < 6) matrix[i][8] = F(i);
        }
        for (var i = 8; i < 15; i++) {
            matrix[N - 15 + i][8] = F(i);
            if (i > 8) matrix[8][14 - i] = F(i);
        }
        matrix[7][8] = F(6);
        matrix[8][8] = F(7);
        matrix[8][7] = F(8);

        const version = VERSIONS[(N - 17) / 4];
        if (!version) {
            return;
        }

        function V(k: number) {
            return (version >> k) & 1 ? 0x81 : 0x80;
        }
        for (var i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                matrix[N - 11 + j][i] = matrix[i][N - 11 + j] = V(i * 3 + j);
            }
        }
    };
})();

// {{{1 Fill data
export const fillData = (function () {
    const MASK_FUNCTIONS = [
        (i: number, j: number) => (i + j) % 2 == 0,
        (i: number, j: number) => i % 2 == 0,
        (i: number, j: number) => j % 3 == 0,
        (i: number, j: number) => (i + j) % 3 == 0,
        (i: number, j: number) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0,
        (i: number, j: number) => ((i * j) % 2) + ((i * j) % 3) == 0,
        (i: number, j: number) => (((i * j) % 2) + ((i * j) % 3)) % 2 == 0,
        (i: number, j: number) => (((i * j) % 3) + ((i + j) % 2)) % 2 == 0,
    ];

    return function fillData(matrix: Matrix, data: Data, mask: number) {
        const N = matrix.length;
        let row: number;
        let col: number;
        let dir = -1;
        row = col = N - 1;
        const mask_fn = MASK_FUNCTIONS[mask];
        let len = data.blocks[data.blocks.length - 1].length;

        for (var i = 0; i < len; i++) {
            for (var b = 0; b < data.blocks.length; b++) {
                if (data.blocks[b].length <= i) {
                    continue;
                }
                put(data.blocks[b][i]);
            }
        }

        len = data.ec_len;
        for (var i = 0; i < len; i++) {
            for (var b = 0; b < data.ec.length; b++) {
                put(data.ec[b][i]);
            }
        }

        if (col > -1) {
            do {
                matrix[row][col] = mask_fn(row, col) ? 1 : 0;
            } while (next());
        }

        function put(byte: number) {
            for (let mask = 0x80; mask; mask >>= 1) {
                let pixel = !!(mask & byte);
                if (mask_fn(row, col)) pixel = !pixel;
                matrix[row][col] = pixel ? 1 : 0;
                next();
            }
        }

        function next() {
            do {
                if (col % 2 ^ Number(col < 6)) {
                    if ((dir < 0 && row == 0) || (dir > 0 && row == N - 1)) {
                        col--;
                        dir = -dir;
                    } else {
                        col++;
                        row += dir;
                    }
                } else {
                    col--;
                }
                if (col == 6) {
                    col--;
                }
                if (col < 0) {
                    return false;
                }
            } while (matrix[row][col] & 0xf0);
            return true;
        }
    };
})();

// {{{1 Calculate penalty
export function calculatePenalty(matrix: Matrix) {
    const N = matrix.length;
    let penalty = 0;
    // Rule 1
    for (var i = 0; i < N; i++) {
        var pixel = matrix[i][0] & 1;
        var len = 1;
        for (var j = 1; j < N; j++) {
            var p = matrix[i][j] & 1;
            if (p == pixel) {
                len++;
                continue;
            }
            if (len >= 5) {
                penalty += len - 2;
            }
            pixel = p;
            len = 1;
        }
        if (len >= 5) {
            penalty += len - 2;
        }
    }
    for (var j = 0; j < N; j++) {
        var pixel = matrix[0][j] & 1;
        var len = 1;
        for (var i = 1; i < N; i++) {
            var p = matrix[i][j] & 1;
            if (p == pixel) {
                len++;
                continue;
            }
            if (len >= 5) {
                penalty += len - 2;
            }
            pixel = p;
            len = 1;
        }
        if (len >= 5) {
            penalty += len - 2;
        }
    }

    // Rule 2
    for (var i = 0; i < N - 1; i++) {
        for (var j = 0; j < N - 1; j++) {
            const s =
                (matrix[i][j] +
                    matrix[i][j + 1] +
                    matrix[i + 1][j] +
                    matrix[i + 1][j + 1]) &
                7;
            if (s == 0 || s == 4) {
                penalty += 3;
            }
        }
    }

    // Rule 3
    function I(k: number) {
        return matrix[i][j + k] & 1;
    }
    function J(k: number) {
        return matrix[i + k][j] & 1;
    }
    for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
            if (
                j < N - 6 &&
                I(0) &&
                !I(1) &&
                I(2) &&
                I(3) &&
                I(4) &&
                !I(5) &&
                I(6)
            ) {
                if (j >= 4 && !(I(-4) || I(-3) || I(-2) || I(-1))) {
                    penalty += 40;
                }
                if (j < N - 10 && !(I(7) || I(8) || I(9) || I(10))) {
                    penalty += 40;
                }
            }

            if (
                i < N - 6 &&
                J(0) &&
                !J(1) &&
                J(2) &&
                J(3) &&
                J(4) &&
                !J(5) &&
                J(6)
            ) {
                if (i >= 4 && !(J(-4) || J(-3) || J(-2) || J(-1))) {
                    penalty += 40;
                }
                if (i < N - 10 && !(J(7) || J(8) || J(9) || J(10))) {
                    penalty += 40;
                }
            }
        }
    }

    // Rule 4
    let numDark = 0;
    for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
            if (matrix[i][j] & 1) numDark++;
        }
    }
    penalty += 10 * Math.floor(Math.abs(10 - (20 * numDark) / (N * N)));

    return penalty;
}

// {{{1 All-in-one function
export function getMatrix(data: Data) {
    const matrix = init(data.version);
    fillFinders(matrix);
    fillAlignAndTiming(matrix);
    fillStub(matrix);

    let penalty = Infinity;
    let bestMask = 0;
    for (let mask = 0; mask < 8; mask++) {
        fillData(matrix, data, mask);
        fillReserved(matrix, data.ec_level, mask);
        const p = calculatePenalty(matrix);
        if (p < penalty) {
            penalty = p;
            bestMask = mask;
        }
    }

    fillData(matrix, data, bestMask);
    fillReserved(matrix, data.ec_level, bestMask);

    return matrix.map((row) => row.map((cell) => cell & 1));
}
