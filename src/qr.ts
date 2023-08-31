import { ImageOptions } from "./typing/types";
export type QRImageOptions = Omit<ImageOptions, "type"> & Required<Pick<ImageOptions, "type">>;
