
require("./record");
let currentResponse;
let clipboard = {};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  console.log("here");
	currentResponse = sendResponse;
	if(request.action == "play") {
		clipboard = request.clipboard;
		if(request.instruction.evType == "timer") {
			setTimeout("timerOkResponse()", request.instruction.newValue);
			return;
		}
		recordExecution(request.instruction, sendResponse, request);
	}
	else if(request.action == "highlight") {
		if($(request.selector).length != 0) {
			$(request.selector).css("outline", "1px solid red");
		}
	}
	else if(request.action == "unHighlight") {
		if($(request.selector).length != 0) {
			$(request.selector).css("outline", "");
		}
	}
});

function timerOkResponse() {
	currentResponse({answere: "instructOK", clipboard: clipboard});
}

/*
 * Function for managing record type and executing some script 
 */
function recordExecution(recordRow, sendResponse, request){
	if(recordRow.evType == "change") {
		$(recordRow.data).focus();
		$(recordRow.data).val(uniquePlaceholder(recordRow.newValue));
		$(recordRow.data).change();
	}
	else if ((recordRow.evType == "click")||(recordRow.evType == "submit-click")) {
		$(recordRow.data).click();
	}
	else if (recordRow.evType == "check") {
		$(recordRow.data).attr('checked', true);
	}
	else if (recordRow.evType == "redirect") {
		sendResponse({answere: "instructOK", clipboard: clipboard});
		window.location = recordRow.data;
		return;
	}
	else if (recordRow.evType == "inject") {
    const script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = recordRow.data;
    script.textContent = "var clipboard="+JSON.stringify(request.clipboard)+"; "+script.textContent;
    script.textContent += " var newdiv = document.createElement('div'); if(document.getElementById('grabClipboardHere')!= null) {document.getElementById('grabClipboardHere').textContent = JSON.stringify(clipboard);} else { newdiv.setAttribute('id', 'grabClipboardHere'); newdiv.textContent = JSON.stringify(clipboard); document.body.appendChild(newdiv)} document.getElementById('grabClipboardHere').style.display = 'none';";
    document.documentElement.appendChild(script); // run the script
    document.documentElement.removeChild(script); // clean up
    if(($("#grabClipboardHere").html() != "null")&&($("#grabClipboardHere").html()!=undefined)&&($("#grabClipboardHere").html()!="{} ")&&($("#grabClipboardHere").html()!="{}")) {
      clipboard = JSON.parse($("#grabClipboardHere").html());
    }
	}
	else if (recordRow.evType == "cs-inject") {
		eval(recordRow.data);
	}
	else if (recordRow.evType == "copy") {
		if($(recordRow.data).html()!=null) {
			clipboard["copy"] = $(recordRow.data).html();
		}
	}
	sendResponse({answere: "instructOK", clipboard: clipboard});
}

function uniquePlaceholder(checkValue) {
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
