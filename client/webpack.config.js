var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.jsx',
  output: { path: __dirname, filename: './build/bundle.js' },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.css?$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        loader: 'babel?presets[]=es2015,presets[]=react!svg-react'
      }
    ]
  }
}
