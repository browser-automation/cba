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

module.exports = {load, saveState, name};
