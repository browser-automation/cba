/*
 * This file is part of Chromium Browser Automation.
 * Copyright (C) 2020-present Manvel Saroyan
 * 
 * Chromium Browser Automation is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Chromium Browser Automation is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Chromium Browser Automation. If not, see
 * <http://www.gnu.org/licenses/>.
 */

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
  for (const {queries, type, input1, input2} of actionsData) {
    const closestTargets = queries.map(findClosest.bind(target)).filter(e => e);
    if (closestTargets.length) {
      const closestTarget = closestTargets[0];
      const inputs = [getActionDataValue(input1, closestTarget),
                      getActionDataValue(input2, closestTarget)];
      return sendmsg(type, inputs);
    }
  }
}

function actionRecorder({target, type})
{
  const clickActions = [{
    queries: ["button", "input[type='button']"],
    type: "click",
    input1: getPath,
    input2: ""
  },
  {
    queries: ["input[type=submit]", "input[type=image]"],
    type: "click-update",
    input1: getPath,
    input2: ""
  },
  {
    queries: ["a[href^='#']", "a[href='']"],
    type: "click",
    input1: getPath,
    input2: ""
  },
  {
    queries: ["a[href]"],
    type: "redirect",
    input1: (closestTarget) => closestTarget.getAttribute("href"),
    input2: ""
  }
  ];
  const changeActions = [{
    queries: ["input[type=text]", "input[type=password]", "textarea", "select"],
    type: "change",
    input1: getPath,
    input2: (closestTarget) => closestTarget.value
  },
  {
    queries: ["input[type=radio]", "input[type=checkbox]"],
    type: "check",
    input1: getPath,
    input2: ""
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
function sendmsg(type, inputs){
  port.postMessage({msgType: "RecordedEvent", type, inputs});
}

document.addEventListener("click", actionRecorder);
document.addEventListener("change", actionRecorder);
