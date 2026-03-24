import { deflate } from "./compress.js";

const HEADER = "%PDF-1.4\n%\xff\xff\xff\xff\n";
const enc = new TextEncoder();

interface PdfObj {
    dict: string;
    stream?: Uint8Array;
    rawStream?: Uint8Array;  // pre-compressed or pass-through stream
}

export class PDFSerializer {
    private objects = new Map<number, PdfObj>();
    private nextNum = 1;

    alloc(): number {
        return this.nextNum++;
    }

    set(num: number, dict: string, stream?: Uint8Array): void {
        this.objects.set(num, { dict, stream });
    }

    /** Set raw (pre-compressed) stream data. Dict must already be set via set(). */
    setRaw(num: number, rawStream: Uint8Array): void {
        const obj = this.objects.get(num);
        if (obj) obj.rawStream = rawStream;
    }

    async serialize(): Promise<Uint8Array> {
        const parts: Uint8Array[] = [];
        const offsets = new Map<number, number>();
        let pos = 0;

        const write = (data: Uint8Array) => { parts.push(data); pos += data.length; };
        const writeStr = (s: string) => write(enc.encode(s));

        writeStr(HEADER);

        // Write objects in order
        const sortedNums = [...this.objects.keys()].sort((a, b) => a - b);
        for (const num of sortedNums) {
            offsets.set(num, pos);
            const obj = this.objects.get(num)!;
            if (obj.rawStream) {
                // Pre-compressed or pass-through stream (images)
                writeStr(`${num} 0 obj\n${obj.dict}\nstream\n`);
                write(obj.rawStream);
                writeStr("\nendstream\nendobj\n");
            } else if (obj.stream) {
                const compressed = await deflate(obj.stream);
                writeStr(`${num} 0 obj\n`);
                writeStr(`${obj.dict.replace("__LENGTH__", String(compressed.length)).replace("__FILTER__", " /Filter /FlateDecode")}\n`);
                writeStr("stream\n");
                write(compressed);
                writeStr("\nendstream\n");
                writeStr("endobj\n");
            } else {
                writeStr(`${num} 0 obj\n${obj.dict}\nendobj\n`);
            }
        }

        // Cross-reference table
        const xrefOffset = pos;
        const maxNum = sortedNums[sortedNums.length - 1];
        writeStr(`xref\n0 ${maxNum + 1}\n`);
        writeStr("0000000000 65535 f \n");
        for (let i = 1; i <= maxNum; i++) {
            const off = offsets.get(i) ?? 0;
            writeStr(`${String(off).padStart(10, "0")} 00000 n \n`);
        }

        // Trailer
        writeStr(`trailer\n<< /Size ${maxNum + 1} /Root 1 0 R >>\n`);
        writeStr(`startxref\n${xrefOffset}\n%%EOF\n`);

        // Concatenate all parts
        const totalLength = parts.reduce((s, p) => s + p.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }
}

// PDF value formatting helpers
export function pdfName(name: string): string { return `/${name}`; }
export function pdfRef(num: number): string { return `${num} 0 R`; }
export function pdfArray(items: (string | number)[]): string { return `[${items.join(" ")}]`; }
export function pdfString(bytes: Uint8Array): string {
    // Escape special characters in PDF string
    const escaped: string[] = ["("];
    for (const b of bytes) {
        if (b === 0x28) escaped.push("\\(");       // (
        else if (b === 0x29) escaped.push("\\)");   // )
        else if (b === 0x5c) escaped.push("\\\\");  // backslash
        else escaped.push(String.fromCharCode(b));
    }
    escaped.push(")");
    return escaped.join("");
}

export function pdfDict(entries: Record<string, string | number | undefined>): string {
    const parts: string[] = ["<<"];
    for (const [key, val] of Object.entries(entries)) {
        if (val === undefined) continue;
        parts.push(` /${key} ${val}`);
    }
    parts.push(" >>");
    return parts.join("");
}
