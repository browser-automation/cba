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

require("../analytics");
const {migrate, backup} = require("./migrate");
const {CBA} = require("./CBA");
const {playProject} = require("./actions");
const projectsDb = require("../db/projects");
const customActionsDb = require("../db/customActions");

window.cba = new CBA();
//TODO: Use message passing to run the functions
window.cba.playButtonClick = playButtonClick;
window.cba.recordButtonClick = recordButtonClick;
window.cba.stopButtonClick = stopButtonClick;

/*
 * Function for listening to connection port and get data from content script
 */
browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async(msg) => {
    if(cba.allowRec) {
      storeRecord(msg);
    }
  });
});

/*
 * check whether background page is loading for first time.
 */
async function isFirstLoad() {
  const oldDatabaseName = "data";
  const oldDatabase = localStorage.getItem(oldDatabaseName); 
  const newDatabase = await browser.storage.local.get(projectsDb.name);
  if (oldDatabase) {
    await backup();
    await migrate();
    localStorage.removeItem("data");
  }
  else {
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
}

isFirstLoad();

/*
 * Function for storing records in Local Storage
 */
function storeRecord(msg) {
  if(msg.type == "redirect") {
    return projectsDb.addAction(cba.recordingGroupId, cba.recordingProjectId, msg);
  }
  if((cba.lastEvType == "update") && (msg.type == "update")) {
    return false;
  }
  cba.lastEvType = msg.type;
  return projectsDb.addAction(cba.recordingGroupId, cba.recordingProjectId, msg);
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
  const [tab] = await browser.tabs.query({active: true});
  cba.playingTabId = tab.id;
  playProject();
}
