import { nodeResolve } from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import nodePolyfills from 'rollup-plugin-node-polyfills';

import packageJson from './package.json' assert { type: 'json' };

export default [
  {
    input: 'meerkat.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({ useTsconfigDeclarationDir: true }),
      peerDepsExternal({ includeDependencies: true }),
      nodePolyfills(),
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
    ],
  },
  {
    input: 'meerkat.ts',
    plugins: [
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true }),
      peerDepsExternal({ includeDependencies: true }),
      nodePolyfills(),
      nodeResolve({
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
