import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import babel from '@rollup/plugin-babel';
import alias from '@rollup/plugin-alias';

export default [{
  input: 'src/png_browser.ts',
  output: {
    file: "lib/browser/png.umd.js",
    format: 'umd',
    name: 'pngQrCode',
    sourcemap: true
  },
  plugins: [typescript({
    outDir: 'lib/browser'
  }), nodeResolve(), commonjs()]
}, {
    input: 'src/svg.ts',
    output: {
      file: "lib/browser/svg.umd.js",
      format: 'umd',
      name: 'svgQrCode',
      sourcemap: true
    },
    plugins: [typescript({
      outDir: 'lib/browser'
    }), nodeResolve(), commonjs()]    
}, {
    input: 'src/pdf.ts',
    output: {
      file: "lib/browser/pdf.umd.js",
      format: 'umd',
      name: 'pdfQrCode',
      sourcemap: true,
      interop: 'auto'
    },
    plugins: [typescript({
      outDir: 'lib/browser'
    }), commonjs({ 
      include: /node_modules/,
      extensions: [".ts", ".js"],
      requireReturnsDefault: 'esmExternals'
    }), nodeResolve(), babel({
      babelHelpers: 'bundled', extensions: [".js", ".ts"],
      presets: [
        [
          '@babel/preset-env',
        ]
      ],
    }), nodePolyfills({ fs: true, buffer: true }), alias({
      entries: [
        { find: 'fontkit', replacement: 'src/stubs/fontkit.ts' },
        { find: "fs", replacement: "src/stubs/fs.ts" },
      ]
    }), json()]
}, {
  input: 'src/pdf.ts',
  output: {
    file: "lib/browser/pdf.js",
    format: 'module',
    name: 'pdfQrCode',
    sourcemap: true,
    interop: 'auto'
  },
  plugins: [typescript({
    outDir: 'lib/browser'
  }), commonjs({ 
    include: /node_modules/,
    extensions: [".ts", ".js"],
    requireReturnsDefault: 'esmExternals'
  }), nodeResolve(), babel({
    babelHelpers: 'bundled', extensions: [".js", ".ts"],
  }), nodePolyfills({ fs: true, buffer: true }), alias({
    entries: [
      { find: 'fontkit', replacement: 'src/stubs/fontkit.ts' },
      { find: "fs", replacement: "src/stubs/fs.ts" },
    ]
  }), json()]
}];