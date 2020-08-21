function matrix2path(matrix) {
  const N = matrix.length;
  const filled = [];
  function isDark(row, col) {
    if (row < 0 || col < 0 || row >= N || col >= N) return false;
    return !!matrix[row][col];
  }
  function plot(row0, col0, inDir) {
    let dir = inDir;
    filled[row0][col0] = 1;
    const res = [];
    res.push(['M', col0, row0]);
    let row = row0;
    let col = col0;
    let len = 0;
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
              len += 1;
              col += 1;
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
              len += 1;
              col -= 1;
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
              len += 1;
              row += 1;
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
              len += 1;
              row -= 1;
            }
          } else {
            res.push(['v', -len]);
            len = 0;
            dir = 'right';
          }
          break;
        default:
          throw new Error('Unexpected error');
      }
    } while (row !== row0 || col !== col0);
    return res;
  }
  for (let row = -1; row <= N; row += 1) {
    filled[row] = [];
  }

  const path = [];
  for (let row = 0; row < N; row += 1) {
    for (let col = 0; col < N; col += 1) {
      if (filled[row][col]) continue;
      filled[row][col] = 1;
      if (isDark(row, col)) {
        if (!isDark(row - 1, col)) {
          path.push(plot(row, col, 'right'));
        }
      } else if (isDark(row, col - 1)) {
        path.push(plot(row, col, 'down'));
      }
    }
  }
  return path;
}

function getSVGPath(matrix, margin) {
  return matrix2path(matrix).map((subpath) => {
    let res = '';
    for (let k = 0; k < subpath.length; k += 1) {
      const item = subpath[k];
      switch (item[0]) {
        case 'M':
          res += `M${item[1] + margin} ${item[2] + margin}`;
          break;
        default:
          res += item.join('');
      }
    }
    res += 'z';
    return res;
  }).join('');
}

async function SVG({
  matrix, margin, size, logo, logoWidth, logoHeight,
}) {
  const stream = [];
  const X = matrix.length + 2 * margin;
  stream.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ');
  if (size > 0) {
    const XY = X * size;
    stream.push(`width="${XY}" height="${XY}" `);
  }
  stream.push(`viewBox="0 0 ${X} ${X}">`);
  stream.push('<path d="');
  stream.push(getSVGPath(matrix, [], margin));
  stream.push('"/>');
  if (logo) {
    const iriLogo = `data:image/png;base64,${Buffer.isBuffer(logo) ? logo.toString('base64') : Buffer.from(logo).toString('base64')}`;
    stream.push(`<image x="50%" y="50%" transform="translate(-${(logoWidth / 200) * X},-${(logoHeight / 200) * X})" width="${(logoWidth / 100) * X}" height="${(logoHeight / 100) * X}" xlink:href="${iriLogo}"/>`);
  }
  stream.push('</svg>');
  stream.push(null);
  return stream.join('');
}

module.exports = SVG;
