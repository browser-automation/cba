let clipboard = {};

browser.runtime.onMessage.addListener((request, sender) => {
  if(request.action == "execute") {
    clipboard = request.clipboard;
    if(request.instruction.evType == "timer") {
      setTimeout(() => {
        return Promise.resolve({answere: "instructOK", clipboard: clipboard});
      }, request.instruction.newValue);
    }
    else {
      return executeAction(request.instruction, request);
    }
  }
});

function executeAction(recordRow, request)
{
  const {evType, data, newValue} = recordRow;
  switch (evType) {
    case "change": {
      const targetElement = document.querySelector(data);
      targetElement.focus();
      targetElement.value = placeholders(newValue);
      const event = new Event("change");
      targetElement.dispatchEvent(event, { "bubbles": true });
      break;
    }
    case "submit-click":
    case "click": {
      document.querySelector(data).click();
      break;
    }
    case "check": {
      document.querySelector(data).checked = true;
      break;
    }
    case "redirect": {
      window.location = data;
      break;
    }
    case "inject": {
      const clipboardId = "grabClipboardHere";
      const script = document.createElement('script');
      script.setAttribute("type", "application/javascript");
      script.textContent =  `
        var clipboard=${JSON.stringify(request.clipboard)};
        ${data};
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
      eval(data);
      break;
    }
    case "copy": {
      const targetElement = document.querySelector(data);
      if(targetElement) {
        clipboard["copy"] = targetElement.innerHTML;
      }
      break;
    }
    default:
      break;
  }
  return Promise.resolve({answere: "instructOK", clipboard: clipboard});
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
