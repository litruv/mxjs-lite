import terser from '@rollup/plugin-terser';
import { copyFileSync } from 'fs';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'mxjs-lite.js',
  output: {
    file: 'build/mxjs-lite.min.js',
    format: 'es',
    plugins: [terser()],
  },
  plugins: [
    {
      name: 'copy-to-docs',
      writeBundle() {
        copyFileSync('build/mxjs-lite.min.js', 'docs/mxjs-lite.min.js');
      },
    },
  ],
};
