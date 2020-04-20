function removeCookie(pattern) {
	chrome.cookies.getAll({}, function(cookies) { 
		for (var i in cookies) {
			var patt= new RegExp(pattern);
			if(patt.test(cookies[i].domain)) {
	 			removeDomainCookie(cookies[i]);
			}
		}
		sendInstruction();
	});
}

function saveToClipboard(jsonData) {
	var jsonParsed = JSON.parse(jsonData);
	for(var key in jsonParsed){
		cba.clipboard[key] = jsonParsed[key];
	}
	sendInstruction();
}

function removeDomainCookie(cookie) {
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path; 
  chrome.cookies.remove({"url": url, "name": cookie.name}); 
}

function panelCreation(url) {
	if (url!=null) {
		chrome.windows.create({ url: url, width: 600, height: 600, type: "panel" }, function(){
			sendInstruction();
		});
	}
}

function windowCreation(url) {
	if (url!=null) {
		chrome.windows.create({ url: url}, function(){
			sendInstruction();
		});
	}
}

function removeCurrentWindow() {
	chrome.windows.getCurrent(function(window) {
		chrome.windows.remove(window.id, function(){
			setTimeout("sendInstruction();",500);
		});
	});
}

function reloadCurrentTab(){
	chrome.tabs.getSelected(null ,function(tab) {
		chrome.tabs.reload(tab.id, function(){
			sendInstruction();
		});
	});
}

function reloadCurrentTab(){
	chrome.tabs.getSelected(null ,function(tab) {
		chrome.tabs.reload(tab.id, function(){
			sendInstruction();
		});
	});
}

function actionToPlay(actionInd) {
	cba.instructArray = cba.defInstructArray.slice(actionInd);
}


module.exports = {removeCookie, saveToClipboard, removeDomainCookie,
									panelCreation, windowCreation,
									removeCurrentWindow, reloadCurrentTab, actionToPlay};
