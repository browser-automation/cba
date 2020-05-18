require("./analytics");
const {CBA} = require("./CBA");
const {playNextAction} = require("./actions");

window.cba = new CBA();
//TODO: Use message passing to run the functions
window.cba.playButtonClick = playButtonClick;
window.cba.recordButtonClick = recordButtonClick;
window.cba.stopButtonClick = stopButtonClick;

/*
 * Function for listening to connection port and get data from content script
 */
browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if(cba.allowRec==1) {
      storeRecord(msg);
    }
  });
});

/*
 * check whether background page is loading for first time.
 */
function isFirstLoad() {
  if(!localStorage.getItem("data")) {
    const initialData = {
      group0: {
        expanded: false,
        isLeaf: false,
        level: "0",
        loaded: true,
        name: "group0",
        parent: "",
        projects: [
          {
            action: [],
            expanded: false,
            isLeaf: true,
            level: "1",
            loaded: true,
            name: "project"
          }
        ]
      }
    };
    localStorage.setItem("data", JSON.stringify(initialData));
  }
}

isFirstLoad();

/*
 * Function for storing records in Local Storage
 */
function storeRecord(msg) {
  if(msg.evType == "redirect") {
    pushRecord(msg);
    return;
  }
  if((cba.lastEvType == "update") && (msg.evType == "update")) {
    return;
  }
  cba.lastEvType = msg.evType;
  
  pushRecord(msg);
}

function pushRecord(msg) {
  const dataObj = JSON.parse(localStorage.getItem("data"));
  const projectsArray = dataObj[cba.selectedProjObj["group"]].projects;

  for(let i=0; i < projectsArray.length; i++) {
    if(projectsArray[i].name == cba.selectedProjObj["project"]) {
      projectsArray[i].action.push(msg);
    }
  }
  localStorage.setItem("data", JSON.stringify(dataObj));
}

async function storeCurrentUrl() {
  const {url} = (await browser.tabs.query({active: true}))[0];
  storeRecord({msgType: "RecordedEvent", "data": url, "evType": 'redirect', "newValue" : ''});
}

/*
 * Function that calls after clicking on record button
 */
async function recordButtonClick(projObj, projectId) {
  cba.record(projObj, projectId);
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
async function playButtonClick(projObj, currProjectId, repeatVal) {
  if (cba.paused == 1) {
    cba.restore();
  }
  else {
    cba.setProject(projObj, currProjectId, repeatVal);
  }
  const [tab] = await browser.tabs.query({active: true});
  cba.playingTabId = tab.id;
  playNextAction();
}
