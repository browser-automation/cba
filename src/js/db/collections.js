const dbName = "collections";

async function load() {
  const {collections} = await browser.storage.local.get(dbName);
  return collections;
}

function saveState(items) {
  const collections = items;
  return browser.storage.local.set({collections});
}

module.exports = {load, saveState};
