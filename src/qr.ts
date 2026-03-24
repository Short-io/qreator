import { ImageOptions } from "./typing/types.js";
export type QRImageOptions = Omit<ImageOptions, "type"> & Required<Pick<ImageOptions, "type">>;
