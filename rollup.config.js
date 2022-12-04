import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import nodePolyfills from 'rollup-plugin-polyfill-node';

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
      nodePolyfills(),
      peerDepsExternal({ includeDependencies: true }),
      resolve(),
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true }),
    ],
  },
  {
    input: 'meerkat.ts',
    plugins: [
      nodePolyfills(),
      peerDepsExternal({ includeDependencies: true }),
      resolve(),
      typescript({ useTsconfigDeclarationDir: true }),
      babel({
        babelHelpers: 'bundled',
      }),
    ],
    external: [
      'tweetnacl',
      'bs58check',
      'buffer',
      'webtorrent',
      'bs58',
      'events',
    ],
    output: {
      file: `dist/meerkat.min.js`,
      format: 'umd',
      name: 'Meerkat',
      esModule: false,
      exports: 'named',
      sourcemap: true,
      globals: {
        tweetnacl: 'nacl',
        bs58check: 'bs58check',
        buffer: 'buffer',
        webtorrent: 'WebTorrent',
        bs58: 'bs58',
        events: 'events',
      },
    },
  },
];
