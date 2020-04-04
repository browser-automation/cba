const port = chrome.extension.connect({name: "recordPort"});

function findClosest(query)
{
	return this.closest(query);
}

function getActionDataValue(data, target)
{
	return typeof data === "function" ? data(target) : data;
}

function recordAction(target,actionsData)
{
	for (const {queries, action, data, newValue} of actionsData) {
		const closestTargets = queries.map(findClosest.bind(target)).filter(e => e);
		if (closestTargets.length) {
			const closestTarget = closestTargets[0];
			return sendmsg(getActionDataValue(data, closestTarget),
										 action,
										 getActionDataValue(newValue, closestTarget));
		}
	}
}

function actionRecorder({target, type})
{
	const clickActions = [{
		queries: ["button", "input[type='button']"],
		action: "click",
		data: getPath,
		newValue: ""
	},
	{
		queries: ["input[type=submit]", "input[type=image]"],
		action: "submit-click",
		data: getPath,
		newValue: ""
	},
	{
		queries: ["a[href^='#']", "a[href='']"],
		action: "click",
		data: getPath,
		newValue: ""
	},
	{
		queries: ["a[href]"],
		action: "redirect",
		data: (closestTarget) => closestTarget.getAttribute("href"),
		newValue: ""
	}
	];
	const changeActions = [{
		queries: ["input[type=text]", "input[type=password]", "textarea", "select"],
		action: "change",
		data: getPath,
		newValue: (closestTarget) => closestTarget.value
	},
	{
		queries: ["input[type=radio]", "input[type=checkbox]"],
		action: "check",
		data: getPath,
		newValue: ""
	}];

	if (type === "click")
		recordAction(target, clickActions);
	if(type === "change")
		recordAction(target, changeActions);
}

/* 
 * The function that get full path to the object
 */
function getPath(obj) {
	const rightArrowParents = [];
    $(obj).parents().not('html').each(function() {
        let entry = this.tagName.toLowerCase();
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
  let path = rightArrowParents.join(" ")+" "+obj.tagName;  // finalizing the path and adding tagname to it
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

document.addEventListener("click", actionRecorder);
document.addEventListener("change", actionRecorder);
