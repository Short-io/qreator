"use strict";
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
        const iriLogo = Buffer.isBuffer(logo) ? 'data:image/png;base64,' + logo.toString('base64') : Buffer.from(logo).toString('base64');
        stream.push('<image x="50%" y="50%" transform="translate(-' + (logo_width / 200 * X) + ',-' + (logo_height / 200 * X) + ')" width="' + (logo_width / 100 * X) + '" height="' + (logo_height / 100 * X) + '" xlink:href="' + iriLogo +'"/>')
    }
    stream.push('</svg>');
    stream.push(null);
    return stream.join('')
}

async function PDF(matrix, stream, margin, _unused, logo, logo_width, logo_height, pdflib) {
    const size = 9;
    if (!pdflib && logo) {
        throw new Error('pdflib parameter is required for logo support');
    }
    if (!pdflib) {
        return PDF_simple(matrix, stream, margin, logo, logo_width, logo_height)
    }
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
    for (const line of matrix) {
        for (const x of line) {
            if (x) {
                page.drawRectangle({
                    width: size,
                    height: size,
                    color: pdflib.rgb(0, 0, 0),
                    borderColor: pdflib.rgb(0, 0, 0),
                });
            }
            page.moveRight(size);
        }
        page.moveLeft(size * line.length);
        page.moveDown(size);
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

function PDF_simple(matrix, stream, margin) {
    // TODO deflate
    var N = matrix.length;
    var scale = 9;
    var X = (N + 2 * margin) * scale;
    var data = [
        '%PDF-1.0\n\n',
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
        '2 0 obj << /Type /Pages /Count 1 /Kids [ 3 0 R ] >> endobj\n',
    ];
    data.push('3 0 obj << /Type /Page /Parent 2 0 R /Resources <<>> ' +
        '/Contents 4 0 R /MediaBox [ 0 0 ' + X + ' ' + X + ' ] >> endobj\n');

    var path = scale + ' 0 0 ' + scale + ' 0 0 cm\n';
    path += matrix2path(matrix).map(function(subpath) {
        var res = '';
        var x, y;
        for (var k = 0; k < subpath.length; k++) {
            var item = subpath[k];
            switch (item[0]) {
            case 'M':
                x = item[1] + margin;
                y = N - item[2] + margin;
                res += x + ' ' + y + ' m ';
                break;
            case 'h':
                x += item[1];
                res += x + ' ' + y + ' l ';
                break;
            case 'v':
                y -= item[1];
                res += x + ' ' + y + ' l ';
                break;
            }
        }
        res += 'h';
        return res;
    }).join('\n');
    path += '\nf\n';
    data.push('4 0 obj << /Length ' + path.length + ' >> stream\n' +
        path + 'endstream\nendobj\n');
    var xref = 'xref\n0 5\n0000000000 65535 f \n';
    for (var i = 1, l = data[0].length; i < 5; i++) {
        xref += ('0000000000' + l).substr(-10) + ' 00000 n \n';
        l += data[i].length;
    }
    data.push(
        xref,
        'trailer << /Root 1 0 R /Size 5 >>\n',
        'startxref\n' + l + '\n%%EOF\n'
    );
    return data.join('');
}

module.exports = {
    svg: SVG,
    pdf: PDF,
    svg_object: SVG_object
}
