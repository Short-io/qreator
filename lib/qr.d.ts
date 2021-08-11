/// <reference types="node" />
import { ImageOptions } from "./typing/types";
export declare function getQRImage(text: string, options: ImageOptions): Promise<Uint8Array | Buffer>;
