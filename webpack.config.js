const webpack = require('webpack');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = {
  mode: 'production',
  entry: path.resolve(__dirname, 'meerkat.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'meerkat.min.js',
    library: { name: 'Meerkat', type: 'var', export: 'default' },
    libraryTarget: 'umd',
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-typescript', { allowNamespaces: true }],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.ts', '.tsx', '.scss'],
    fallback: {
      assert: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      url: false,
      'process/browser': require.resolve('process/browser'),
      util: require.resolve('util/'),
      net: false,
      fs: false,
      querystring: false,
      dns: false,
      async_hooks: false,
      dgram: false,
      zlib: false,
    },
  },
  plugins: [
    new webpack.ProgressPlugin(),
    /*new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),*/
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

module.exports = config;
