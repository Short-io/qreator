import test from "ava";
import { readFileSync } from "fs";
import { writeFile } from "node:fs/promises";
import { ImageType } from '../typing/types.js';
import { QRImageOptions } from '../qr.js';
import { JSDOM } from 'jsdom';
import { assertEqual, generatedImageDir, goldenDir } from "./_common.js";
import svgParser from 'svg-path-parser';
  

class Path2D {
    path: string;
    constructor(d: string | Path2D) {
      this.path = d instanceof Path2D ? d.path : d
    }
    async draw(context: CanvasRenderingContext2D, type = 'fill') {
      const commands = svgParser.parseSVG(this.path);
      let lastX = 0;
      let lastY = 0;
      for (const command of commands) {
        if (command.code === 'M') {
            context.moveTo(command.x, command.y);
            lastX = command.x;
            lastY = command.y;
        } else if (command.code === "L") {
            context.lineTo(command.x, command.y);
            lastX = command.x;
            lastY = command.y;
        } else if (command.code === "A") {
            context.arcTo(lastX, lastY, command.x, command.y, Math.abs(lastX-command.x));
            lastX = command.x;
            lastY = command.y;
        } else if (command.command === "closepath") {
            context.closePath();
        } else {
            throw new Error(`Unknown command ${command.code}`);
        }
      }
    }
}
let functions: Record<ImageType, (text: string, options: QRImageOptions) => Promise<ArrayBuffer>>;
const { window } = new JSDOM(``, { runScripts: "dangerously", resources: "usable" });

test.before(async () => {
    window.globalThis.TextEncoder = TextEncoder;
    window.globalThis.TextDecoder = TextDecoder;
    window.globalThis.Path2D = Path2D;

    for (const scriptType of ['png', 'svg', 'pdf']) {
        const scriptEl = window.document.createElement('script')
        scriptEl.textContent = readFileSync(`./lib/browser/${scriptType}.umd.js`).toString()
        scriptEl.type = 'text/javascript'
        window.document.body.appendChild(scriptEl);
    }
    functions = {
        "png": window.globalThis.pngQrCode.getPNG,
        "svg": window.globalThis.svgQrCode.getSVG,
        "pdf": window.globalThis.pdfQrCode.getPDF,
    };
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

([
    {
        name: "PNG",
        type: "png",
        filename: "qr.png",

    },
    {
        name: "PNG with border radius",
        type: "png",
        filename: "qr_with_border_radius.png",
        params: {
            borderRadius: 3,
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
        name: "PNG with colors (hex)",
        type: "png",
        filename: "qr_with_colors.png",
        params: {
            color: '#0000a0',
            bgColor: '#ffa0ff',
        },
    },
    {
        name: "PNG with logo (PNG)",
        type: "png",
        filename: "qr_with_logo.png",
        params: { logo: readFileSync(`${goldenDir}/logo.png`).buffer },
    },
    {
        name: "PNG with logo (JPG)",
        type: "png",
        filename: "qr_with_logo_jpg.png",
        params: { logo: readFileSync(`${goldenDir}/logo.jpg`).buffer },
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
        name: "SVG with border radius",
        type: "svg",
        filename: "qr_with_border_radius.svg",
        params: {
            borderRadius: 2,
        }
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
        filename: "qr_with_colors_hex.svg",
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
        name: "SVG with logo as arraybuffer (PNG)",
        type: "svg",
        filename: "qr_with_logo_as_arraybuffer.svg",
        params: {
            logo: readFileSync(`${goldenDir}/logo.png`).buffer,
        },
    },
    {
        name: "SVG with logo as arraybuffer (JPG)",
        type: "svg",
        filename: "qr_with_logo_as_arraybuffer_jpg.svg",
        params: {
            logo: readFileSync(`${goldenDir}/logo.jpg`).buffer,
        },
    },
    {
        name: "PDF",
        type: "pdf",
        filename: "qr.pdf",
    },
    {
        name: "PDF with border radius",
        type: "pdf",
        filename: "qr_with_border_radius.pdf",
        params: {
            borderRadius: 2,
        }
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
            logo: new window.Uint8Array(readFileSync(`${goldenDir}/logo.png`).buffer),
        },
    },
    {
        name: "PDF with arraybuffer (JPG)",
        type: "pdf",
        filename: "qr_logo_arraybuffer.pdf",
        params: {
            logo: new window.Uint8Array(readFileSync(`${goldenDir}/logo.jpg`).buffer),
        },
    },
] as TestParams[]) .forEach((testData) => {
    test(`browser > ${testData.name}`, async (t) => {
        const image = await functions[testData.type](text, {
            type: testData.type,
            ...defaultParams,
            ...testData.params,
        });
        await writeFile(`${generatedImageDir}/browser_${testData.filename}`, new Uint8Array(image));
        await assertEqual(t, 'browser_' + testData.filename);
    });
});
