import test from "ava";
import { readFile, writeFile } from "node:fs/promises";

import { getQRImage, QRImageOptions } from "../qr.js";
import type { ImageType } from "../typing/types.js";
import { assertEqual, generatedImageDir, goldenDir } from "./_common.js";

const text = "I \u2764\uFE0F QR code!";
// const text = 'https://yadi.sk/d/FuzPeEg-QyaZN?qr';

const defaultParams = {
    ec_level: "Q" as const,
    margin: 1,
    parse_url: true,
};

interface TestParams {
    name: string;
    type: ImageType;
    filename: string;
    params: QRImageOptions;
}

([
    {
        name: "PNG",
        type: "png",
        filename: "qr.png",
    },
    {
        name: "PNG with size",
        type: "png",
        filename: "qr_with_size.png",
        params: {
            size: 9,
        }
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
        name: "PNG with logo",
        type: "png",
        filename: "qr_with_logo.png",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
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
        name: "SVG with colors",
        type: "svg",
        filename: "qr_with_colors.svg",
        params: {
            color: 0xff0000ff,
            bgColor: 0x00ff00ff,
        },
    },
    {
        name: "SVG with logo as buffer",
        type: "svg",
        filename: "qr_with_logo.svg",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
    },
    {
        name: "SVG with logo as arraybuffer",
        type: "svg",
        filename: "qr_with_logo_as_arraybuffer.svg",
        params: {
            logo: (await readFile(`${goldenDir}/logo.png`)).buffer,
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
            logo: (await readFile(`${goldenDir}/logo.png`)).buffer,
        },
    },
    {
        name: "PDF with logo",
        type: "pdf",
        filename: "qr_with_logo.pdf",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
    },
] as TestParams[]).forEach((testData) => {
    test(testData.name, async (t) => {
        const image = await getQRImage(text, {
            type: testData.type,
            ...defaultParams,
            ...testData.params,
        });
        await writeFile(`${generatedImageDir}/${testData.filename}`, image);
        await assertEqual(t, testData.type, testData.filename);
    });
});