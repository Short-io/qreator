import { readFileSync } from "node:fs";
import Benchmark from "benchmark";
import { getPNG } from "../lib/png.js";
import { getSVG } from "../lib/svg.js";
import { getPDF } from "../lib/pdf.js";
const suite = new Benchmark.Suite("QR");
const logo = readFileSync(`tests/golden/logo.png`);
suite
    .add(
        "getPNG",
        async (deferred) => {
            await getPNG("https://example.com");
            deferred.resolve();
        },
        {
            defer: true,
        }
    )
    .add(
        "getPDF",
        async (deferred) => {
            await getPDF("https://example.com");
            deferred.resolve();
        },
        {
            defer: true,
        }
    )
    .add(
        "getSVG",
        async (deferred) => {
            await getSVG("https://example.com");
            deferred.resolve();
        },
        {
            defer: true,
        }
    )
    .add(
        "getPNG with logo",
        async (deferred) => {
            await getPNG("https://example.com", {
                logo,
            });
            deferred.resolve()
        },
        {
            defer: true,
        }
    )
    .add(
        "getPDF with logo",
        async (deferred) => {
            await getPDF("https://example.com", {
                logo,
            });
            deferred.resolve();
        },
        {
            defer: true,
        }
    )
    .add(
        "getSVG with logo",
        async (deferred) => {
            await getSVG("https://example.com", {
                logo,
            });
            deferred.resolve()
        },
        {
            defer: true,
        }
    )
    .on("cycle", function (event) {
        console.log(String(event.target));
    })
    .on("complete", function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        process.exit(0);
    })
    .run();
