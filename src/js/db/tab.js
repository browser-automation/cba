const dbName = "tab";

async function load() {
  const {tab} = await browser.storage.local.get(dbName);
  return tab;
}

function saveState(id) {
  const tab = id;
  return browser.storage.local.set({tab});
}

module.exports = {load, saveState};
