"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPNG = void 0;
const plugin_blit_1 = __importDefault(require("@jimp/plugin-blit"));
const qr_base_1 = require("./qr-base");
const utils_1 = require("./utils");
async function getPNG(text, inOptions) {
    const options = utils_1.getOptions(inOptions);
    const matrix = qr_base_1.QR(text, options.ec_level, options.parse_url);
    return PNG({ matrix, ...options });
}
exports.getPNG = getPNG;
async function PNG({ matrix, size, margin, logo, logoWidth, logoHeight, color, bgColor, }) {
    const N = matrix.length;
    const marginPx = margin * size;
    const imageSize = matrix.length * size + marginPx * 2;
    const { default: Jimp } = process.browser
        ? await Promise.resolve().then(() => __importStar(require("jimp/browser/lib/jimp")))
        : await Promise.resolve().then(() => __importStar(require("jimp/es")));
    const jimp = await new Promise((resolve) => new Jimp(imageSize, imageSize, bgColor, (err, image) => resolve(image)));
    for (let y = 0; y < N; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            for (let sizeX = 0; sizeX < size; sizeX += 1) {
                for (let sizeY = 0; sizeY < size; sizeY += 1) {
                    if (matrix[y][x]) {
                        jimp.setPixelColor(color, x * size + sizeX + marginPx, y * size + sizeY + marginPx);
                    }
                }
            }
        }
    }
    if (logo) {
        const logoJimp = await Jimp.read(logo);
        logoJimp.resize((logoWidth / 100) * imageSize, (logoHeight / 100) * imageSize);
        plugin_blit_1.default().blit(logoJimp, imageSize / 2 - (logoWidth / 2 / 100) * imageSize, imageSize / 2 - (logoHeight / 2 / 100) * imageSize);
    }
    return jimp.getBufferAsync("image/png");
}
