import terser from '@rollup/plugin-terser';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'mxjs-lite.js',
  output: {
    file: 'dist/mxjs-lite.min.js',
    format: 'es',
    plugins: [terser()],
  },
};
