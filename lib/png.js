"use strict";

const upng = require('upng');
const Jimp = require('jimp');

async function bitmap(matrix, size, margin, logo, logo_width, logo_heigh) {
    const N = matrix.length;
    const Npx = N * size;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;
    const imageArray = new Uint8Array(
        (Npx ** 2 + marginPx * size * 3 * Npx + marginPx * size * size * 2) * 4
    );
    const jimp = await new Promise(resolve => new Jimp(imageSize, imageSize, 0xffffffff, (err, image) => resolve(image)));
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            for (let sizeX = 0; sizeX < size; sizeX++) {
                for (let sizeY = 0; sizeY < size; sizeY++) {
                    if (matrix[y][x]){
                        jimp.setPixelColor(0x000000ff, x * size + sizeX + marginPx, y * size + sizeY + marginPx)
                    }
                }
            }
        }
    }
    if (logo) {
        const logoJimp = await Jimp.read(logo);
        logoJimp.resize(logo_width / 100 * imageSize, logo_heigh / 100 * imageSize);
        jimp.blit(logoJimp, imageSize / 2 - logo_width / 2 / 100 * imageSize, imageSize / 2 - logo_width / 2 / 100 * imageSize);
        
    }

    return await jimp.getBufferAsync('image/png');
}

module.exports = {
    bitmap,
}
