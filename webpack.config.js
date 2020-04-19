const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const CopyPlugin = require('copy-webpack-plugin');
const csso = require("csso");

module.exports =
{
  context: path.resolve(__dirname),
  entry: {
    "cs": "./src/js/cs/main.js",
    "back": "./src/js/background/main.js"
  },
  output: {
    path: path.resolve('dist'),
    filename: "js/[name].js"
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin([
      { from: './src/css/*', to: "css", flatten: true,
        transform: (content) => argv.prod ? csso.minify(content).css : content},
      { from: "./src/css/icons", to: "css/icons"},
      { from: "./src/css/images", to: "css/images"},
      { from: "./src/*.*", flatten: true},
      { from: "./src/js/*", to: "js", flatten: true },
      { from: "./src/js/ui", to: "js/ui", flatten: true },
    ])
  ]
};

if (argv.watch)
{
  module.exports.watch = true;
}

if (argv.prod)
{
  module.exports.mode = "production";
  module.exports.optimization.minimize = true;
}
