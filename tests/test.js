#!/usr/bin/env node
import test from "ava";
import looksSame from "looks-same";
import { promisify } from "util";
import { fileURLToPath } from "url"
import path from "path";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { readFileSync, writeFileSync } from "fs";

import { getQRImage } from "../lib/qr.js";

const text = "I \u2764\uFE0F QR code!";
// const text = 'https://yadi.sk/d/FuzPeEg-QyaZN?qr';

const assertEqual = async (t, type, filename) => {
    if (type === "png") {
        const lsRes = await looksSame(
            `${__dirname}/${filename}`,
            `${__dirname}/golden/${filename}`,
            { strict: true }
        );
        t.assert(lsRes.equal);
    } else if (type !== "pdf") {
        t.assert(
            readFileSync(`${__dirname}/${filename}`).toString() ===
                readFileSync(`${__dirname}/golden/${filename}`).toString(),
            `${filename} is not equal to golden`
        );
    } else {
        t.pass();
    }
};

const defaultParams = {
    ec_level: "Q",
    margin: 1,
    parse_url: true,
};

[
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
        params: { logo: readFileSync(`${__dirname}/golden/logo.png`) },
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
        params: { logo: readFileSync(`${__dirname}/golden/logo.png`) },
    },
    {
        name: "SVG with logo as arraybuffer",
        type: "svg",
        filename: "qr_with_logo_as_arraybuffer.svg",
        params: {
            logo: readFileSync(`${__dirname}/golden/logo.png`).buffer,
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
            logo: readFileSync(`${__dirname}/golden/logo.png`).buffer,
        },
    },
    {
        name: "PDF with logo",
        type: "pdf",
        filename: "qr_with_logo.pdf",
        params: { logo: readFileSync(`${__dirname}/golden/logo.png`) },
    },
].forEach((testData) => {
    test(testData.name, async (t) => {
        const image = await getQRImage(text, {
            type: testData.type,
            ...defaultParams,
            ...testData.params,
        });
        writeFileSync(`${__dirname}/${testData.filename}`, image);
        await assertEqual(t, testData.type, testData.filename);
    });
});
