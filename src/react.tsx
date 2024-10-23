import { useMemo } from "react";
import { getSVG } from "./svg.js";
import { ImageOptions } from "./typing/types.js";
const textDecoder = new TextDecoder();
export const QR = ({text, ...options}: ImageOptions & { text: string }) => {
    const svgBinary = useMemo(() => getSVG(text, options), [text, options]);
    return <div dangerouslySetInnerHTML={{ __html: textDecoder.decode(svgBinary) }} />
}