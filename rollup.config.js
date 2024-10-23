import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

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
      sourcemap: true
    },
    plugins: [typescript({
      outDir: 'lib/browser'
    }), nodeResolve(), commonjs(), json()]
}, {
  input: 'src/react.tsx',
  output: {
    file: "lib/browser/react.umd.js",
    format: 'umd',
    name: 'svgQrCode',
    sourcemap: true
  },
  jsx: "react-jsx",
  extensions: [".tsx", ".ts"],
  plugins: [typescript({
    outDir: 'lib/browser'
  }), nodeResolve(), commonjs()]    
}];