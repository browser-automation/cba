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

browser.runtime.onMessage.addListener((request, sender) => {
  if(request.action == "executeAction") {
    clipboard = request.clipboard;
    return executeAction(request.instruction, request);
  }
});

async function executeAction(recordRow, request)
{
  const {type, inputs} = recordRow;
  const [input1, input2] = inputs;
  switch (type) {
    case "change": {
      const targetElement = document.querySelector(input1);
      targetElement.focus();
      targetElement.value = placeholders(input2);
      const event = new Event("change");
      targetElement.dispatchEvent(event, { "bubbles": true });
      break;
    }
    case "click-update":
    case "click": {
      const targetElement = document.querySelector(input1);
      const options = { "bubbles": true };
      targetElement.dispatchEvent(new MouseEvent("mousedown"), options);
      targetElement.click();
      targetElement.dispatchEvent(new MouseEvent("mouseup"), options);
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
    case "inject": {
      const clipboardId = "grabClipboardHere";
      const script = document.createElement('script');
      script.setAttribute("type", "application/javascript");
      script.textContent =  `
        var clipboard=${JSON.stringify(request.clipboard)};
        ${input1};
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
      break;
    }
    case "cs-inject": {
      await eval(`(async () => {${input1}})()`);
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
