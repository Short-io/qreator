import { ExecutionContext } from "ava";
import looksSame from "looks-same";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as diff from "diff";
import XMLFormatter from "xml-formatter";
import chalk from "chalk";
chalk.level = 3;

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const goldenDir = `${__dirname}/../../test_data/golden`;
export const generatedImageDir = `${__dirname}/../../test_data/generated`;

export const assertEqual = async (t: ExecutionContext<unknown>, filename: string) => {
    if (filename.endsWith(".png")) {
        const lsRes = await looksSame(
            `${generatedImageDir}/${filename}`,
            `${goldenDir}/${filename}`,
            { strict: true }
        );
        t.assert(lsRes.equal);
    } else if (!filename.endsWith("pdf")) {
        const f1 = (await readFile(`${generatedImageDir}/${filename}`)).toString();
        const f2 = (await readFile(`${goldenDir}/${filename}`)).toString();
        if (f1 !== f2) {
            for (const el of diff.diffLines(XMLFormatter(f1), XMLFormatter(f2), { newlineIsToken: true })) {
                console.log(el.added ? chalk.bold.green(el.value) : chalk.bold.red(el.value));
            };
            t.fail();
        } else {
            t.pass();
        }
    } else {
        t.pass();
    }
};
