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

const name = "customActions";

async function load() {
  const result = await browser.storage.local.get(name);
  return result[name];
}

function saveState(items) {
  const result = {};
  result[name] = items;
  return browser.storage.local.set(result);
}

const predefined = [
  {
    data: {
      type: "timer",
      inputs: ["1000", "Please enter the time in milliseconds"]
    },
    info: {
      description: "Stops workflow of project for mentioned period in milliseconds then continue with it."
    },
    text: "Timer"
  },
  {
    data: {
      type: "update",
      inputs: ["this event will let the script wait for page update", ""]
    },
    info: {
      description: "This action will let the execution flow wait for page update/load and then continue with it."
    },
    text: "Update"
  },
  {
    data: {
      type: "bg-function",
      inputs: ["<$function=removeCookie>\n<$attr=.*>", "use regular expressions to filter domains"]
    },
    info: {
      description: "Clear browser cookie(s) for domains matching corresponding regular expression in `<$attr=.*>`, ex.: `<$attr=google.com>`"
    },
    text: "Clear cookies"
  },
  {
    data: {
      type: "bg-function",
      inputs: ['<$function=saveToClipboard>\n<$attr={"name": "value"}>', "Write to clipboard Object to access data later. Use Json in the attr"]
    },
    info: {
      description: "Write to clipboard Object to access data later. Use Json in the attr."
    },
    text: "Clipboard"
  }
];

module.exports = {load, saveState, name, predefined};
