"use strict";
const pdflib = require('pdf-lib');

function matrix2path(matrix) {
    var N = matrix.length;
    var filled = [];
    for (var row = -1; row <= N; row++) {
        filled[row] = [];
    }

    var path = [];
    for (var row = 0; row < N; row++) {
        for (var col = 0; col < N; col++) {
            if (filled[row][col]) continue;
            filled[row][col] = 1;
            if (isDark(row, col)) {
                if (!isDark(row - 1, col)) {
                    path.push(plot(row, col, 'right'));
                }
            } else {
                if (isDark(row, col - 1)) {
                    path.push(plot(row, col, 'down'));
                }
            }
        }
    }
    return path;

    function isDark(row, col) {
        if (row < 0 || col < 0 || row >= N || col >= N) return false;
        return !!matrix[row][col];
    }

    function plot(row0, col0, dir) {
        filled[row0][col0] = 1;
        var res = [];
        res.push(['M',  col0, row0 ]);
        var row = row0;
        var col = col0;
        var len = 0;
        do {
            switch (dir) {
            case 'right':
                filled[row][col] = 1;
                if (isDark(row, col)) {
                    filled[row - 1][col] = 1;
                    if (isDark(row - 1, col)) {
                        res.push(['h', len]);
                        len = 0;
                        dir = 'up';
                    } else {
                        len++;
                        col++;
                    }
                } else {
                    res.push(['h', len]);
                    len = 0;
                    dir = 'down';
                }
                break;
            case 'left':
                filled[row - 1][col - 1] = 1;
                if (isDark(row - 1, col - 1)) {
                    filled[row][col - 1] = 1;
                    if (isDark(row, col - 1)) {
                        res.push(['h', -len]);
                        len = 0;
                        dir = 'down';
                    } else {
                        len++;
                        col--;
                    }
                } else {
                    res.push(['h', -len]);
                    len = 0;
                    dir = 'up';
                }
                break;
            case 'down':
                filled[row][col - 1] = 1;
                if (isDark(row, col - 1)) {
                    filled[row][col] = 1;
                    if (isDark(row, col)) {
                        res.push(['v', len]);
                        len = 0;
                        dir = 'right';
                    } else {
                        len++;
                        row++;
                    }
                } else {
                    res.push(['v', len]);
                    len = 0;
                    dir = 'left';
                }
                break;
            case 'up':
                filled[row - 1][col] = 1;
                if (isDark(row - 1, col)) {
                    filled[row - 1][col - 1] = 1;
                    if (isDark(row - 1, col - 1)) {
                        res.push(['v', -len]);
                        len = 0;
                        dir = 'left';
                    } else {
                        len++;
                        row--;
                    }
                } else {
                    res.push(['v', -len]);
                    len = 0;
                    dir = 'right';
                }
                break;
            }
        } while (row != row0 || col != col0);
        return res;
    }
}

function getSVGPath(matrix, margin) {
    return matrix2path(matrix).map(function(subpath) {
        var res = '';
        for (var k = 0; k < subpath.length; k++) {
            var item = subpath[k];
            switch (item[0]) {
            case 'M':
                res += 'M' + (item[1] + margin) + ' ' + (item[2] + margin);
                break;
            default:
                res += item.join('');
            }
        }
        res += 'z';
        return res;
    }).join('');
}

function SVG_object(matrix, margin) {
    var stream = [];
    pushSVGPath(matrix, stream, margin);

    var result = {
        size: matrix.length + 2 * margin,
        path: stream.filter(Boolean).join('')
    }

    return result;
}

function SVG(matrix, _unused, margin, size, logo, logo_width, logo_height) {
    const stream = [];
    var X = matrix.length + 2 * margin;
    stream.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ');
    if (size > 0) {
        var XY = X * size;
        stream.push('width="' + XY + '" height="' + XY + '" ');
    }
    stream.push('viewBox="0 0 ' + X + ' ' + X + '">');
    stream.push('<path d="');
    stream.push(getSVGPath(matrix, [], margin));
    stream.push('"/>');
    if (logo) {
        const iriLogo = 'data:image/png;base64,' +  (Buffer.isBuffer(logo) ? logo.toString('base64') : Buffer.from(logo).toString('base64'));
        stream.push('<image x="50%" y="50%" transform="translate(-' + (logo_width / 200 * X) + ',-' + (logo_height / 200 * X) + ')" width="' + (logo_width / 100 * X) + '" height="' + (logo_height / 100 * X) + '" xlink:href="' + iriLogo +'"/>')
    }
    stream.push('</svg>');
    stream.push(null);
    return stream.join('')
}

async function PDF(matrix, stream, margin, _unused, logo, logo_width, logo_height) {
    const size = 9;
    const document = await pdflib.PDFDocument.create();
    const pageSize = (matrix.length + 2 * margin) * size;
    const page = document.addPage([pageSize, pageSize]);
    page.moveTo(margin * size, page.getHeight() - margin * size - size)
    page.drawRectangle({
        width: size,
        height: size,
        color: pdflib.rgb(0, 0, 0),
        borderColor: pdflib.rgb(0, 0, 0),
    });
    for (const column of matrix) {
        for (const y of column) {
            if (y) {
                page.drawRectangle({
                    width: size,
                    height: size,
                    color: pdflib.rgb(0, 0, 0),
                    borderColor: pdflib.rgb(0, 0, 0),
                });
            }
            page.moveDown(size);
        }
        page.moveUp(size * column.length);
        page.moveRight(size);
    }
    if (logo) {
        const logoData = await document.embedPng(logo);
        page.drawImage(logoData, {
            x: page.getWidth() / 2 - logo_width / 100 * page.getWidth() / 2,
            y: page.getHeight() / 2 - logo_height / 100 * page.getWidth() / 2,
            width: logo_width / 100 * page.getWidth(),
            height: logo_height / 100 * page.getHeight(),
        })
    }
    return await document.save();
}

module.exports = {
    svg: SVG,
    pdf: PDF,
    svg_object: SVG_object
}
