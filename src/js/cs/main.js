
require("./record");
let clipboard = {};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	const currentResponse = sendResponse;
	
	if(request.action == "play") {
		clipboard = request.clipboard;
		if(request.instruction.evType == "timer") {
			setTimeout(() => {
				currentResponse({answere: "instructOK", clipboard: clipboard})
			}, request.instruction.newValue);
		}
		else {
			recordExecution(request.instruction, sendResponse, request);
		}
	}
	else if(request.action == "highlight") {
		setHighlight(request.selector);
	}
	else if(request.action == "unHighlight") {
		setHighlight(request.selector, false);
	}
});

function setHighlight(query, highlight = true)
{
	const target = document.querySelector(query);
	if (target) {
		target.style["outline-style"] = highlight ? "solid" : "";
		target.style["outline-color"] = highlight ? "red" : "";
		target.style["outline-width"] = highlight ? "1px" : "";
	}
}

/*
 * Function for managing record type and executing some script 
 */
function recordExecution(recordRow, sendResponse, request){
	if(recordRow.evType == "change") {
		const targetElement = document.querySelector(recordRow.data);
		targetElement.focus();
		targetElement.value = placeholders(recordRow.newValue);
		const event = new Event("change");
		targetElement.dispatchEvent(event, { "bubbles": true });
	}
	else if ((recordRow.evType == "click")||(recordRow.evType == "submit-click")) {
		document.querySelector(recordRow.data).click();
	}
	else if (recordRow.evType == "check") {
		document.querySelector(recordRow.data).checked = true;
	}
	else if (recordRow.evType == "redirect") {
		sendResponse({answere: "instructOK", clipboard: clipboard});
		window.location = recordRow.data;
		return;
	}
	else if (recordRow.evType == "inject") {
		const clipboardId = "grabClipboardHere";
    const script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent =  `
			var clipboard=${JSON.stringify(request.clipboard)};
			${recordRow.data};
			var newdiv = document.createElement('div');
			if(document.getElementById('${clipboardId}')!= null) {
				document.getElementById('${clipboardId}').textContent = JSON.stringify(clipboard);
			}
			else {
				newdiv.setAttribute('id', '${clipboardId}');
				newdiv.textContent = JSON.stringify(clipboard);
				document.body.appendChild(newdiv);
			}
			document.getElementById('${clipboardId}').style.display = 'none';`;
    document.documentElement.appendChild(script); // run the script
		document.documentElement.removeChild(script); // clean up
		const injectedClipboard = document.querySelector(`#${clipboardId}`);
    if(injectedClipboard) {
      clipboard = JSON.parse(injectedClipboard.textContent);
    }
	}
	else if (recordRow.evType == "cs-inject") {
		eval(recordRow.data);
	}
	else if (recordRow.evType == "copy") {
		const targetElement = document.querySelector(recordRow.data);
		if(targetElement) {
			clipboard["copy"] = targetElement.innerHTML;
		}
	}
	sendResponse({answere: "instructOK", clipboard: clipboard});
}

function placeholders(checkValue) {
	const patt= /<\$unique=.*?>/;
	const pastPatt = /<\$past>/;
	const clipPatt = /<\$clipboard=.*?>/;
	if(patt.test(checkValue)) {
		const uniquePlaceholder = patt.exec(checkValue)[0];
		const lastIndex = uniquePlaceholder.indexOf(">");
		const firstIndex = uniquePlaceholder.indexOf("=");
    const length = uniquePlaceholder.slice(firstIndex+1, lastIndex);
    const currentTime = new Date().getTime() + '';
    const unique = currentTime.substring(currentTime.length - length);
		return checkValue.replace(patt, unique);
	}
	else if(pastPatt.test(checkValue)) {
		return clipboard["copy"];
	}
	else if(clipPatt.test(checkValue)) {
		const clipPlaceholder = clipPatt.exec(checkValue)[0];
		const lastIndex = clipPlaceholder.indexOf(">");
		const firstIndex = clipPlaceholder.indexOf("=");
		const clipAttr = clipPlaceholder.slice(firstIndex+1, lastIndex);
		return checkValue.replace(clipPlaceholder, clipboard[clipAttr]);
	}
	else {
		return checkValue;
	}
}
