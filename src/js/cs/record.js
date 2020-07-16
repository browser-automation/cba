const port = browser.runtime.connect({name: "recordPort"});

function findClosest(query)
{
  return this.closest(query);
}

function getActionDataValue(data, target)
{
  return typeof data === "function" ? data(target) : data;
}

function recordAction(target, actionsData)
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
 * The function that get css path of the DOM element
 */
function getPath(element) {
  const path = [];
  if (element.nodeType === Node.TEXT_NODE)
    element = element.parentElement;
  if (element.nodeType !== Node.ELEMENT_NODE)
    return false;

  while (element && element !== document.documentElement)
  {
    if (element.id) {
        path.unshift(`#${element.id}`);
        break;
    }
    else {
      let tagName = element.nodeName.toLowerCase();
      let sibling = element;
      let numberOfTypes = 1;
      while (sibling = sibling.previousElementSibling) {
        if (sibling.nodeName.toLowerCase() == tagName)
          numberOfTypes++;
      }
      if (numberOfTypes != 1)
        path.unshift(`${tagName}:nth-of-type(${numberOfTypes})`);
      else
        path.unshift(tagName);
    }
    element = element.parentElement;
  }
  return path.length ? path.join(" > ") : false;
}

/*
 * Function for sending event to background page
 * Data: the path to the object (selector) or redirectionURL
 * evType: Type of the event (click, change, redirect) 
 * newValue: newValue as example for chaged value
 */
function sendmsg(data, evType, newValue){
  port.postMessage({msgType: "RecordedEvent", "data": data, "type": evType, "value" : newValue});
}

document.addEventListener("click", actionRecorder);
document.addEventListener("change", actionRecorder);
