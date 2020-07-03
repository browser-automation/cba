const dbName = "predefinedActions";

async function load() {
  const {predefinedActions} = await browser.storage.local.get(dbName);
  return predefinedActions;
}

function saveState(items) {
  const predefinedActions = items;
  return browser.storage.local.set({predefinedActions});
}

module.exports = {load, saveState};
