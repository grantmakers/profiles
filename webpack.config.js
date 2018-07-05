const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

console.log('path.resolve() : ', path.resolve());
console.log('path.resolve(_dirname) : ', path.resolve(__dirname, 'assets/js/'));

module.exports = {
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
        loader: 'vue-loader',
        options: {
          loaders: {
            js: 'babel?presets[]=es2015',
          },
        },
      },
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
      },
    ],
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    },
    extensions: ['*', '.js', '.vue', '.json'],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
};
