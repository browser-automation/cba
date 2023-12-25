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

const tests = [
  {file:"play.js", name: "Testing actions"},
  {file:"record.js", name: "Testing recording"},
  {file:"generic.js", name: "Running generic Tests"},
  {file:"popup.js", name: "Testing popup"},
  {file:"options.js", name: "Testing options page generic functionality"},
  {file:"import-export.js", name: "Testing Import and Export in options page"},
  {file:"functions.js", name: "Testing functions tab in options page"},
];

const server = "http://127.0.0.1:3001";
const closeBrowser = true;

module.exports = {server, tests, closeBrowser};
