import { PDFSerializer, pdfDict, pdfRef, pdfArray, pdfString, pdfName } from "./serialize.js";
import { svgPathToPdfOps } from "./svg-path.js";
import { parseJpeg } from "./jpeg-info.js";
import { decodePng } from "./png-decode.js";
import { widthOfTextAtSize, encodeWinAnsi } from "./helvetica-metrics.js";
import { deflate } from "./compress.js";

function n(v: number): string {
    return +v.toFixed(4) + "";
}

export class PDFWriter {
    private ops: string[] = [];
    private serializer = new PDFSerializer();
    private imageResources: { name: string; objNum: number }[] = [];
    private extGStates: Map<string, number> = new Map();
    private fontObjNum = 0;
    private hasFont = false;
    private pageWidth: number;
    private pageHeight: number;

    // Pre-allocate object numbers for the fixed structure
    private catalogNum: number;
    private pagesNum: number;
    private pageNum: number;
    private contentNum: number;

    constructor(width: number, height: number) {
        this.pageWidth = width;
        this.pageHeight = height;
        this.catalogNum = this.serializer.alloc(); // 1
        this.pagesNum = this.serializer.alloc();   // 2
        this.pageNum = this.serializer.alloc();     // 3
        this.contentNum = this.serializer.alloc();  // 4
    }

    getHeight(): number {
        return this.pageHeight;
    }

