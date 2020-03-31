
const port = chrome.extension.connect({name: "recordPort"});
let currentResponse;
let clipboard = {};

/*
 * Event of clicking on Hyperlink
 */
$("a").live('click', function(obj) {
		if(($(this).attr('href')=="")||($(this).attr('href')=="#")||($(this).attr('href')==null)) {
			sendmsg(getPath(this), "click",'');
		}
		else {
			sendmsg($(this).attr('href'), "redirect", '');
		}
});

/*
 * Event of clicking on input type submit and button
 */
$("input[type=submit], input[type=image]").live('click', function(obj) {
	sendmsg(getPath(this), "submit-click",'');
});
$(":button").live('click', function(obj) {
	sendmsg(getPath(this), "click",'');
});

/*
 * Event of changing textbox, passwordbox, textarea, selectbox
 */
$("input[type=text], input[type=password], textarea, select").live('change', function(obj) {
	sendmsg(getPath(this), "change", $(this).val());
});

/*
 * Event of checking radio button
 */
$("input[type=radio], input[type=checkbox]").live('change', function(obj) {
	sendmsg(getPath(this), "check", '');
	//TODO Find way to determine which radio button were selected nth
	//sendmsg(getPath(this), "change", $(this).val());
});

/* 
 * The function that get full path to the object
 */
function getPath(obj) {
	var rightArrowParents = [];
    $(obj).parents().not('html').each(function() {
        var entry = this.tagName.toLowerCase();
        if (this.className) {
            entry += "." + this.className.replace(/ /g, '.');
        }
        else if(this.id) {
        	entry += "#"+this.id;
        	rightArrowParents.push(entry);
        	//pathReverse(rightArrowParents, obj);
        	return false;
        }
        rightArrowParents.push(entry);
    });
    return pathReverse(rightArrowParents, obj);
}

function pathReverse(rightArrowParents, obj) {
	rightArrowParents.reverse();
    var path = rightArrowParents.join(" ")+" "+obj.tagName;  // finalizing the path and adding tagname to it
    if(obj.className!="") { // Adding classname if object has one
    	path = path+"."+obj.className.replace(/ /g, ".");
    }
    if(obj.id!="") {  // adding id if object has one
    	path = "#"+obj.id;
    }
    return path;
}

/*
 * Function for sending event to background page
 * Data: the path to the object (selector) or redirectionURL
 * evType: Type of the event (click, change, redirect) 
 * newValue: newValue as example for chaged value
 */
function sendmsg(data, evType, newValue){
	port.postMessage({msgType: "RecordedEvent", "data": data, "evType": evType, "newValue" : newValue});
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
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
		var script = document.createElement('script');
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
