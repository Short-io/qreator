/// <reference types="node" />
export declare type Matrix = number[][];
export interface Data {
    blocks: number[][];
    ec: number[][];
    ec_len: number;
    ec_level: EcLevel;
    version: number;
    data_len: number;
}
export interface NumberData {
    [key: string]: number[];
}
export declare type EcLevel = "L" | "M" | "Q" | "H";
export declare type ImageType = "png" | "svg" | "pdf";
export interface ImageOptions {
    ec_level?: EcLevel;
    type?: ImageType;
    size?: number;
    margin?: number;
    parse_url?: boolean;
    logo?: Buffer;
    logoWidth?: number;
    logoHeight?: number;
    color?: number;
    bgColor?: number;
}
