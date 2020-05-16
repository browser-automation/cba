const readyFunctions = require("./bg_function");

async function playNextAction() {
  if(cba.allowPlay == 0 ) {
    return;
  }
  if(cba.instructArray.length) {
    const [tab] = await browser.tabs.query({active: true});
    if(!tab) {
      setTimeout(playNextAction, 1000);
      return;
    }
    browser.browserAction.setBadgeText({"text":"play"});
    cba.playingTabId = tab.id;  // TODO: Do we need this?
    const [instruction] = cba.instructArray.splice(0, 1);
    await actionExecution(instruction);
  }
  else if(cba.projectRepeat > 1) {
    cba.projectRepeat--;
    cba.playButtonClick(cba.selectedProjObj, cba.playingProjectId, cba.projectRepeat);
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
      cba.update = true;
      messageContentScript(instruction, cba.clipboard);
      break;
    }
    case "update": {
      cba.update = true;
      break;
    }
    case "timer": {
      setTimeout(playNextAction, instruction.newValue);
      break;
    }
    case "bg-function": {
      await bgFunctionParser(data);
      playNextAction();
      break;
    }
    case "bg-inject": {
      const sendInstruction = () => playNextAction();
      const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
      let sendBgInstruction = true;
      // see -> https://github.com/browser-automation/cba/issues/13
      let clipboard = cba.clipboard;
      eval(data);
      if (clipboard !== cba.clipboard)
        cba.clipboard = clipboard;
      if(sendBgInstruction == true) {
        playNextAction();
      }
      break;
    }
    case "pause": {
      cba.pause();
      browser.browserAction.setBadgeText({"text":"||"});
      break;
    }
    default: {
      messageContentScript(instruction, cba.clipboard);
      break;
    }
  }
}

async function messageContentScript(instruction, clipboard)
{
  const message = {"action": "play" ,instruction, clipboard};
  await browser.tabs.sendMessage(cba.playingTabId, message).then(playResponse);
}

function playResponse(response) {
  if(response == null) {
    setTimeout(playNextAction, 1000);
    return;
  }
  if(response.answere == "instructOK") {
    cba.clipboard = response.clipboard;
    if (cba.update == false) {
      playNextAction();
    }
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

module.exports = {playNextAction};
