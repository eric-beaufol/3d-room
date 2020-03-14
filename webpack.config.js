const { resolve } = require('path');
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const babelSettings = JSON.parse(fs.readFileSync('.babelrc'));

const config = {
  mode: 'development',
  context: resolve(__dirname, 'src'),
  entry: [
    'react-hot-loader/patch',
    // activate HMR for React
    'webpack-dev-server/client?http://localhost:8080',
    // bundle the client for webpack-dev-server
    // and connect to the provided endpoint
    'webpack/hot/only-dev-server',
    // bundle the client for hot reloading
    // only- means to only hot reload for successful updates
    // Add here external front-end libs (material design, bootstrap, carrousel, etc...)
    './index.js',
    // the entry point of our app
  ],
  output: {
    path: resolve(__dirname, 'www'),
    filename: 'bundle.js',
    publicPath: '/'
    // necessary for HMR to know where to load the hot update chunks
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: '/node_modules/',
        use: {
          loader: 'babel-loader',
          options: babelSettings
        }
      },
      {
        test: /\.css$/,
        include: resolve(__dirname, './src'),
        use: [
          {
            loader: 'style-loader?sourceMap'
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: 'inline'
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        use: {
          loader: 'file-loader'
        }
      },
    ]
  },
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom'
    }
  },
  devServer: {
    hot: false,
    contentBase: resolve(__dirname, 'dist'),
    // match the output path
    publicPath: '/',
    // match the output `publicPath`
    historyApiFallback: true,
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      hash: true,
      template: './index.ejs',
      title: 'Webpack + React boilerplate',
      trackingID: null,
      debug: true
    }),
  ],
};

module.exports = config;