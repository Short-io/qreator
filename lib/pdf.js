const pdflib = require('pdf-lib');

async function PDF({matrix, margin, logo, logo_width, logo_height}) {
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

module.exports = PDF;