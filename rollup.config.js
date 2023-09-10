import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [{
  input: 'src/png_browser.ts',
  output: {
    file: "lib/browser/png.js",
    format: 'cjs',
    sourcemap: true
  },
  plugins: [typescript(), nodeResolve(), commonjs()]
}, {
    input: 'src/svg.ts',
    output: {
      file: "lib/browser/svg.js",
      format: 'cjs',
      sourcemap: true
    },
    plugins: [typescript(), nodeResolve(), commonjs()]    
}, {
    input: 'src/pdf.ts',
    output: {
      file: "lib/browser/pdf.js",
      format: 'cjs',
      sourcemap: true
    },
    plugins: [typescript(), nodeResolve(), commonjs(), json()]
}];