#!/usr/bin/env node
const test = require('ava');
const looksSame = require('looks-same');


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
}

test.cb('write PNG stream without parse URL', t => {
    const image = qr.image(text, { type: 'png', ...defaultParams, parse_url: false, margin: 1 });
    image.on('end', t.end);
    image.pipe(file('qr_f.png'));
});

[{
    name: 'PNG stream with parse URL', type: 'png', filename: 'qr.png', params: { parse_url: true }
},
{
    name: 'PNG stream with logo', type: 'png', filename: 'qr.png', params: { parse_url: true, logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==' }
}].forEach((testData) => {
    test.cb(testData.name, t => {
        const image = qr.image(text, { type: testData.type, ...defaultParams, ...testData.params });
        image.pipe(file(testData.filename)).on('finish', () => {
            looksSame(__dirname + '/' + testData.filename, __dirname + '/golden/' + testData.filename, { strict: true }, function (error, { equal } = {}) {
                t.is(equal, true, testData.filename + ' is not equal to golden:' + error);
                t.end();
            });
        });;
    });
});

[{
    name: 'SVG stream', type: 'svg', filename: 'qr.svg', 
}, {
    name: 'SVG stream with logo', type: 'svg', filename: 'qr_with_logo.svg', 
    params: {logo: fs.readFileSync(__dirname + '/golden/logo.png')}
}, {
    name: 'PDF stream', type: 'pdf', filename: 'qr.pdf',
},
{
    name: 'EPS stream', type: 'eps', filename: 'qr.eps'
}].forEach((testData) => {
    test.cb(testData.name, t => {
        const image = qr.image(text, { type: testData.type, ...defaultParams, ...testData.params });
        image.pipe(file(testData.filename)).on('finish', () => {
            t.is(fs.readFileSync(__dirname + '/' + testData.filename).toString(), fs.readFileSync(__dirname + '/golden/' + testData.filename).toString(), testData.filename + ' is not equal to golden');
            t.end();
        });;
    });
});

test('write sync png', t => {
    fs.writeFileSync('qr_sync.png', qr.imageSync(text));
    t.pass();
});
