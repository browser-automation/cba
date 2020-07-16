const dbName = "collections";

async function load() {
  const {collections} = await browser.storage.local.get(dbName);
  return collections;
}

function saveState(items) {
  const collections = items;
  return browser.storage.local.set({collections});
}

async function addAction(groupId, projectId, action) {
  const {collections} = await browser.storage.local.get(dbName);
  const [group] = collections.filter(({id}) => id === groupId);
  if (!group)
    return false;

  const [project] = group.subItems.filter(({id}) => id === projectId);
  if (!project || !project.actions)
    return false;

  const {actions} = project;
  actions.push(action);
  return saveState(collections);
}

module.exports = {load, saveState, addAction};
