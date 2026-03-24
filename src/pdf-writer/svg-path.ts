// SVG path to PDF path operator converter.
// Ported from pdf-lib's svgPath.ts (originated from pdfkit, MIT license).

const PARAM_COUNT: Record<string, number> = {
    A:7,a:7,C:6,c:6,H:1,h:1,L:2,l:2,M:2,m:2,Q:4,q:4,S:4,s:4,T:2,t:2,V:1,v:1,Z:0,z:0,
};

interface Cmd { cmd?: string; args: number[] }

function parse(path: string): Cmd[] {
    let cmd: string | undefined;
    const ret: Cmd[] = [];
    let args: number[] = [];
    let curArg = "";
    let foundDecimal = false;
    let params = 0;

    for (const c of path) {
        if (c in PARAM_COUNT) {
            params = PARAM_COUNT[c];
            if (cmd) {
                if (curArg.length > 0) args.push(+curArg);
                ret.push({ cmd, args });
                args = [];
                curArg = "";
                foundDecimal = false;
            }
            cmd = c;
        } else if (
            c === " " || c === "," ||
            (c === "-" && curArg.length > 0 && curArg[curArg.length - 1] !== "e") ||
            (c === "." && foundDecimal)
        ) {
            if (curArg.length === 0) continue;
            if (args.length === params) {
                ret.push({ cmd, args });
                args = [+curArg];
                if (cmd === "M") cmd = "L";
                if (cmd === "m") cmd = "l";
            } else {
                args.push(+curArg);
            }
            foundDecimal = c === ".";
            curArg = c === "-" || c === "." ? c : "";
        } else {
            curArg += c;
            if (c === ".") foundDecimal = true;
        }
    }

    if (curArg.length > 0) {
        if (args.length === params) {
            ret.push({ cmd, args });
            args = [+curArg];
            if (cmd === "M") cmd = "L";
            if (cmd === "m") cmd = "l";
        } else {
            args.push(+curArg);
        }
    }
    ret.push({ cmd, args });
    return ret;
}

// Formatting helper: round to avoid floating point noise
function n(v: number): string {
    return +v.toFixed(4) + "";
}

export function svgPathToPdfOps(path: string): string {
    let cx = 0, cy = 0;
    let px: number | null = 0, py: number | null = 0;
    let sx = 0, sy = 0;
    const ops: string[] = [];

    const commands = parse(path);
    for (const { cmd, args: a } of commands) {
        if (!cmd) continue;
        switch (cmd) {
            case "M":
                cx = a[0]; cy = a[1]; px = py = null; sx = cx; sy = cy;
                ops.push(`${n(cx)} ${n(cy)} m`);
                break;
            case "m":
                cx += a[0]; cy += a[1]; px = py = null; sx = cx; sy = cy;
                ops.push(`${n(cx)} ${n(cy)} m`);
                break;
            case "L":
                cx = a[0]; cy = a[1]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "l":
                cx += a[0]; cy += a[1]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "H":
                cx = a[0]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "h":
                cx += a[0]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "V":
                cy = a[0]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "v":
                cy += a[0]; px = py = null;
                ops.push(`${n(cx)} ${n(cy)} l`);
                break;
            case "C":
                px = a[2]; py = a[3]; cx = a[4]; cy = a[5];
                ops.push(`${n(a[0])} ${n(a[1])} ${n(a[2])} ${n(a[3])} ${n(a[4])} ${n(a[5])} c`);
                break;
            case "c": {
                const x1 = a[0]+cx, y1 = a[1]+cy, x2 = a[2]+cx, y2 = a[3]+cy, x3 = a[4]+cx, y3 = a[5]+cy;
                ops.push(`${n(x1)} ${n(y1)} ${n(x2)} ${n(y2)} ${n(x3)} ${n(y3)} c`);
                px = x2; py = y2; cx = x3; cy = y3;
                break;
            }
            case "S": {
                const cpx = px === null ? cx : cx - (px - cx);
                const cpy = py === null ? cy : cy - (py - cy);
                ops.push(`${n(cpx)} ${n(cpy)} ${n(a[0])} ${n(a[1])} ${n(a[2])} ${n(a[3])} c`);
                px = a[0]; py = a[1]; cx = a[2]; cy = a[3];
                break;
            }
            case "s": {
                const cpx = px === null ? cx : cx - (px - cx);
                const cpy = py === null ? cy : cy - (py - cy);
                ops.push(`${n(cpx)} ${n(cpy)} ${n(cx+a[0])} ${n(cy+a[1])} ${n(cx+a[2])} ${n(cy+a[3])} c`);
                px = cx+a[0]; py = cy+a[1]; cx += a[2]; cy += a[3];
                break;
            }
            case "Q": {
                // Convert quadratic to cubic bezier
                const qx = a[0], qy = a[1], ex = a[2], ey = a[3];
                ops.push(`${n(cx + 2/3*(qx-cx))} ${n(cy + 2/3*(qy-cy))} ${n(ex + 2/3*(qx-ex))} ${n(ey + 2/3*(qy-ey))} ${n(ex)} ${n(ey)} c`);
                px = qx; py = qy; cx = ex; cy = ey;
                break;
            }
            case "q": {
                const qx = cx+a[0], qy = cy+a[1], ex = cx+a[2], ey = cy+a[3];
                ops.push(`${n(cx + 2/3*(qx-cx))} ${n(cy + 2/3*(qy-cy))} ${n(ex + 2/3*(qx-ex))} ${n(ey + 2/3*(qy-ey))} ${n(ex)} ${n(ey)} c`);
                px = qx; py = qy; cx = ex; cy = ey;
                break;
            }
            case "T": {
                px = px === null ? cx : cx - (px - cx);
                py = py === null ? cy : cy - (py - cy);
                const ex = a[0], ey = a[1];
                ops.push(`${n(cx + 2/3*(px-cx))} ${n(cy + 2/3*(py-cy))} ${n(ex + 2/3*(px-ex))} ${n(ey + 2/3*(py-ey))} ${n(ex)} ${n(ey)} c`);
                cx = ex; cy = ey;
                break;
            }
            case "t": {
                px = px === null ? cx : cx - (px - cx);
                py = py === null ? cy : cy - (py - cy);
                const ex = cx+a[0], ey = cy+a[1];
                ops.push(`${n(cx + 2/3*(px-cx))} ${n(cy + 2/3*(py-cy))} ${n(ex + 2/3*(px-ex))} ${n(ey + 2/3*(py-ey))} ${n(ex)} ${n(ey)} c`);
                cx = ex; cy = ey;
                break;
            }
            case "A": {
                const beziers = solveArc(cx, cy, a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
                for (const b of beziers) ops.push(`${n(b[0])} ${n(b[1])} ${n(b[2])} ${n(b[3])} ${n(b[4])} ${n(b[5])} c`);
                cx = a[5]; cy = a[6];
                break;
            }
            case "a": {
                const ex = a[5]+cx, ey = a[6]+cy;
                const beziers = solveArc(cx, cy, a[0], a[1], a[2], a[3], a[4], ex, ey);
                for (const b of beziers) ops.push(`${n(b[0])} ${n(b[1])} ${n(b[2])} ${n(b[3])} ${n(b[4])} ${n(b[5])} c`);
                cx = ex; cy = ey;
                break;
            }
            case "Z": case "z":
                ops.push("h");
                cx = sx; cy = sy;
                break;
        }
    }
    return ops.join("\n");
}

// Arc to cubic bezier conversion (from Inkscape svgtopdf via pdfkit)
type Segment = [number, number, number, number, number, number, number, number];
type Bezier = [number, number, number, number, number, number];

function solveArc(ox: number, oy: number, rx: number, ry: number, rot: number, large: number, sweep: number, ex: number, ey: number): Bezier[] {
    const segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, ox, oy);
    return segs.map(seg => segmentToBezier(...seg));
}

