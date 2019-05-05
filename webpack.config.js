const webpack = require('webpack');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const pkg = require('./package.json');

let config = {
  // webpack folder's entry js - excluded from jekll's build process.
  entry: './webpack/entry.js',
  output: {
    // we're going to put the generated file in the assets folder so jekyll will grab it.
    path: path.resolve(__dirname, 'assets/js/'),
    filename: 'bundle.js',
  },
  stats: {
    assets: true,
    children: false,
    chunks: false,
    errors: true,
    errorDetails: true,
    modules: false,
    timings: true,
    colors: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
        },
      },
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    },
    extensions: ['*', '.js', '.vue', '.json'],
  },
  externals: {
    materialize: 'M',
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      appVersion: JSON.stringify(pkg.version),
    }),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === 'production') {
    config.devtool = 'source-map'; // Use hidden-source-map if concerned
  }

  return config;
};
