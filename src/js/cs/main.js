
require("./record");
require("./actions");

browser.runtime.onMessage.addListener((request, sender) => {
  if(request.action == "highlight") {
    return setHighlight(request.selector);
  }
  else if(request.action == "unHighlight") {
    return setHighlight(request.selector, false);
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