function arcToSegments(
    x: number, y: number, rx: number, ry: number,
    large: number, sweep: number, rotateX: number,
    ox: number, oy: number,
): Segment[] {
    const th = rotateX * (Math.PI / 180);
    const sinTh = Math.sin(th);
    const cosTh = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);

    const px = cosTh * (ox - x) * 0.5 + sinTh * (oy - y) * 0.5;
    const py = cosTh * (oy - y) * 0.5 - sinTh * (ox - x) * 0.5;
    let pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
    if (pl > 1) {
        pl = Math.sqrt(pl);
        rx *= pl;
        ry *= pl;
    }

    const a00 = cosTh / rx, a01 = sinTh / rx;
    const a10 = -sinTh / ry, a11 = cosTh / ry;
    const x0 = a00 * ox + a01 * oy;
    const y0 = a10 * ox + a11 * oy;
    const x1 = a00 * x + a01 * y;
    const y1 = a10 * x + a11 * y;

    const d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
    let sfactorSq = 1 / d - 0.25;
    if (sfactorSq < 0) sfactorSq = 0;
    let sfactor = Math.sqrt(sfactorSq);
    if (sweep === large) sfactor = -sfactor;

    const xc = 0.5 * (x0 + x1) - sfactor * (y1 - y0);
    const yc = 0.5 * (y0 + y1) + sfactor * (x1 - x0);
    const th0 = Math.atan2(y0 - yc, x0 - xc);
    const th1 = Math.atan2(y1 - yc, x1 - xc);

    let thArc = th1 - th0;
    if (thArc < 0 && sweep === 1) thArc += 2 * Math.PI;
    else if (thArc > 0 && sweep === 0) thArc -= 2 * Math.PI;

    const segments = Math.ceil(Math.abs(thArc / (Math.PI * 0.5 + 0.001)));
    const result: Segment[] = [];
    for (let i = 0; i < segments; i++) {
        const th2 = th0 + (i * thArc) / segments;
        const th3 = th0 + ((i + 1) * thArc) / segments;
        result.push([xc, yc, th2, th3, rx, ry, sinTh, cosTh]);
    }
    return result;
}

function segmentToBezier(
    cx1: number, cy1: number, th0: number, th1: number,
    rx: number, ry: number, sinTh: number, cosTh: number,
): Bezier {
    const a00 = cosTh * rx, a01 = -sinTh * ry;
    const a10 = sinTh * rx, a11 = cosTh * ry;

    const thHalf = 0.5 * (th1 - th0);
    const t = (8 / 3) * Math.sin(thHalf * 0.5) * Math.sin(thHalf * 0.5) / Math.sin(thHalf);
    const x1 = cx1 + Math.cos(th0) - t * Math.sin(th0);
    const y1 = cy1 + Math.sin(th0) + t * Math.cos(th0);
    const x3 = cx1 + Math.cos(th1);
    const y3 = cy1 + Math.sin(th1);
    const x2 = x3 + t * Math.sin(th1);
    const y2 = y3 - t * Math.cos(th1);

    return [
        a00 * x1 + a01 * y1, a10 * x1 + a11 * y1,
        a00 * x2 + a01 * y2, a10 * x2 + a11 * y2,
        a00 * x3 + a01 * y3, a10 * x3 + a11 * y3,
    ];
}
