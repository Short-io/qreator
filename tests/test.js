#!/usr/bin/env node
const test = require('ava');
const looksSame = require('looks-same');
const pdflib = require('pdf-lib');
const { promisify } = require('util');

const looksSamePromise = promisify(looksSame);

var fs = require('fs');

var qr = require('./../');
const text = 'I \u2764\uFE0F QR code!';
//const text = 'https://yadi.sk/d/FuzPeEg-QyaZN?qr';

const assertEqual = async (t, type, filename) => {
    if (type === 'png') {
        const lsRes = await looksSamePromise(__dirname + '/' + filename,  __dirname + '/golden/' + filename, {strict: true});
        t.assert(lsRes.equal);
    } else if (type != 'pdf') {
        t.assert(fs.readFileSync(__dirname + '/' + filename).toString() === fs.readFileSync(__dirname + '/golden/' + filename).toString(), filename + ' is not equal to golden');
    } else {
        t.pass();
    }
}

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
    name: 'SVG with logo as buffer', type: 'svg', filename: 'qr_with_logo.svg', 
    params: {logo: fs.readFileSync(__dirname + '/golden/logo.png')}
}, {
    name: 'SVG with logo as string', type: 'svg', filename: 'qr_with_logo_as_string.svg', 
    params: {logo: fs.readFileSync(__dirname + '/golden/logo.png').buffer}
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
        await assertEqual(t, testData.type, testData.filename);
    });
});
