import { Data, EcLevel, NumberData } from "./typing/types";
export declare function getTemplate(message: NumberData, ec_level: EcLevel): any;
export declare function fillTemplate(message: NumberData, template: Data): Data;
export declare function QR(text: string, ec_level: EcLevel, parse_url: boolean): number[][];
