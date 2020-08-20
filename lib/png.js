"use strict";

var zlib = require('zlib');
const upng = require('upng');

var crc32 = require('./crc32');

var PNG_HEAD = Buffer.from([137,80,78,71,13,10,26,10]);
var PNG_IHDR = Buffer.from([0,0,0,13,73,72,68,82,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0]);
var PNG_IDAT = Buffer.from([0,0,0,0,73,68,65,84]);
var PNG_IEND = Buffer.from([0,0,0,0,73,69,78,68,174,66,96,130]);

function png(bitmap, stream) {
    stream.push(PNG_HEAD);

    var IHDR = Buffer.concat([PNG_IHDR]);
    IHDR.writeUInt32BE(bitmap.size, 8);
    IHDR.writeUInt32BE(bitmap.size, 12);
    IHDR.writeUInt32BE(crc32(IHDR.slice(4, -4)), 21);
    stream.push(IHDR);

    var IDAT = Buffer.concat([
        PNG_IDAT,
        zlib.deflateSync(bitmap.data, { level: 9 }),
        Buffer.alloc(4)
    ]);
    IDAT.writeUInt32BE(IDAT.length - 12, 0);
    IDAT.writeUInt32BE(crc32(IDAT.slice(4, -4)), IDAT.length - 4);
    stream.push(IDAT);

    stream.push(PNG_IEND);
    stream.push(null);
}

function bitmap(matrix, size, margin) {
    const N = matrix.length;
    const Npx = N * size;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;
    const imageArray = new Uint8Array(
        (Npx ** 2 + marginPx * size * 3 * Npx + marginPx * size * size * 2) * 4
    );
    imageArray.fill(255);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            for (let sizeX = 0; sizeX < size; sizeX++) {
                for (let sizeY = 0; sizeY < size; sizeY++) {
                    const position =  (
                        (y * size + sizeY) * N * size + (marginPx * 2) * (y * size + sizeY) + // Y offset 
                        x * size + sizeX + marginPx + // X offset
                        N * size * marginPx + marginPx * 2 + marginPx * size + marginPx * 3
                    ) * 4 // 4 bytes per color;
                    const color = matrix[y][x] ? [0, 0, 0, 255] : [255, 255, 255, 255];
                    imageArray.set(color, position);
                }
            }
        }
    }
    return Buffer.from(upng.encode(imageArray, imageSize, imageSize));
}

module.exports = {
    bitmap,
    png
}