    drawRectangle(x: number, y: number, w: number, h: number, r: number, g: number, b: number): void {
        this.ops.push(`${n(r)} ${n(g)} ${n(b)} rg`);
        this.ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re`);
        this.ops.push("f");
    }

    drawSvgPath(
        svgPath: string,
        originX: number,
        originY: number,
        fillR: number, fillG: number, fillB: number,
        fillOpacity: number,
        evenOdd: boolean,
    ): void {
        this.ops.push("q");

        // Set fill and stroke colors
        this.ops.push(`${n(fillR)} ${n(fillG)} ${n(fillB)} rg`);
        this.ops.push(`${n(fillR)} ${n(fillG)} ${n(fillB)} RG`);

        // Apply opacity via ExtGState if needed
        if (fillOpacity < 1) {
            const gsName = this.getOrCreateExtGState(fillOpacity);
            this.ops.push(`/${gsName} gs`);
        }

        // Y-axis flip: CTM transforms SVG coords (Y-down) to PDF coords (Y-up)
        // [1, 0, 0, -1, originX, originY]
        this.ops.push(`1 0 0 -1 ${n(originX)} ${n(originY)} cm`);

        // Convert SVG path to PDF operators
        this.ops.push(svgPathToPdfOps(svgPath));

        // Fill and stroke with appropriate rule
        this.ops.push(evenOdd ? "B*" : "B");

        this.ops.push("Q");
    }

    async embedImage(data: Uint8Array): Promise<string> {
        const name = `Im${this.imageResources.length}`;
        const imgObjNum = this.serializer.alloc();

        const header = new Uint8Array(data.buffer, data.byteOffset, Math.min(4, data.length));
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;

        if (isPng) {
            const png = await decodePng(data);
            const compressedRgb = await deflate(png.rgb);

            let smaskObjNum: number | undefined;
            if (png.alpha) {
                smaskObjNum = this.serializer.alloc();
                const compressedAlpha = await deflate(png.alpha);
                this.serializer.set(
                    smaskObjNum,
                    pdfDict({
                        Type: pdfName("XObject"),
                        Subtype: pdfName("Image"),
                        Width: png.width,
                        Height: png.height,
                        ColorSpace: pdfName("DeviceGray"),
                        BitsPerComponent: 8,
                        Length: compressedAlpha.length,
                        Filter: pdfName("FlateDecode"),
                    }),
                );
                // Write the alpha smask as a raw pre-compressed stream
                this.serializer.setRaw(smaskObjNum, compressedAlpha);
            }

            this.serializer.set(
                imgObjNum,
                pdfDict({
                    Type: pdfName("XObject"),
                    Subtype: pdfName("Image"),
                    Width: png.width,
                    Height: png.height,
                    ColorSpace: pdfName("DeviceRGB"),
                    BitsPerComponent: 8,
                    Length: compressedRgb.length,
                    Filter: pdfName("FlateDecode"),
                    SMask: smaskObjNum !== undefined ? pdfRef(smaskObjNum) : undefined,
                }),
            );
            this.serializer.setRaw(imgObjNum, compressedRgb);
        } else {
            // JPEG
            const info = parseJpeg(data);
            this.serializer.set(
                imgObjNum,
                pdfDict({
                    Type: pdfName("XObject"),
                    Subtype: pdfName("Image"),
                    Width: info.width,
                    Height: info.height,
                    ColorSpace: pdfName(info.colorSpace),
                    BitsPerComponent: info.bitsPerComponent,
                    Length: data.length,
                    Filter: pdfName("DCTDecode"),
                }),
            );
            this.serializer.setRaw(imgObjNum, data);
        }

        this.imageResources.push({ name, objNum: imgObjNum });
        return name;
    }

    drawImage(name: string, x: number, y: number, width: number, height: number): void {
        this.ops.push("q");
        // Image CTM: scale and position. PDF images are 1x1 by default.
        this.ops.push(`${n(width)} 0 0 ${n(height)} ${n(x)} ${n(y)} cm`);
        this.ops.push(`/${name} Do`);
        this.ops.push("Q");
    }

    ensureFont(): void {
        if (!this.hasFont) {
            this.fontObjNum = this.serializer.alloc();
            this.hasFont = true;
        }
    }

    drawText(text: string, fontSize: number, x: number, y: number, r: number, g: number, b: number): void {
        this.ensureFont();
        const encoded = encodeWinAnsi(text);
        this.ops.push(`BT`);
        this.ops.push(`${n(r)} ${n(g)} ${n(b)} rg`);
        this.ops.push(`/F1 ${n(fontSize)} Tf`);
        this.ops.push(`${n(x)} ${n(y)} Td`);
        this.ops.push(`${pdfString(encoded)} Tj`);
        this.ops.push(`ET`);
    }

    measureText(text: string, fontSize: number): number {
        return widthOfTextAtSize(text, fontSize);
    }

    async save(): Promise<Uint8Array> {
        // Build content stream
        const contentBytes = new TextEncoder().encode(this.ops.join("\n"));

        // Content stream object (will be compressed by serializer)
        this.serializer.set(
            this.contentNum,
            `<< /Length __LENGTH____FILTER__ >>`,
            contentBytes,
        );

        // Build resource dictionary parts
        const xobjectEntries = this.imageResources
            .map(r => `/${r.name} ${pdfRef(r.objNum)}`)
            .join(" ");
        const xobjectDict = this.imageResources.length > 0 ? ` /XObject << ${xobjectEntries} >>` : "";

        const gsEntries = [...this.extGStates.entries()]
            .map(([name, num]) => `/${name} ${pdfRef(num)}`)
            .join(" ");
        const gsDict = this.extGStates.size > 0 ? ` /ExtGState << ${gsEntries} >>` : "";

        let fontDict = "";
        if (this.hasFont) {
            this.serializer.set(
                this.fontObjNum,
                pdfDict({
                    Type: pdfName("Font"),
                    Subtype: pdfName("Type1"),
                    BaseFont: pdfName("Helvetica"),
                    Encoding: pdfName("WinAnsiEncoding"),
                }),
            );
            fontDict = ` /Font << /F1 ${pdfRef(this.fontObjNum)} >>`;
        }

        const resourcesDict = `<< /ProcSet [/PDF /Text /ImageB /ImageC /ImageI]${fontDict}${xobjectDict}${gsDict} >>`;

        // Page
        this.serializer.set(
            this.pageNum,
            pdfDict({
                Type: pdfName("Page"),
                Parent: pdfRef(this.pagesNum),
                MediaBox: pdfArray([0, 0, n(this.pageWidth), n(this.pageHeight)]),
                Contents: pdfRef(this.contentNum),
                Resources: resourcesDict,
            }),
        );

        // Pages
        this.serializer.set(
            this.pagesNum,
            pdfDict({
                Type: pdfName("Pages"),
                Kids: pdfArray([pdfRef(this.pageNum)]),
                Count: 1,
            }),
        );

        // Catalog
        this.serializer.set(
            this.catalogNum,
            pdfDict({
                Type: pdfName("Catalog"),
                Pages: pdfRef(this.pagesNum),
            }),
        );

        return this.serializer.serialize();
    }

    private getOrCreateExtGState(opacity: number): string {
        const key = `GS${opacity.toFixed(4)}`;
        if (!this.extGStates.has(key)) {
            const num = this.serializer.alloc();
            this.serializer.set(
                num,
                pdfDict({
                    Type: pdfName("ExtGState"),
                    ca: n(opacity),  // fill opacity
                    CA: n(opacity),  // stroke opacity
                }),
            );
            this.extGStates.set(key, num);
        }
        return key;
    }
}
