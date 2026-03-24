export interface JpegInfo {
    width: number;
    height: number;
    colorSpace: "DeviceGray" | "DeviceRGB" | "DeviceCMYK";
    bitsPerComponent: number;
}

const SOF_MARKERS = [
    0xffc0, 0xffc1, 0xffc2, 0xffc3, 0xffc5, 0xffc6,
    0xffc7, 0xffc8, 0xffc9, 0xffca, 0xffcb, 0xffcc,
    0xffcd, 0xffce, 0xffcf,
];

const CHANNEL_TO_COLOR_SPACE: Record<number, JpegInfo["colorSpace"]> = {
    1: "DeviceGray",
    3: "DeviceRGB",
    4: "DeviceCMYK",
};

export function parseJpeg(data: Uint8Array): JpegInfo {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (view.getUint16(0) !== 0xffd8) throw new Error("SOI not found in JPEG");

    let pos = 2;
    let marker = 0;
    while (pos < view.byteLength) {
        marker = view.getUint16(pos);
        pos += 2;
        if (SOF_MARKERS.includes(marker)) break;
        pos += view.getUint16(pos);
    }

    if (!SOF_MARKERS.includes(marker)) throw new Error("Invalid JPEG");
    pos += 2; // skip segment length

    const bitsPerComponent = view.getUint8(pos++);
    const height = view.getUint16(pos); pos += 2;
    const width = view.getUint16(pos); pos += 2;
    const channels = view.getUint8(pos);

    const colorSpace = CHANNEL_TO_COLOR_SPACE[channels];
    if (!colorSpace) throw new Error("Unknown JPEG channel count: " + channels);

    return { width, height, colorSpace, bitsPerComponent };
}
