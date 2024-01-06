/*
 * This file is part of Chromium Browser Automation.
 * Copyright (C) 2020-present Manvel Saroyan
 * 
 * Chromium Browser Automation is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Chromium Browser Automation is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Chromium Browser Automation. If not, see
 * <http://www.gnu.org/licenses/>.
 */

const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const CopyPlugin = require('copy-webpack-plugin');
const {minify} = require("csso");
const {extname} = require("path");
const webpack = require("webpack");

const transformCss = (content, file) =>
{
  if (argv.prod && extname(file) === ".css")
    return minify(content).css;
  else
    return content;
}

module.exports =
{
  context: path.resolve(__dirname),
  entry: {
    "cs": "./src/js/cs/main.js",
    "back": "./src/js/background/main.js",
    "off_screen": "./src/js/off_screen.js",
    "popup": "./src/js/popup.js",
    "options": "./src/js/options.js"
  },
  output: {
    path: path.resolve('dist'),
    filename: "js/[name].js"
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin({patterns: [
      { from: './src/css/*', to: "css/[name][ext]",
        transform: transformCss},
      { from: "./src/css/icons", to: "css/icons"},
      { from: "./src/css/images", to: "css/images"},
      { from: "./src/*.*", to: "[name][ext]"},
      { from: "./src/js/jquery*.js", to: "js/jquery-1.7.2.min.js" },
      {from: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
      to: "js" },
      { from: `./src/manifest/${process.env.MV3 ? "mv3" : "mv2"}.json`,
        to: "manifest.json" },
    ]}),
    new webpack.EnvironmentPlugin({
      MV3: process.env.MV3 || 0
    })
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
