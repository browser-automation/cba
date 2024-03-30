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

let clipboard = {};

browser.runtime.onMessage.addListener((request) => {
  if(request.action == "executeAction") {
    clipboard = request.clipboard;
    try {
      return executeAction(request.instruction, request);
    }
    catch(e) {
      // We want to continue playing project when action has error.
      return Promise.resolve({answere: "instructOK", clipboard});
    }
  }
});

async function executeAction(recordRow)
{
  const {type, inputs} = recordRow;
  const [input1, input2] = inputs;
  switch (type) {
    case "change": {
      const targetElement = document.querySelector(input1);
      targetElement.focus();
      const eventOptions = {"bubbles": true};
      const editableParent = targetElement.closest('[contenteditable="true"]');
      if (editableParent)
      {
        targetElement.innerHTML = placeholders(input2);
        const event = new Event("input");
        targetElement.dispatchEvent(event, eventOptions);
      }
      else
      {
        targetElement.value = placeholders(input2);
        const event = new Event("change");
        targetElement.dispatchEvent(event, eventOptions);
      }
      break;
    }
    case "click-update":
    case "click": {
      const targetElement = document.querySelector(input1);
      const options = { "bubbles": true };
      targetElement.dispatchEvent(new MouseEvent("pointerdown"), options);
      targetElement.dispatchEvent(new MouseEvent("mousedown"), options);
      targetElement.focus();
      targetElement.click();
      targetElement.dispatchEvent(new MouseEvent("mouseup"), options);
      targetElement.dispatchEvent(new MouseEvent("pointerup"), options);
      break;
    }
    case "check": {
      document.querySelector(input1).checked = true;
      break;
    }
    case "redirect": {
      window.location = input1;
      break;
    }
    case "copy": {
      const targetElement = document.querySelector(input1);
      if(targetElement) {
        clipboard["copy"] = targetElement.textContent;
      }
      break;
    }
    case "copy-html": {
      const targetElement = document.querySelector(input1);
      if(targetElement) {
        clipboard["copy"] = targetElement.innerHTML;
      }
      break;
    }
    default:
      break;
  }
  return Promise.resolve({answere: "instructOK", clipboard});
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
