const path = require('path');
const webpack = require('webpack');
const banner = require('./banner');

module.exports = {
  mode: 'production',
  entry: './src/api/v4/index.js',
  output: {
    path: path.resolve(__dirname, '../dist/public'),
    filename: 'carto.js',
    library: 'carto',
    libraryTarget: 'umd'
  },
  devtool: 'sourcemap',
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: [
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, '../vendor')
      ],
      options: {
        presets: ['env'],
        plugins: ['transform-object-rest-spread']
      }
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify(process.env.NODE_ENV)
    }),
    // Include only the lastest camshaft-reference
    new webpack.IgnorePlugin(/^\.\/((?!0\.59\.4).)*\/reference\.json$/),
    new webpack.BannerPlugin(banner)
  ],
  optimization: {
    minimize: false
  }
};
