import { getPNG } from "../png_browser.js";
import { getPDF } from "../pdf.js";
import { getSVG } from "../svg.js";
import test from "ava";
import { readFileSync } from "fs";
import { writeFile } from "node:fs/promises";
import { ImageType } from '../typing/types.js';
import { QRImageOptions } from '../qr.js';
import { JSDOM } from 'jsdom';
import { assertEqual, generatedImageDir, goldenDir } from "./_common.js";

test.before(async () => {
    const dom = new JSDOM('<div id="my-element-id" />', { resources: "usable"});  // insert any html needed for the unit test suite here
    global.document = dom.window.document;
    global.window = dom.window as any;
    global.Image = dom.window.Image;
    global.Event = dom.window.Event;
    global.FileReader = dom.window.FileReader;
    global.Blob = dom.window.Blob;
    global.atob = dom.window.atob;
    global.navigator = dom.window.navigator;
})

const text = "I \u2764\uFE0F QR code!";
// const text = 'https://yadi.sk/d/FuzPeEg-QyaZN?qr';
interface TestParams {
    name: string;
    type: ImageType;
    filename: string;
    params: QRImageOptions;
}

const defaultParams = {
    ec_level: "Q" as const,
    margin: 1,
    parse_url: true,
};

const functions = {
    "png": getPNG,
    "pdf": getPDF,
    "svg": getSVG,
};

([
    {
        name: "PNG",
        type: "png",
        filename: "qr.png",

    },
    {
        name: "PNG with colors",
        type: "png",
        filename: "qr_with_colors.png",
        params: {
            color: 0x0000a0ff,
            bgColor: 0xffa0ffff,
        },
    },
    {
        name: "PNG with colors (hex)",
        type: "png",
        filename: "qr_with_colors.png",
        params: {
            color: '#0000a0',
            bgColor: '#ffa0ff',
        },
    },
    {
        name: "PNG with logo",
        type: "png",
        filename: "qr_with_logo.png",
        params: { logo: readFileSync(`${goldenDir}/logo.png`) },
    },
    {
        name: "PNG with colors (rgba)",
        type: "png",
        filename: "qr_with_colors_rgba.png",
        params: {
            color: 'rgba(255, 0, 0, 0.5)',
            bgColor: 'rgba(255, 255, 255, 0.1)',
        },
    },
    {
        name: "SVG",
        type: "svg",
        filename: "qr.svg",
    },
    {
        name: "SVG with EC level",
        type: "svg",
        filename: "qr_with_ec_level.svg",
        params: {
            ec_level: "H",
        },
    },
    {
        name: "SVG with size",
        type: "svg",
        filename: "qr_with_size.svg",
        params: {
            size: 6,
        },
    },
    {
        name: "SVG with colors (hex)",
        type: "svg",
        filename: "qr_with_colors.svg",
        params: {
            color: '#ff0000',
            bgColor: '#00ff00',
        },
    },
    {
        name: "SVG with colors (number)",
        type: "svg",
        filename: "qr_with_colors.svg",
        params: {
            color: 0xff0000ff,
            bgColor: 0x00ff00ff,
        },
    },
    {
        name: "SVG with logo as blob",
        type: "svg",
        filename: "qr_with_logo_as_arraybuffer.svg",
        params: {
            logo: readFileSync(`${goldenDir}/logo.png`),
        },
    },
    {
        name: "PDF",
        type: "pdf",
        filename: "qr.pdf",
    },
    {
        name: "PDF with colors",
        type: "pdf",
        filename: "qr_with_colors.pdf",
        params: { color: 0xff0000ff, bgColor: 0x00ff00ff },
    },
    {
        name: "PDF with arraybuffer",
        type: "pdf",
        filename: "qr_logo_arraybuffer.pdf",
        params: {
            logo: readFileSync(`${goldenDir}/logo.png`).buffer,
        },
    },
    {
        name: "PDF with logo",
        type: "pdf",
        filename: "qr_with_logo.pdf",
        params: { logo: readFileSync(`${goldenDir}/logo.png`) },
    },
] as TestParams[]) .forEach((testData) => {
    test(`browser > ${testData.name}`, async (t) => {
        const image = await functions[testData.type](text, {
            type: testData.type,
            ...defaultParams,
            ...testData.params,
        });
        await writeFile(`${generatedImageDir}/browser_${testData.filename}`, Buffer.from(image));
        await assertEqual(t, 'browser_' + testData.filename);
    });
});
