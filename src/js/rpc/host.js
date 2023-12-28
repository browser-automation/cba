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

/**
 *  @typedef {import("./types").RpcMessages} RpcMessages
 */

/**
 * @callback RpcHandler
 * @param {RpcMessages} msg
 */

/**
 * @type {RpcHandler[]}
 */
const listeners = [];

browser.runtime.onConnect.addListener((port) => {
  if (port.name !== "rpcPort") throw new Error("Unknown port.");
  port.onMessage.addListener(async(/** @type {RpcMessages} */ msg) => {
    for (const listener of listeners) {
      listener(msg);
    }
  });
});

/**
 * Adds rpc listener.
 * @param {RpcHandler} handler - rpc listener handler.
 */
function addRpcListener(handler) {
  listeners.push(handler);
}

/**
 * Removes rpc listener.
 * @param {RpcHandler} handler - rpc listener handler.
 */
function removeRpcListener(handler) {
  const index = listeners.indexOf(handler);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}

module.exports = {addRpcListener, removeRpcListener};
