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
let creating;

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

/**
 * Execute action.
 * @param {import("../db/projects").Action} instruction 
 */
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
      if (process.env.MV3) {
        console.log("STEP1");
        await setupOffscreenDocument("off_screen.html");
        console.log("STEP2");

      } else {
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
      }
      break;
    }
    case "cs-inject": {
      if (!process.env.MV3) {
        await messageContentScript(instruction, cba.clipboard);
        break;
      }
      console.log("STEP1");
      const playingTabId = await cba.getPlayingTabId();
      console.log("STEP2");
      if (!playingTabId) {
        throw new Error("No playing tab");
      }
      console.log("STEP3");
      const exec = async (rest) => {
        const options = {target: {tabId: playingTabId}, world: "ISOLATED",  ...rest};
        console.log("STEP3.1", options);
        return browser.scripting.executeScript({});
      };
      console.log("STEP4", input1);
      // await exec({func: input1});
      await exec({func: () => eval("console.log('test')")});
      console.log("STEP5");
      break;
    }
    case "inject": {
      if (!process.env.MV3) {
        await messageContentScript(instruction, cba.clipboard);
        break;
      }
      const playingTabId = await cba.getPlayingTabId();
      if (!playingTabId) {
        throw new Error("No playing tab");
      }
      await browser.scripting.executeScript({
        target: {tabId: playingTabId},
        func: (clipboard, input1) => {
          const clipboardId = "grabClipboardHere";
          const script = document.createElement('script');
          script.setAttribute("type", "application/javascript");
          script.textContent = `
            var clipboard=${JSON.stringify(clipboard)};
            ${input1};
            var newdiv = document.createElement('div');
            if(document.getElementById('${clipboardId}')!= null) {
              document.getElementById('${clipboardId}').textContent = JSON.stringify(clipboard);
            }
            else {
              newdiv.setAttribute('id', '${clipboardId}');
              newdiv.textContent = JSON.stringify(clipboard);
              document.body.appendChild(newdiv);
            }
            document.getElementById('${clipboardId}').style.display = 'none';`;
          document.documentElement.appendChild(script); // run the script
          document.documentElement.removeChild(script); // clean up
          const injectedClipboard = document.querySelector(`#${clipboardId}`);
          if(injectedClipboard) {
            clipboard = JSON.parse(injectedClipboard.textContent);
          }
        },
        args: [cba.clipboard, input1],
        world: "MAIN"
      });
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

async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    console.log("STEP1-1");
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'reason for needing the document',
    }).catch((e) => {
      console.error(e);
    });
    console.log("STEP1-2");
    await creating;
    console.log("STEP1-3");
    creating = null;
  }
}

module.exports = {playProject};
