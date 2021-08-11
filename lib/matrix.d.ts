import { Data, EcLevel, Matrix } from "./typing/types";
export declare function init(version: number): Matrix;
export declare function fillFinders(matrix: Matrix): void;
export declare function fillAlignAndTiming(matrix: Matrix): void;
export declare function fillStub(matrix: Matrix): void;
export declare const fillReserved: (matrix: Matrix, ec_level: EcLevel, mask: number) => void;
export declare const fillData: (matrix: Matrix, data: Data, mask: number) => void;
export declare function calculatePenalty(matrix: Matrix): number;
export declare function getMatrix(data: Data): number[][];
