#!/usr/bin/env node
const test = require('ava');
const looksSame = require('looks-same');
const pdflib = require('pdf-lib')


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
}, {
    name: 'EPS stream', type: 'eps', filename: 'qr.eps'
}].forEach((testData) => {
    test(testData.name, async t => {
        const image = await qr.image(text, { type: testData.type, ...defaultParams, ...testData.params });
        fs.writeFileSync(__dirname + '/' + testData.filename, image);
        t.assert(image.toString() === fs.readFileSync(__dirname + '/golden/' + testData.filename).toString(), testData.filename + ' is not equal to golden');
    });
});


test('write sync png', t => {
    fs.writeFileSync('qr_sync.png', qr.imageSync(text));
    t.pass();
});
