const readyFunctions = require("./bg_function");

function sendInstruction() {
	if(cba.allowPlay == 0 ) {
		return;
	}
	if(cba.instructArray.length) {
		chrome.tabs.getSelected(null ,function(tab) {
			if(!tab) {
				setTimeout(sendInstruction, 1000);
				return;
			}
			chrome.browserAction.setBadgeText({"text":"play"});
			const [instruction] = cba.instructArray.splice(0, 1);
			const {evType, data} = instruction;
			// Send a request to content script.
			cba.playingTabId = tab.id;  // TODO: Do we need this?

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
					setTimeout(sendInstruction, instruction.newValue);
					break;
				}
				case "bg-function": {
					bgFunctionParser(data);
					break;
				}
				case "bg-inject": {
					const actionToPlay = (actionInd) => cba.instructArray = cba.defInstructArray.slice(actionInd);
					let sendBgInstruction = true;
					// see -> https://github.com/browser-automation/cba/issues/13
          let clipboard = cba.clipboard;
          eval(data);
					if (clipboard !== cba.clipboard)
						cba.clipboard = clipboard;
  				if(sendBgInstruction == true) {
  					sendInstruction();
  				}
					break;
				}
				case "pause": {
					cba.allowPlay = 0;
  				cba.pause = 1;
  				chrome.browserAction.setBadgeText({"text":"||"});
					break;
				}
				default: {
					messageContentScript(instruction, cba.clipboard);
					break;
				}
			}
		});
	}
	else if(cba.projectRepeat > 1) {
		cba.projectRepeat--;
		cba.playButtonClick(cba.selectedProjObj, cba.playingProjectId, cba.projectRepeat);
	}
	else {
		cba.allowPlay = 0;
		chrome.browserAction.setBadgeText({"text": ""});
	}
}

function messageContentScript(instruction, clipboard)
{
	const options = {"action": "play" ,instruction, clipboard};
	chrome.tabs.sendRequest(cba.playingTabId, options, playResponse);
}

function playResponse(response) {
	if(response == null) {
		setTimeout(sendInstruction, 1000);
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
