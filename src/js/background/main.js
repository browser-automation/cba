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

// Expose browser to global scope.
/** @global */
globalThis.browser = require("webextension-polyfill");

require("../analytics");
const {CBA} = require("./CBA");
const {playProject} = require("./actions");
const projectsDb = require("../db/projects");
const customActionsDb = require("../db/customActions");
const {addRpcListener, sendRpcMessageResponse} = require("../rpc/host");

/** @global */
globalThis.cba = new CBA();
//TODO: Use message passing to run the functions
globalThis.cba.playButtonClick = playButtonClick;
globalThis.cba.recordButtonClick = recordButtonClick;
globalThis.cba.stopButtonClick = stopButtonClick;

addRpcListener(async(msg, port) => {
  switch (msg.msgType) {
    case "RecordedEvent": {
      if(cba.allowRec) {
        await storeRecord(msg.action);
      }
      break;
    }
    case "PlayProject": {
      const {actions, repeatTimes, id} = msg;
      return playButtonClick(actions, repeatTimes, id);
    }
    case "StopProject": {
      return stopButtonClick();
    }
    case "RecordProject": {
      const {groupId, projectId} = msg;
      return recordButtonClick(groupId, projectId);
    }
    case "GetState": {
      const state = cba.getState();
      sendRpcMessageResponse({msgType: "GetStateResponse", state, id: msg.id}, port);
      break;
    }
  }
})

/*
 * check whether background page is loading for first time.
 */
async function isFirstLoad() {
  const newDatabase = await browser.storage.local.get(projectsDb.name);
  if (!Object.keys(newDatabase).length) {
    const dbItem = {};
    dbItem[projectsDb.name] = [
      {
        id: "group",
        text: "group",
        type: "group",
        expanded: false,
        subItems: [
          {
            id: "project",
            text: "project",
            type: "project",
            actions: []
          }
        ]
      }
    ];

    await browser.storage.local.set(dbItem);
  }

  const customActions = await browser.storage.local.get(customActionsDb.name);
  if (!Object.keys(customActions).length) {
    const dbItem = {};
    dbItem[customActionsDb.name] = customActionsDb.predefined;
    await browser.storage.local.set(dbItem);
  }
}

isFirstLoad();

/**
 * Function for storing records in Local Storage
 * @param {import("../db/projects").Action} action
 */
function storeRecord(action) {
  if(action.type == "redirect") {
    return projectsDb.addAction(cba.recordingGroupId, cba.recordingProjectId, action);
  }
  if((cba.lastEvType == "update") && (action.type == "update")) {
    return false;
  }
  cba.lastEvType = action.type;
  return projectsDb.addAction(cba.recordingGroupId, cba.recordingProjectId, action);
}

async function storeCurrentUrl() {
  const {url} = (await browser.tabs.query({active: true}))[0];
  await storeRecord({
                        msgType: "RecordedEvent",
                        type: "redirect",
                        inputs: [url, ""]
                      });
}

/*
 * Function that calls after clicking on record button
 */
async function recordButtonClick(groupId, projectId) {
  cba.record(groupId, projectId);
  await storeCurrentUrl();
  browser.browserAction.setBadgeText({"text": "rec"});
}

/*
 * Function that calls after clicking on Stop button
 */
function stopButtonClick() {
  cba.stop();
  browser.browserAction.setBadgeText({"text": ""});
}

/*
 * Function that calls after clicking on Play button
 */
async function playButtonClick(actions, repeatVal, currProjectId) {
  if (cba.paused) {
    cba.restore();
  }
  else {
    cba.setProject(actions, repeatVal, currProjectId);
  }
  await playProject();
}
