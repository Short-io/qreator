import test from "ava";
import { readFile, writeFile } from "node:fs/promises";

import { getPNG } from "../png.js";
import { getSVG } from "../svg.js";
import { getPDF } from "../pdf.js";
import type { ImageOptions } from "../typing/types.js";
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
    fn: typeof getPNG | typeof getPDF | typeof getSVG;
    filename: string;
    params: ImageOptions;
}

([
    {
        name: "PNG",
        fn: getPNG,
        filename: "qr.png",
    },
    {
        name: "PNG with empty options",
        fn: getPNG,
        filename: "qr_with_empty_options.png",
        options: {},
    },
    {
        name: "PNG with undefined size",
        fn: getPNG,
        filename: "qr_with_undefined_size.png",
        options: {
            size: undefined,
        },
    },
    {
        name: "PNG with size",
        fn: getPNG,
        filename: "qr_with_size.png",
        params: {
            size: 9,
        }
    },
    {
        name: "PNG with margin",
        fn: getPNG,
        filename: "qr_with_margin.png",
        params: {
            size: 9,
            margin: 3,
        }
    },
    {
        name: "PNG with colors",
        fn: getPNG,
        filename: "qr_with_colors.png",
        params: {
            color: 0x0000a0ff,
            bgColor: 0xffa0ffff,
        },
    },
    {
        name: "PNG with logo",
        fn: getPNG,
        filename: "qr_with_logo.png",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
    },
    {
        name: "SVG",
        fn: getSVG,
        filename: "qr.svg",
    },
    {
        name: "SVG with EC level",
        fn: getSVG,
        filename: "qr_with_ec_level.svg",
        params: {
            ec_level: "H",
        },
    },
    {
        name: "SVG with size",
        fn: getSVG,
        filename: "qr_with_size.svg",
        params: {
            size: 6,
        },
    },
    {
        name: "SVG with colors",
        fn: getSVG,
        filename: "qr_with_colors.svg",
        params: {
            color: 0xff0000ff,
            bgColor: 0x00ff00ff,
        },
    },
    {
        name: "SVG with logo as buffer",
        fn: getSVG,
        filename: "qr_with_logo.svg",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
    },
    {
        name: "SVG with logo as arraybuffer",
        fn: getSVG,
        filename: "qr_with_logo_as_arraybuffer.svg",
        params: {
            logo: (await readFile(`${goldenDir}/logo.png`)).buffer,
        },
    },
    {
        name: "PDF",
        fn: getPDF,
        filename: "qr.pdf",
    },
    {
        name: "PDF with colors",
        fn: getPDF,
        filename: "qr_with_colors.pdf",
        params: { color: 0xff0000ff, bgColor: 0x00ff00ff },
    },
    {
        name: "PDF with arraybuffer",
        fn: getPDF,
        filename: "qr_logo_arraybuffer.pdf",
        params: {
            logo: (await readFile(`${goldenDir}/logo.png`)).buffer,
        },
    },
    {
        name: "PDF with logo",
        fn: getPDF,
        filename: "qr_with_logo.pdf",
        params: { logo: await readFile(`${goldenDir}/logo.png`) },
    },
] as TestParams[]).forEach((testData) => {
    test(testData.name, async (t) => {
        const image = await testData.fn(text, {
            ...defaultParams,
            ...testData.params,
        });
        await writeFile(`${generatedImageDir}/${testData.filename}`, image);
        await assertEqual(t, testData.filename);
    });
});
