#!/usr/bin/env node
const test = require('ava');
const looksSame = require('looks-same');
const pdflib = require('pdf-lib');

var fs = require('fs');
function file(name) {
    return fs.createWriteStream(__dirname + '/' + name);
}

var qr = require('./../');
const text = 'I \u2764\uFE0F QR code!';
//const text = 'https://yadi.sk/d/FuzPeEg-QyaZN?qr';

const defaultParams = {
    ec_level: 'Q',
    margin: 1,
    parse_url: true,
};

[{
    name: 'PNG', type: 'png', filename: 'qr.png',
}, {
    name: 'PNG with logo', type: 'png', filename: 'qr_with_logo.png',
},{
    name: 'SVG', type: 'svg', filename: 'qr.svg', 
}, {
    name: 'SVG with logo', type: 'svg', filename: 'qr_with_logo.svg', 
    params: {logo: fs.readFileSync(__dirname + '/golden/logo.png')}
}, {
    name: 'PDF without pdfkit', type: 'pdf', filename: 'qr.pdf',
},{
    name: 'PDF with pdfkit', type: 'pdf', filename: 'qr_pdfkit.pdf',
    params: {pdflib}
}, {
    name: 'PDF with logo', type: 'pdf', filename: 'qr_with_logo.pdf',
    params: {logo: fs.readFileSync(__dirname + '/golden/logo.png'), pdflib}
}].forEach((testData) => {
    test(testData.name, async t => {
        const image = await qr.image(text, { type: testData.type, ...defaultParams, ...testData.params });
        fs.writeFileSync(__dirname + '/' + testData.filename, image);
        if (testData.type != 'pdf') {
            t.assert(fs.readFileSync(__dirname + '/' + testData.filename).toString() === fs.readFileSync(__dirname + '/golden/' + testData.filename).toString(), testData.filename + ' is not equal to golden');
        } else {
            t.pass();
        }
    });
});
