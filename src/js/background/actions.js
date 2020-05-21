const readyFunctions = require("./bg_function");

async function playNextAction() {
  if(cba.allowPlay == 0 ) {
    return;
  }
  else if(cba.instructArray.length) {
    browser.browserAction.setBadgeText({"text":"play"});
    const [instruction] = cba.instructArray.splice(0, 1);
    await actionExecution(instruction);
    await playNextAction();
  }
  else if(cba.projectRepeat > 1) {
    cba.projectRepeat--;
    cba.setProject(cba.selectedProjObj, cba.playingProjectId, cba.projectRepeat);
  }
  else {
    cba.allowPlay = 0;
    browser.browserAction.setBadgeText({"text": ""});
  }
}

async function actionExecution(instruction)
{
  const {evType, data} = instruction;
  switch (evType) {
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
      await timeout(instruction.newValue);
      break;
    }
    case "bg-function": {
      await bgFunctionParser(data);
      break;
    }
    case "bg-inject": {
      let sendInstruction = () => "";
      const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
      let sendBgInstruction = true;
      // see -> https://github.com/browser-automation/cba/issues/13
      let clipboard = cba.clipboard;
      eval(data);
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
  const message = {"action": "play" ,instruction, clipboard};
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

module.exports = {playNextAction};
