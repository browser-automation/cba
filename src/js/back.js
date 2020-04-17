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

const cba = new CBA();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-32260034-1']);
_gaq.push(['_trackPageview']);
	
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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


function generateUpdateEvent() {
	return {msgType: "RecordedEvent", "data": '', "evType": 'update', "newValue" : ''};
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
				setTimeout("sendInstruction();",1000);
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
  				setTimeout("sendInstruction();", cba.instruction[0].newValue);
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
		setTimeout("sendInstruction();",1000);
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
	var funcPatt= /<\$function=.*?>/;
	var attrPatt= /<\$attr=.*?>/g;
	var funcPlaceholder = funcPatt.test(value);
	var attrs = new Array();
	if(funcPlaceholder == true) {
		var funcName = getPlaceHolder(funcPatt, value);
		var attrPlaceHolders = value.match(attrPatt);
		for (var i=0; i < attrPlaceHolders.length; i++) {
			attrs.push(getPlaceHolder(/<\$attr=.*?>/, attrPlaceHolders[i]));
		}
		
		if(attrs.length == 1) {
			window[funcName](attrs[0]);
		}
		else if(attrs.length == 2) {
			window[funcName](attrs[0], attrs[1]);
		}
		else if(attrs.length == 3) {
			window[funcName](attrs[0], attrs[1], attrs[2]);
		}
		
	}
}

function getPlaceHolder(pattern, value) {
	var placeholder = pattern.exec(value)[0];
	var lastIndex = placeholder.indexOf(">");
	var firstIndex = placeholder.indexOf("=");
	var placeholderValue = placeholder.slice(firstIndex+1, lastIndex);
	var clipboardPatt= /clipboard\[.*\]/;
	var clipboardValue = placeholderValue.match(clipboardPatt);
	if(clipboardValue != null) {
		clipboardValue = clipboardValue[0];
		var clipboardValueFirstIndex = clipboardValue.indexOf("[");
		var clipboardValueLastIndex = clipboardValue.indexOf("]");
		var clipboardAttribute = clipboardValue.slice(clipboardValueFirstIndex+2, clipboardValueLastIndex-1);
		placeholderValue = placeholderValue.replace(clipboardValue, getClipboardValue(clipboardAttribute));
	}
	return placeholderValue;
}

var defaultJSON = 
{ action: [
{ data: "body div div div div.topImagePlace div.quickReg div form table.regFormTable tbody tr td div SELECT#mygender",
evType: "change",
msgType: "RecordedEvent",
newValue: "1"
},
{
data: "body div div div div.topImagePlace div.quickReg div form table.regFormTable tbody tr td div SELECT#search",
evType: "change",
msgType: "RecordedEvent",
newValue: "2"
},
{
data: "body div div div div.topImagePlace div.quickReg div form table.regFormTable tbody tr td INPUT.textbox#user_name",
evType: "change",
msgType: "RecordedEvent",
newValue: "dfsgfdsgdfsg"
},
{
data: "body div div div div.topImagePlace div.quickReg div form table.regFormTable tbody tr td INPUT.textbox#password",
evType: "change",
msgType: "RecordedEvent",
newValue: "sdfgdfsgdfsg"
}
]
};
