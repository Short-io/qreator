// {{{1 export functions
export function calculateEC(msg: number[], ec_len: number): Uint8Array {
    const len = msg.length;
    const buf = new Array(len + ec_len);
    for (let i = 0; i < len; i++) buf[i] = msg[i];
    for (let i = len; i < len + ec_len; i++) buf[i] = 0;

    const poly = generatorPolynomial(ec_len);

    for (let offset = 0; offset < len; offset++) {
        if (!buf[offset]) continue;
        const log_k = log(buf[offset]);
        for (let i = 0; i <= ec_len; i++) {
            buf[offset + i] = buf[offset + i] ^ exp(poly[i] + log_k);
        }
    }
    return new Uint8Array(buf.slice(len));
}

// {{{1 Galois Field Math
const GF256_BASE = 285;

const EXP_TABLE: number[] = [1];
const LOG_TABLE: number[] = [];

for (let i = 1; i < 256; i++) {
    let n = EXP_TABLE[i - 1] << 1;
    if (n > 255) n ^= GF256_BASE;
    EXP_TABLE[i] = n;
}

for (let i = 0; i < 255; i++) {
    LOG_TABLE[EXP_TABLE[i]] = i;
}

function exp(k: number) {
    return EXP_TABLE[((k % 255) + 255) % 255];
}

function log(k: number) {
    if (k < 1 || k > 255) {
        throw Error(`Bad log(${k})`);
    }
    return LOG_TABLE[k];
}

// {{{1 Generator Polynomials
const POLYNOMIALS = [
    [0], // a^0 x^0
    [0, 0], // a^0 x^1 + a^0 x^0
    [0, 25, 1], // a^0 x^2 + a^25 x^1 + a^1 x^0
    // and so on...
];

function generatorPolynomial(num: number): number[] {
    if (POLYNOMIALS[num]) {
        return POLYNOMIALS[num];
    }
    const prev = generatorPolynomial(num - 1);
    const res = [];

    res[0] = prev[0];
    for (let i = 1; i <= num; i++) {
        res[i] = log(exp(prev[i]) ^ exp(prev[i - 1] + num - 1));
    }
    POLYNOMIALS[num] = res;
    return res;
}
