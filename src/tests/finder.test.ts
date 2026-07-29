import test from "ava";

import { getFinderInnerSVGPath, getFinderOuterSVGPath } from "../utils.js";
import type { BitMatrix } from "../typing/types.js";

const matrix = Array.from({ length: 21 }, () => new Array(21).fill(0)) as BitMatrix;
const SIZE = 9;
const MARGIN = 9;

// Callers reach these helpers with `borderRadius` unset (it has no default in ImageOptions).
// A non-finite radius used to leak into the path arithmetic and produce "M 9 NaN v NaN ...",
// which browsers discard entirely — the finders rendered empty.
const omitted = undefined as unknown as number;

test("outer finder path has no NaN coordinates when borderRadius is omitted", (t) => {
    t.false(getFinderOuterSVGPath(matrix, SIZE, MARGIN, omitted, "rounded").includes("NaN"));
});

test("inner finder path has no NaN coordinates when borderRadius is omitted", (t) => {
    t.false(getFinderInnerSVGPath(matrix, SIZE, MARGIN, omitted, "rounded").includes("NaN"));
});

test("omitting borderRadius draws the same finders as borderRadius 0", (t) => {
    t.is(
        getFinderOuterSVGPath(matrix, SIZE, MARGIN, omitted, "rounded"),
        getFinderOuterSVGPath(matrix, SIZE, MARGIN, 0, "rounded")
    );
    t.is(
        getFinderInnerSVGPath(matrix, SIZE, MARGIN, omitted, "rounded"),
        getFinderInnerSVGPath(matrix, SIZE, MARGIN, 0, "rounded")
    );
});

test("a NaN borderRadius does not poison the finder path", (t) => {
    t.false(getFinderOuterSVGPath(matrix, SIZE, MARGIN, NaN, "rounded").includes("NaN"));
    t.false(getFinderInnerSVGPath(matrix, SIZE, MARGIN, NaN, "rounded").includes("NaN"));
});
