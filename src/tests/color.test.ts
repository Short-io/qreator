import test from "ava";

import { colorToHex } from "../utils.js";
import { getSVG } from "../svg.js";
import { getPDF } from "../pdf.js";

const decoder = new TextDecoder();

const finderFill = (params: Parameters<typeof getSVG>[1]) => {
    const svg = decoder.decode(getSVG("https://example.com", params));
    const match = svg.match(/fill-rule="evenodd" fill="([^"]*)"/);
    if (!match) throw new Error("no finder path in SVG");
    return match[1];
};

test("colorToHex rejects an unparseable color string", (t) => {
    t.throws(() => colorToHex("ff0000"), { message: /Invalid color/ });
});

test("colorToHex keeps six digits for a fully opaque numeric color", (t) => {
    t.is(colorToHex(0xff0000ff), "#ff0000");
});

test("colorToHex appends the alpha byte of a translucent numeric color", (t) => {
    t.is(colorToHex(0xff000080), "#ff000080");
});

test("an unparseable finderColor never renders as an invisible NaN fill", (t) => {
    t.throws(() => finderFill({ finderColor: "hsl(0 100% 50%)" }), { message: /Invalid color/ });
});

test("a translucent numeric finderColor keeps its alpha in SVG", (t) => {
    t.is(finderFill({ finderColor: 0xff000080 }), "#ff000080");
});

test("PDF reports an unparseable finderColor as an invalid color", async (t) => {
    await t.throwsAsync(() => getPDF("https://example.com", { finderColor: "ff0000" }), {
        message: /Invalid color/,
    });
});
