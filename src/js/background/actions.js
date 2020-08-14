const readyFunctions = require("./bg_function");

async function playProject() {
  if(cba.allowPlay == 0 ) {
    return;
  }
  else if(cba.instructArray.length) {
    browser.browserAction.setBadgeText({"text":"play"});
    const [instruction] = cba.instructArray.splice(0, 1);
    cba.playingActionIndex = (cba.defInstructArray.length - cba.instructArray.length) - 1;

    await actionExecution(instruction);
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
    browser.browserAction.setBadgeText({"text": ""});
  }
}

async function actionExecution(instruction)
{
  const {type, inputs} = instruction;
  const [input1] = inputs;
  switch (type) {
    case "redirect":
    case "submit-click": {
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
      let sendInstruction = () => "";
      const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
      let sendBgInstruction = true;
      // see -> https://github.com/browser-automation/cba/issues/13
      let clipboard = cba.clipboard;
      eval(input1);
      if (clipboard !== cba.clipboard)
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
      browser.browserAction.setBadgeText({"text":"||"});
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
  await browser.tabs.sendMessage(cba.playingTabId, message).then(playResponse);
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

function waitForUpdate()
{
  let onUpdate;
  return new Promise((resolve) =>
  {
    onUpdate = (tabId , info) => {
      if(tabId == cba.playingTabId && info.status == "complete")
        resolve();
    };
    browser.tabs.onUpdated.addListener(onUpdate);
  }).then(() => browser.tabs.onUpdated.removeListener(onUpdate));
}

module.exports = {playProject};
