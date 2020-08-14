const name = "customActions";

async function load() {
  const result = await browser.storage.local.get(name);
  return result[name];
}

function saveState(items) {
  const result = {};
  result[name] = items;
  return browser.storage.local.set(result);
}

const predefined = [
  {
    data: {
      type: "timer",
      inputs: ["1000", "Please enter the time in milliseconds"],
      info: "Please enter the time in milliseconds"
    },
    text: "Timer"
  },
  {
    data: {
      type: "update",
      inputs: ["this event will let the script wait for page update", ""],
      info: "this event will let the script wait for page update",
    },
    text: "Update"
  },
  {
    data: {
      type: "bg-function",
      inputs: ["<$function=removeCookie>\n<$attr=.*>", "use regular expressions to filter domains"],
      info: "use regular expressions to filter domains"
    },
    text: "Clear cookies"
  },
  {
    data: {
      type: "bg-function",
      inputs: ['<$function=saveToClipboard>\n<$attr={"name": "value"}>', "Write to clipboard Object to access data later. Use Json in the attr"],
      info: "Write to clipboard Object to access data later. Use Json in the attr."
    },
    text: "Clipboard"
  }
];

module.exports = {load, saveState, name, predefined};
