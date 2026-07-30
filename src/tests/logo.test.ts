import test from "ava";
import { readFileSync } from "node:fs";

import { getSVG } from "../svg.js";
import type { ImageOptions } from "../typing/types.js";
import { goldenDir, toArrayBuffer } from "./_common.js";

const decoder = new TextDecoder();

const logoFile = readFileSync(`${goldenDir}/logo_45deg.png`);
const logoBytes = new Uint8Array(logoFile);

const sameBytes = (actual: Uint8Array, expected: Uint8Array) => {
    if (actual.byteLength !== expected.byteLength) return false;
    for (let index = 0; index < actual.byteLength; index++) {
        if (actual[index] !== expected[index]) return false;
    }

    return true;
};

// The runtime accepts a typed array as well as an ArrayBuffer, even though the declared
// `logo` type only covers the latter.
const embeddedLogo = (logo: ArrayBufferView | ArrayBufferLike) => {
    const logoOption = logo as ImageOptions["logo"];
    const svg = decoder.decode(getSVG("https://example.com", { logo: logoOption, logoWidth: 20, logoHeight: 20 }));
    const match = svg.match(/base64,([^"]*)"/);
    if (!match) throw new Error("no logo embedded in SVG");
    return new Uint8Array(Buffer.from(match[1], "base64"));
};

// Mimic a Buffer sitting inside a larger shared allocation, as `readFileSync` may return.
const viewIntoLargerAllocation = () => {
    const backing = new Uint8Array(logoBytes.byteLength + 4096);
    backing.set(logoBytes, 0);
    backing.fill(0xff, logoBytes.byteLength);
    return new Uint8Array(backing.buffer, 0, logoBytes.byteLength);
};

test("a logo passed as a Buffer is embedded byte for byte", (t) => {
    t.true(sameBytes(embeddedLogo(logoFile), logoBytes));
});

test("a logo passed as an ArrayBuffer is embedded byte for byte", (t) => {
    t.true(sameBytes(embeddedLogo(toArrayBuffer(logoFile)), logoBytes));
});

test("toArrayBuffer copies only the bytes the view owns", (t) => {
    const view = viewIntoLargerAllocation();
    t.is(toArrayBuffer(view).byteLength, logoBytes.byteLength);
    t.true(sameBytes(new Uint8Array(toArrayBuffer(view)), logoBytes));
});

test("the whole backing allocation would be embedded without the slice", (t) => {
    const view = viewIntoLargerAllocation();
    // This is the shape of the bug: `.buffer` ignores the view's bounds.
    t.is(embeddedLogo(view.buffer).byteLength, logoBytes.byteLength + 4096);
    t.is(embeddedLogo(toArrayBuffer(view)).byteLength, logoBytes.byteLength);
});
