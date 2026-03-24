import { inflate } from "./compress.js";

export interface DecodedPng {
    width: number;
    height: number;
    rgb: Uint8Array;
    alpha: Uint8Array | null;
}

export async function decodePng(data: Uint8Array): Promise<DecodedPng> {
    // Verify PNG signature
    if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) {
        throw new Error("Invalid PNG signature");
    }

    let pos = 8; // skip signature
    let width = 0, height = 0, bitDepth = 0, colorType = 0;
    const idatChunks: Uint8Array[] = [];

    while (pos < data.length) {
        const length = readUint32(data, pos); pos += 4;
        const type = String.fromCharCode(data[pos], data[pos+1], data[pos+2], data[pos+3]); pos += 4;

        if (type === "IHDR") {
            width = readUint32(data, pos);
            height = readUint32(data, pos + 4);
            bitDepth = data[pos + 8];
            colorType = data[pos + 9];
            // pos+10 = compression, pos+11 = filter, pos+12 = interlace
            if (data[pos + 12] !== 0) throw new Error("Interlaced PNGs not supported");
            if (bitDepth !== 8) throw new Error("Only 8-bit PNGs supported");
        } else if (type === "IDAT") {
            idatChunks.push(data.subarray(pos, pos + length));
        } else if (type === "IEND") {
            break;
        }

        pos += length + 4; // data + CRC
    }

    // Concatenate IDAT chunks and decompress
    const compressedSize = idatChunks.reduce((s, c) => s + c.length, 0);
    const compressed = new Uint8Array(compressedSize);
    let offset = 0;
    for (const chunk of idatChunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
    }

    const raw = await inflate(compressed);

    // Determine channels and bytes per pixel
    let channels: number;
    if (colorType === 0) channels = 1;       // Grayscale
    else if (colorType === 2) channels = 3;  // RGB
    else if (colorType === 4) channels = 2;  // Grayscale + Alpha
    else if (colorType === 6) channels = 4;  // RGBA
    else throw new Error("Unsupported PNG color type: " + colorType);

    const bpp = channels; // bytes per pixel (bitDepth is always 8)
    const rowBytes = width * bpp;

    // Unfilter scanlines
    const pixels = new Uint8Array(width * height * bpp);
    let rawPos = 0;

    for (let y = 0; y < height; y++) {
        const filterType = raw[rawPos++];
        const row = pixels.subarray(y * rowBytes, (y + 1) * rowBytes);
        const prevRow = y > 0 ? pixels.subarray((y - 1) * rowBytes, y * rowBytes) : null;

        for (let x = 0; x < rowBytes; x++) {
            const rawByte = raw[rawPos++];
            const a = x >= bpp ? row[x - bpp] : 0;              // left
            const b = prevRow ? prevRow[x] : 0;                   // above
            const c = (x >= bpp && prevRow) ? prevRow[x - bpp] : 0; // upper-left

            switch (filterType) {
                case 0: row[x] = rawByte; break;
                case 1: row[x] = (rawByte + a) & 0xff; break;
                case 2: row[x] = (rawByte + b) & 0xff; break;
                case 3: row[x] = (rawByte + ((a + b) >> 1)) & 0xff; break;
                case 4: row[x] = (rawByte + paeth(a, b, c)) & 0xff; break;
                default: throw new Error("Unknown PNG filter: " + filterType);
            }
        }
    }

    // Split into RGB and alpha channels
    const pixelCount = width * height;
    if (colorType === 6) {
        // RGBA
        const rgb = new Uint8Array(pixelCount * 3);
        const alpha = new Uint8Array(pixelCount);
        let hasTransparency = false;
        for (let i = 0; i < pixelCount; i++) {
            rgb[i * 3] = pixels[i * 4];
            rgb[i * 3 + 1] = pixels[i * 4 + 1];
            rgb[i * 3 + 2] = pixels[i * 4 + 2];
            alpha[i] = pixels[i * 4 + 3];
            if (alpha[i] !== 255) hasTransparency = true;
        }
        return { width, height, rgb, alpha: hasTransparency ? alpha : null };
    } else if (colorType === 2) {
        // RGB, no alpha
        return { width, height, rgb: pixels, alpha: null };
    } else if (colorType === 4) {
        // Grayscale + Alpha → expand to RGB + Alpha
        const rgb = new Uint8Array(pixelCount * 3);
        const alpha = new Uint8Array(pixelCount);
        let hasTransparency = false;
        for (let i = 0; i < pixelCount; i++) {
            const g = pixels[i * 2];
            rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = g;
            alpha[i] = pixels[i * 2 + 1];
            if (alpha[i] !== 255) hasTransparency = true;
        }
        return { width, height, rgb, alpha: hasTransparency ? alpha : null };
    } else {
        // Grayscale → expand to RGB
        const rgb = new Uint8Array(pixelCount * 3);
        for (let i = 0; i < pixelCount; i++) {
            rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = pixels[i];
        }
        return { width, height, rgb, alpha: null };
    }
}

function readUint32(data: Uint8Array, pos: number): number {
    return ((data[pos] << 24) | (data[pos+1] << 16) | (data[pos+2] << 8) | data[pos+3]) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
}
