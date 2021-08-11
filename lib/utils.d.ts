/// <reference types="node" />
import { ImageOptions, ImageType } from "./typing/types";
export declare function getOptions(inOptions: ImageOptions): {
    ec_level?: import("./typing/types").EcLevel;
    type?: ImageType;
    size?: number;
    margin?: number;
    parse_url?: boolean;
    logo?: Buffer;
    logoWidth?: number;
    logoHeight?: number;
    color?: number;
    bgColor?: number;
};
