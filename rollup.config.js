import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import json from '@rollup/plugin-json';
//import terser from '@rollup/plugin-terser';
import packageJson from './package.json' assert { type: 'json' };

const nodeResolve = resolve({
  preferBuiltins: false,
  mainFields: ['module', 'jsnext:main', 'browser'],
});

export default [
  {
    input: 'meerkat.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      commonjs(),
      nodePolyfills(),
      nodeResolve,
      json(),
      typescript({ useTsconfigDeclarationDir: true }),
      //terser(),
    ],
  },
  {
    input: 'meerkat.ts',
    plugins: [
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true }),
      nodePolyfills(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      babel({
        babelHelpers: 'bundled',
      }),
    ],
    external: ['tweetnacl', 'bs58check', 'webtorrent', 'bs58'],
    output: {
      file: `dist/meerkat.min.js`,
      format: 'iife',
      name: 'Meerkat',
      esModule: false,
      exports: 'named',
      sourcemap: true,
      globals: {
        tweetnacl: 'nacl',
        bs58check: 'bs58check',
        webtorrent: 'WebTorrent',
        bs58: 'bs58',
      },
    },
  },
];
