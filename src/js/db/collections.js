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

async function importProjects(projects, groupText)
{
  const {collections} = await browser.storage.local.get(dbName);
  let group = null;
  if (!groupText)
  {
    const text = getNextText(collections, "group");
    let num = 0;
    while (hasId(collections, `${text}_${++num}`)) {}
    const id = `${text}_${num}`;
    console.log(id);
    group = createGroupObj(text, id);
    collections.push(group);
  }
  else
  {
    group = collections.filter(({text}) => text === groupText)[0];
  }

  for (const project of projects)
  {
    const {text, id} = project;
    if (hasTextWithValue(group.subItems, text))
      project.text = getNextText(group.subItems, `${text}_`);
    if (!id || hasId(collections, id))
    {
      let num = 0;
      while (hasId(collections, `${text}_${++num}`)) {}
      project.id = `${text}_${num}`;
    }
    group.subItems.push(project);
  }
  return saveState(collections);
}

function createGroupObj(groupText, groupId) {
  return {
    id: groupId,
    text: groupText,
    type: "group",
    expanded: false,
    subItems: []
  }
}

function hasTextWithValue(items, value)
{
  return items.filter(({text}) => text === value).length > 0;
}

function getNextText(items, prefix) {
  if (!items || !items.length)
    return null;

  let num = 1;
  while (items.filter(({text}) => text === `${prefix}${num}`).length > 0)
    num++
  return `${prefix}${num}`;
}

function hasId(collections, currentId)
{
  for (const {id, subItems} of collections)
  {
    if (id === currentId)
      return true;
    if (subItems)
    {
      if (subItems.filter(({id}) => id === currentId).length > 0)
        return true;
    }
  }
  return false;
}

module.exports = {load, saveState, importProjects, addAction};
