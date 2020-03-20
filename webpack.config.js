const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const CopyPlugin = require('copy-webpack-plugin');
const csso = require("csso");

module.exports =
{
  context: path.resolve(__dirname),
  entry: "./src/js/main.js",
  output: {
    path: path.resolve('dist')
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin([
      { from: './src/css', to: "css" ,
        transform: (content) => argv.prod ? csso.minify(content).css : content},
      { from: "./src/*.*", flatten: true},
      { from: "./src/js", to: "js" },
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