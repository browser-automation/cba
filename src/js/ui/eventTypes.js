const eventTypes = ["inject", "cs-inject", "bg-inject", "bg-function", "change",
                    "check", "click", "submit-click", "update", "timer",
                    "redirect", "copy", "pause"];

function init(query) {
  const selectElement = document.querySelector(query);
  if (!selectElement)
    return false;
  for (const eventType of eventTypes) {
    const option = document.createElement("option");
    option.value = eventType;
    option.textContent = eventType;
    selectElement.appendChild(option);
  }
  return selectElement;
}

module.exports = {init};
