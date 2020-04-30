require("./analytics");
const {CBA} = require("./CBA");
const {sendInstruction} = require("./execution");

window.cba = new CBA();
//TODO: Use message passing to run the functions
window.cba.playButtonClick = playButtonClick;
window.cba.recordButtonClick = recordButtonClick;
window.cba.stopButtonClick = stopButtonClick;

/*
 * Function for listening to connection port and get data from content script
 */
chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
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

function storeCurrentUrl() {
	chrome.tabs.getSelected(null ,function(tab) {
  		pushRecord({msgType: "RecordedEvent", "data": tab.url, "evType": 'redirect', "newValue" : ''});
	});
}

/*
 * Function that calls after clicking on record button
 */
function recordButtonClick(projObj, projectId) {
	storeCurrentUrl();
	cba.selectedProjObj = projObj;
	cba.selectedProjectId = projectId;
	cba.allowRec = 1;
	chrome.browserAction.setBadgeText({"text":"rec"}); 
}

/*
 * Function that calls after clicking on Stop button
 */
function stopButtonClick() {
	cba.allowRec = 0;
	cba.allowPlay = 0;
	cba.pause = 0;
	chrome.browserAction.setBadgeText({"text":""}); 
}

/*
 * Function that calls after clicking on Play button
 */
function playButtonClick(projObj, currProjectId, repeatVal) {
	if(cba.pause == 1) {
		cba.pause = 0;
		cba.allowPlay = 1;
		sendInstruction();
		return;
	}
	
	if(cba.clipboard == null) {
		cba.clipboard = {};
	}
	
	cba.allowPlay = 1;
	cba.projectRepeat = repeatVal;
	cba.playingProjectId = currProjectId;
	cba.update = false;
	cba.selectedProjObj = projObj;
	const dataObj = JSON.parse(localStorage.getItem("data"));
	
	const projectsArray = dataObj[projObj["group"]].projects;
	for(let i=0; i < projectsArray.length; i++) {
		if(projectsArray[i].name == projObj["project"]) {
			cba.instructArray = projectsArray[i].action;
		}
	}
	
	cba.defInstructArray = cba.instructArray.slice(0);
	sendInstruction();
}

chrome.tabs.onUpdated.addListener(function( tabId , info ) {
	if((tabId == cba.playingTabId)&&( info.status == "complete" )&&(cba.allowPlay==1)) {
		sendInstruction ();
		cba.update = false;
	}
});
