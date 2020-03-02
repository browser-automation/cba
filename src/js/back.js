var allowRec = 0;  //variable that allow to start recording
var allowPlay = 0;
var pause = 0;
var playingProjectId;
var instructArray;
var defInstructArray;
var playingTabId = 0;
var instruction;
var selectedProjectName;
var selectedProjectId;
var lastEvType;
var lastFacebookLink;
var currentTab;
var update = false;
var projectRepeat = 1;
var clipboard = {};
var lastSelectedProjectId;
var selectedProjObj;


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
  console.assert(port.name == "recordPort");
  port.onMessage.addListener(function(msg) {
  	if(allowRec==1) {
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
				//groupProjArray.push(oldObj.action);
				console.log(groupProjArray);
				
				//TODO iterate here to see whether I have the project then add
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
						//project["parent"] = groupId;
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
	
	if(msg.evType == "facebook") { // special logic beacause of FB issue 
		chrome.tabs.getSelected(null ,function(tab) {
  			// Send a request to the content script.
  			currentTab = tab;
  			if(lastFacebookLink != currentTab.url) {
				console.log(lastFacebookLink);
				console.log(currentTab.url);
  				msg.data = currentTab.url;
  				msg.evType = "redirect";
  				pushRecord(msg);
  			//	msg.data = "";
  			//	msg.evType = "update";
  			//	pushRecord(generateUpdateEvent());
  				lastFacebookLink = currentTab.url;
  				return;
  			}
		});
  		return;
	}
	else if(msg.evType == "redirect"){
		
		pushRecord(msg);
	//	pushRecord(generateUpdateEvent());
		return;
	}
	if((lastEvType == "update") &&(msg.evType == "update")) {
		return;
	}
	lastEvType = msg.evType;
	
	pushRecord(msg);
}
//Registration.getInstance().validateForm();
function pushRecord(msg) {
	console.log(msg);
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var projectsArray = dataObj[selectedProjObj["group"]].projects;
	
	for(i=0;i<projectsArray.length;i++) {
		if(projectsArray[i].name == selectedProjObj["project"]) {
			projectsArray[i].action.push(msg);
		}
	}
	localStorage.setItem("data", JSON.stringify(dataObj));
	/*
	var record = JSON.parse(localStorage.getItem("data"));
     record[selectedProjectName].action.push(msg);
     localStorage.setItem("data", JSON.stringify(record));
     
     
     var anotherjson = JSON.parse(localStorage.getItem("data"));
     for (var i = 0; i < anotherjson[selectedProjectName].action.length; i++) { 
    	console.log(anotherjson[selectedProjectName].action[i]);
	}
	*/
}


function generateUpdateEvent() {
	return {msgType: "RecordedEvent", "data": '', "evType": 'update', "newValue" : ''};
}

function storeCurrentUrl() {
	chrome.tabs.getSelected(null ,function(tab) {
  			// Send a request to the content script.
  			pushRecord({msgType: "RecordedEvent", "data": tab.url, "evType": 'redirect', "newValue" : ''});
			lastFacebookLink = tab.url;
	});
}

/*
 * Function that calls after clicking on record button
 */
function recordButtonClick(projObj, projectId) {
	storeCurrentUrl();
	selectedProjObj = projObj;
	selectedProjectId = projectId;
	//localStorage.setItem(projectName, JSON.stringify({action: []}));
	allowRec = 1;
	chrome.browserAction.setBadgeText({"text":"rec"}); 
}

/*
 * Function that calls after clicking on Stop button
 */
function stopButtonClick() {
	allowRec = 0;
	allowPlay = 0;
	pause = 0;
	chrome.browserAction.setBadgeText({"text":""}); 
}

/*
 * Function that calls after clicking on Play button
 */
function playButtonClick(projObj, currProjectId, repeatVal) {
	if(pause == 1) {
		pause = 0;
		allowPlay = 1;
		sendInstruction ();
		return;
	}
	
	if(clipboard == null) {
		clipboard = {};
	}
	
	allowPlay = 1;
	//clipboard = {};
	projectRepeat = repeatVal;
	playingProjectId = currProjectId;
	update = false;
	selectedProjObj = projObj;
	var dataObj = JSON.parse(localStorage.getItem("data"));
	
	var projectsArray = dataObj[projObj["group"]].projects;
	for(i=0;i<projectsArray.length;i++) {
		if(projectsArray[i].name == projObj["project"]) {
			instructArray = projectsArray[i].action;
		}
	}
	
	defInstructArray = instructArray.slice(0);
	
//	instructArray = dataJSON[selectedProjectName].action;
//	console.log(instructJSON.action);
//	console.log(instructArray);
	sendInstruction ();
	
}

function sendInstruction () {
	console.log(projectRepeat);
	if(allowPlay == 0 ) {
		return;
	}
	if(instructArray.length > 0) {
	//	console.log(instruction);
		chrome.tabs.getSelected(null ,function(tab) {
			/*
			if(checkUpdate != null) {
				if(tab.status == "complete") {
					if(instructArray[0].evType == 'update') {
						console.log("splice unneeded update");
						instructArray.splice(0, 1);
					}
				}
			}
			*/
			if(tab == null) {
				console.log("playSoon");
				
				setTimeout("sendInstruction();",1000);
				return;
			}
			/*
			if((tab.status == "loading")&&((instructArray[0].evType != 'redirect')||(instructArray[0].evType != 'submit-click')||(instructArray[0].evType != 'update'))) {
				console.log("playSoon2");
				setTimeout("sendInstruction();",1000);
				return;
			}
			*/
			chrome.browserAction.setBadgeText({"text":"play"});
			instruction = instructArray.splice(0, 1);
			
			console.log(instruction);
			
  			// Send a request to the content script.
  			playingTabId = tab.id;
  			if((instruction[0].evType == 'redirect')||(instruction[0].evType == 'submit-click')) {
  				update = true;
  				//return;
  			}
  			else if(instruction[0].evType == 'update') {
  				update = true;
  				return;
  			}
  			else if(instruction[0].evType == 'timer') {
  				setTimeout("sendInstruction();", instruction[0].newValue);
  				return;
  			}
  			else if(instruction[0].evType == 'bg-function') {
  				bgFunctionParser(instruction[0].data);
  				return;
  			}
  			else if(instruction[0].evType == 'bg-inject') {
  				var sendBgInstruction = true;
  				eval(instruction[0].data);
  				if(sendBgInstruction == true) {
  					sendInstruction();
  				}
  				return;
  			}
  			else if(instruction[0].evType == 'pause') {
  				allowPlay = 0;
  				pause = 1;
  				chrome.browserAction.setBadgeText({"text":"||"});
  				return;
  			}
  			
  			chrome.tabs.sendRequest(tab.id, {"action": "play" ,"instruction": instruction[0], "clipboard": clipboard}, playResponse);
		});
	}
	else {
		if(projectRepeat > 1) {
			projectRepeat--;
			playButtonClick(selectedProjObj, playingProjectId, projectRepeat);
		}
		else {
			//alert("asdasd");
			allowPlay = 0;
			chrome.browserAction.setBadgeText({"text":""});
		}
	}
}

function  playResponse(response) {
	console.log("response");
	if(response == null) {
		console.log("play soon response");
		setTimeout("sendInstruction();",1000);
		return;
	}
	console.log(response);
	if(response.answere == "instructOK") {
		clipboard = response.clipboard;
		if (update == false) {
			sendInstruction ();
		}
	}
	/*
	else if (response.answere == "copy"){
		//alert(response.clipboard);
		clipboard = response.clipboard;
		sendInstruction ();
	}
	*/
}

chrome.tabs.onUpdated.addListener(function( tabId , info ) {
	if((tabId == playingTabId)&&( info.status == "complete" )&&(allowPlay==1)) {
		sendInstruction ();
		update = false;
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
		console.log(clipboardAttribute);
		placeholderValue = placeholderValue.replace(clipboardValue, getClipboardValue(clipboardAttribute));
		console.log(placeholderValue);
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

/*
localStorage.setItem("record1", JSON.stringify(defaultJSON));
localStorage.setItem("record2", JSON.stringify(defaultJSON));
localStorage.setItem("record3", JSON.stringify(defaultJSON));
localStorage.setItem("record4", JSON.stringify(defaultJSON));
localStorage.setItem("record5", JSON.stringify(defaultJSON));

var localStorageKeys = Object.keys(localStorage);
console.log(localStorageKeys);
*/


