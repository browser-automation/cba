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


require("./record");
require("./actions");
const {sendRpcMessage, addRpcListener, removeRpcListener} = require("../rpc/client");
/**
 * @typedef {import("../rpc/types").RpcHandler} RpcHandler
 */

browser.runtime.onMessage.addListener((request) => {
  if(request.action == "highlight") {
    return setHighlight(request.selector);
  }
  else if(request.action == "unHighlight") {
    return setHighlight(request.selector, false);
  }
  else if (request.action == "startKeepAlive") {
    keepAlive();
  }
});

function setHighlight(query, highlight = true)
{
  const target = document.querySelector(query);
  if (target) {
    target.style["outline-style"] = highlight ? "solid" : "";
    target.style["outline-color"] = highlight ? "red" : "";
    target.style["outline-width"] = highlight ? "1px" : "";
  }
}

/**
 * @returns {Promise<import("../background/CBA").State | null>}
 */
function getCbaState() {
  return new Promise((resolve) => {
    const uuid = uuidv4();
    const onTimeout = () => {
      removeRpcListener(handler);
      resolve(null);
    }
    /** @type {RpcHandler} */
    const handler = (state) => {
      if (state.msgType === "GetStateResponse" && state.id === uuid) {
        removeRpcListener(handler);
        resolve(state.state);
      }
      clearTimeout(onTimeout);
    };
    setTimeout(onTimeout, 1000);
    addRpcListener(handler);
    sendRpcMessage({msgType: "GetState", id: uuid});
  });
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * While a CBA project is being executed Service worker should be kept alive. It
 * has been observed that service worker is being killed by the browser on
 * `click-update` and `update` actions, breaking our user workflow which
 * involves project with repeating run and relying on page update triggered by
 * the user .
 */
let keepAlivePort;
let postTimer;
async function keepAlive() {
  const state = await getCbaState();
  if (state === null) {
    return;
  }
  // If project is playing or paused, keep service worker alive.
  if (state && (state.allowPlay || state.paused)) {
    keepAlivePort = chrome.runtime.connect({name: 'keepAlive'});
    postTimer = window.setTimeout(keepAlive, 15000);
  } else {
    if (keepAlivePort) {
      keepAlivePort.disconnect();
      keepAlivePort = null;
    }
    if (postTimer) {
      window.clearTimeout(postTimer);
      postTimer = null;
    }
  }
}

keepAlive();
