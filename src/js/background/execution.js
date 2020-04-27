const readyFunctions = require("./bg_function");

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
          const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
					let sendBgInstruction = true;
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
			cba.playButtonClick(cba.selectedProjObj, cba.playingProjectId, cba.projectRepeat);
		}
		else {
			cba.allowPlay = 0;
			chrome.browserAction.setBadgeText({"text":""});
		}
	}
}

function playResponse(response) {
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

async function bgFunctionParser(value){
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
  sendInstruction();
}

function getClipboardValue(attr) {
	return cba.clipboard[attr];
}

module.exports = {sendInstruction};
