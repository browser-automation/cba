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

const readyFunctions = require("./bg_function");
const {setBadgeText} = require("./utils");

async function playProject() {
  if(cba.allowPlay == 0 ) {
    return;
  }
  else if(cba.instructArray.length) {
    setBadgeText("play");
    const [instruction] = cba.instructArray.splice(0, 1);
    cba.playingActionIndex = (cba.defInstructArray.length - cba.instructArray.length) - 1;

    try {
      await actionExecution(instruction);
    }
    catch(e) {
      // We want to continue playing project when action has error.
    }
    await playProject();
  }
  else if(cba.projectRepeat > 1) {
    cba.projectRepeat--;
    cba.setProject(cba.defInstructArray, cba.projectRepeat, cba.playingProjectId);
    playProject();
  }
  else {
    cba.playingActionIndex = -1;
    cba.playingProjectId = null;
    cba.allowPlay = 0;
    setBadgeText("");
  }
}

async function actionExecution(instruction)
{
  const {type, inputs} = instruction;
  const [input1] = inputs;
  switch (type) {
    case "redirect":
    case "click-update": {
      messageContentScript(instruction, cba.clipboard);
      await waitForUpdate();
      break;
    }
    case "update": {
      await waitForUpdate();
      break;
    }
    case "timer": {
      await timeout(input1);
      break;
    }
    case "bg-function": {
      await bgFunctionParser(input1);
      break;
    }
    case "bg-inject": {
      // eslint-disable-next-line no-unused-vars
      let sendInstruction = () => "";
      // eslint-disable-next-line no-unused-vars
      const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
      let sendBgInstruction = true;
      const clipboard = cba.clipboard;
      await eval(`(async () => {${input1}})()`);
      cba.clipboard = clipboard;
      if(!sendBgInstruction) {
        return new Promise((resolve) => {
          sendInstruction = resolve;
        });
      }
      break;
    }
    case "pause": {
      cba.pause();
      setBadgeText("||");
      break;
    }
    default: {
      await messageContentScript(instruction, cba.clipboard);
      break;
    }
  }
}

async function messageContentScript(instruction, clipboard)
{
  const message = {"action": "executeAction" ,instruction, clipboard};
  const playingTabId = await cba.getPlayingTabId();
  await browser.tabs.sendMessage(playingTabId, message).then(playResponse);
}

async function playResponse(response) {
  if(response == null) {
    await timeout(1000);
  }
  else if(response.answere == "instructOK") {
    cba.clipboard = response.clipboard;
  }
}

async function bgFunctionParser(value) {
  const methodPattern = /<\$function=(\S*)>/;
  const attributePattern = /<\$attr=([^>]*)>/g;
  const clipboardPattern = /clipboard\[["'](.*)["']\]/;

  const attributes = [];
  const method = methodPattern.exec(value);
  if(!method)
    return false;

  const functionName = method[1];
  let attribute;
  while (attribute = attributePattern.exec(value)) {
    const clipboard = clipboardPattern.exec(attribute[1]);
    if (clipboard)
      attributes.push(getClipboardValue(clipboard[1]));
    else
      attributes.push(attribute[1]);
  }

  if(attributes.length) {
    await readyFunctions[functionName](...attributes);
  }
  else {
    await readyFunctions[functionName]();
  }
}

function getClipboardValue(attr) {
  return cba.clipboard[attr];
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForUpdate()
{
  const playingTabId = await cba.getPlayingTabId();
  let onUpdate;
  return new Promise((resolve) =>
  {
    onUpdate = (tabId , info) => {
      if(tabId == playingTabId && info.status == "complete")
        resolve();
    };
    browser.tabs.onUpdated.addListener(onUpdate);
  }).then(() => browser.tabs.onUpdated.removeListener(onUpdate));
}

module.exports = {playProject};
