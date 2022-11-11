import { ExecutionContext } from "ava";
import looksSame from "looks-same";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const goldenDir = `${__dirname}/../../test_data/golden`;
export const generatedImageDir = `${__dirname}/../../test_data/generated`;

export const assertEqual = async (t: ExecutionContext<unknown>, type: string, filename: string) => {
    if (type === "png") {
        const lsRes = await looksSame(
            `${generatedImageDir}/${filename}`,
            `${goldenDir}/${filename}`,
            { strict: true }
        );
        t.assert(lsRes.equal);
    } else if (type !== "pdf") {
        t.assert(
            (await readFile(`${generatedImageDir}/${filename}`)).toString() ===
                (await readFile(`${goldenDir}/${filename}`)).toString(),
            `${filename} is not equal to golden`
        );
    } else {
        t.pass();
    }
};
