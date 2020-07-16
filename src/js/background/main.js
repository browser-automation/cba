require("../analytics");
const {migrate, backup} = require("./migrate");
const {CBA} = require("./CBA");
const {playProject} = require("./actions");
const {addAction} = require("../db/collections");

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
  const data = localStorage.getItem("data");
  const collections = await browser.storage.local.get("collections");
  const predefinedActions = await browser.storage.local.get("predefinedActions");
  if (data) {
    await backup();
    await migrate();
    localStorage.removeItem("data");
  }
  else {
    if (!Object.keys(collections).length) {
      const collections = [
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
  
      await browser.storage.local.set({collections});
    }
    if (!Object.keys(predefinedActions).length) {
      const predefinedActions = [
        {
          data: {
            texts: {
              data: "Please enter the time in milliseconds",
              type: "timer",
              value: "1000"
            }
          },
          text: "Timer"
        },
        {
          data: {
            texts: {
              data: "this event will let the script wait for page update",
              type: "update",
              value: ""
            }
          },
          text: "Update"
        },
        {
          data: {
            texts: {
              data: "<$function=removeCookie>\n<$attr=.*>",
              type: "bg-function",
              value: "use regular expressions to filter domains"
            }
          },
          text: "Clear cookies"
        },
        {
          data: {
            texts: {
              data: '<$function=saveToClipboard>\n<$attr={"name": "value"}>',
              type: "bg-function",
              value: "Write to clipboard Object to access data later. Use Json in the attr."
            }
          },
          text: "Clipboard"
        }
      ];
      await browser.storage.local.set({predefinedActions});
    }
  } 
}

isFirstLoad();

/*
 * Function for storing records in Local Storage
 */
function storeRecord(msg) {
  if(msg.evType == "redirect") {
    return addAction(cba.recordingGroupId, cba.recordingProjectId, {texts: msg});
  }
  if((cba.lastEvType == "update") && (msg.evType == "update")) {
    return false;
  }
  cba.lastEvType = msg.evType;
  return addAction(cba.recordingGroupId, cba.recordingProjectId, {texts: msg});
}

async function storeCurrentUrl() {
  const {url} = (await browser.tabs.query({active: true}))[0];
  await storeRecord({
                        msgType: "RecordedEvent",
                        data: url,
                        type: "redirect",
                        value: ""
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
