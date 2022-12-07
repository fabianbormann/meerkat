const webpack = require('webpack');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'meerkat.min.js',
    library: ['Meerkat', 'meerkat'],
    libraryTarget: 'umd',
  },
  entry: path.resolve(__dirname, 'meerkat.ts'),
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
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
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      url: require.resolve('url/'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      process: { env: {} },
    }),
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

module.exports = config;