const readyFunctions = require("./bg_function");
require("./analytics");

class CBA {
  constructor() {
		// TODO: keep backwards compatibility with using those on top level when running bg-inject.
    this.allowRec = 0;
		this.allowPlay = 0;
		this.pause = 0;
		this.playingProjectId;
		this.instructArray;
		this.defInstructArray;
		this.playingTabId = 0;
		this.instruction;
		this.selectedProjectName;
		this.selectedProjectId;
		this.lastEvType;
		this.currentTab;
		this.update = false;
		this.projectRepeat = 1;
		this.lastSelectedProjectId;
		this.selectedProjObj;
	}
}

window.cba = new CBA();
//TODO: Use message passing to run the functions
window.cba.playButtonClick = playButtonClick;
window.cba.recordButtonClick = recordButtonClick;
window.cba.stopButtonClick = stopButtonClick;
window.sendInstruction = sendInstruction;

isFirstLoad();

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
	if(localStorage.getItem("data") == null) {
		var dataObj = {};
		var group = {};
		var projectsArray = new Array();
		
		group["name"] = "group0";
		group["level"] = "0";
		group["parent"] = "";
		group["isLeaf"] = false;
		group["expanded"] = false;
		group["loaded"] = true;
		
		var project = {};
		project["action"] = new Array();
		project["name"] = "project";
		project["level"] = "1";
		//project["parent"] = "1";
		project["isLeaf"] = true;
		project["expanded"] = false;
		project["loaded"] = true;
		projectsArray.push(project);
		
		group["projects"] = projectsArray;
		dataObj["group0"] = group;
		localStorage.setItem("data", JSON.stringify(dataObj));
		
		var dataObj = JSON.parse(localStorage.getItem("data"));
		var groupProjArray = dataObj["group0"].projects;
		
		
		
		var exportArray = [];
		var localStorageKeys = Object.keys(localStorage);
		for(var i=0;i<localStorageKeys.length;i++) {
			var oldObj = JSON.parse(localStorage.getItem(localStorageKeys[i]));
			if(oldObj.action != null) {
				for(i=0;i<100;i++) {
					var allowProject = true;
					for(j=0;j<groupProjArray.length;j++) {
						if(groupProjArray[j].name == localStorageKeys[i]) {
							allowProject = false;
						}
					}
					if(allowProject) {
						var project = {};
						for(h=0;h<oldObj.action.length;h++){
							if(oldObj.action[h].evType == "inject") {
								oldObj.action[h].evType = "cs-inject";
							}
							
						}
						project["action"] = oldObj.action;
						project["name"] = localStorageKeys[i];
						project["level"] = "1";
						project["isLeaf"] = true;
						project["expanded"] = false;
						project["loaded"] = true;
						groupProjArray.push(project);
						
						break;
					}
					else {
						continue;
					}
				}
				groupProjArray.sort();
			}
		}
		localStorage.setItem("data", JSON.stringify(dataObj));
	}
}

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
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var projectsArray = dataObj[cba.selectedProjObj["group"]].projects;
	
	for(i=0;i<projectsArray.length;i++) {
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
		sendInstruction ();
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
	var dataObj = JSON.parse(localStorage.getItem("data"));
	
	var projectsArray = dataObj[projObj["group"]].projects;
	for(i=0;i<projectsArray.length;i++) {
		if(projectsArray[i].name == projObj["project"]) {
			cba.instructArray = projectsArray[i].action;
		}
	}
	
	cba.defInstructArray = cba.instructArray.slice(0);
	sendInstruction ();
}

function sendInstruction () {
	if(cba.allowPlay == 0 ) {
		return;
	}
	if(cba.instructArray.length > 0) {
		chrome.tabs.getSelected(null ,function(tab) {
			if(tab == null) {
				setTimeout(sendInstruction,1000);
				return;
			}
			chrome.browserAction.setBadgeText({"text":"play"});
			cba.instruction = cba.instructArray.splice(0, 1);
			
  			// Send a request to the content script.
  			cba.playingTabId = tab.id;
  			if((cba.instruction[0].evType == 'redirect')||(cba.instruction[0].evType == 'submit-click')) {
  				cba.update = true;
  			}
  			else if(cba.instruction[0].evType == 'update') {
  				cba.update = true;
  				return;
  			}
  			else if(cba.instruction[0].evType == 'timer') {
  				setTimeout(sendInstruction, cba.instruction[0].newValue);
  				return;
  			}
  			else if(cba.instruction[0].evType == 'bg-function') {
  				bgFunctionParser(cba.instruction[0].data);
  				return;
  			}
  			else if(cba.instruction[0].evType == 'bg-inject') {
					var sendBgInstruction = true;
					// see -> https://github.com/browser-automation/cba/issues/13
					let clipboard = cba.clipboard;
					eval(cba.instruction[0].data);
					if (clipboard !== cba.clipboard)
						cba.clipboard = clipboard;
  				if(sendBgInstruction == true) {
  					sendInstruction();
  				}
  				return;
  			}
  			else if(cba.instruction[0].evType == 'pause') {
  				cba.allowPlay = 0;
  				cba.pause = 1;
  				chrome.browserAction.setBadgeText({"text":"||"});
  				return;
  			}
  			
  			chrome.tabs.sendRequest(tab.id, {"action": "play" ,"instruction": cba.instruction[0], "clipboard": cba.clipboard}, playResponse);
		});
	}
	else {
		if(cba.projectRepeat > 1) {
			cba.projectRepeat--;
			playButtonClick(cba.selectedProjObj, cba.playingProjectId, cba.projectRepeat);
		}
		else {
			cba.allowPlay = 0;
			chrome.browserAction.setBadgeText({"text":""});
		}
	}
}

function  playResponse(response) {
	if(response == null) {
		setTimeout(sendInstruction,1000);
		return;
	}
	if(response.answere == "instructOK") {
		cba.clipboard = response.clipboard;
		if (cba.update == false) {
			sendInstruction();
		}
	}
}

chrome.tabs.onUpdated.addListener(function( tabId , info ) {
	if((tabId == cba.playingTabId)&&( info.status == "complete" )&&(cba.allowPlay==1)) {
		sendInstruction ();
		cba.update = false;
	}
});

function bgFunctionParser(value){
	const methodPattern = /<\$function=(\S*)>/;
	const attributes = [];
	const method = methodPattern.exec(value);
	if(!method)
		return false;

	const functionName = method[1];
	const attributePattern = /<\$attr=([^>]*)>/g;
	const clipboardPattern = /clipboard\[["'](.*)["']\]/;
	while (attribute = attributePattern.exec(value)) {
		const clipboard = clipboardPattern.exec(attribute[1]);
		if (clipboard)
			attributes.push(getClipboardValue(clipboard[1]));
		else
			attributes.push(attribute[1]);
	}

	if(attributes.length) {
		readyFunctions[functionName](...attributes);
	}
}

function getClipboardValue(attr) {
	return cba.clipboard[attr];
}
