/// <reference types="node" />
import { ImageOptions } from "./typing/types";
export declare function getQRImage(text: string, options: Omit<ImageOptions, "type"> & Required<Pick<ImageOptions, "type">>): Promise<Uint8Array | Buffer>;
