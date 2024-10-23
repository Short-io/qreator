import React from "react"
import { renderToString } from "react-dom/server";
import { QR } from "../react.js";
import test from "ava";

test("react renders", (t) => {
    const element = renderToString(React.createElement(QR, { text: "https://example.com" }))
    t.regex(element, /<svg/)
})