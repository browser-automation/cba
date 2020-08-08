const name = "projects";

async function load() {
  const result = await browser.storage.local.get(name);
  return result[name];
}

function saveState(items) {
  const result = {};
  result[name] = items.map(removeEditable);
  return browser.storage.local.set(result);
}

function removeEditable(item) {
  if (item.editable)
    delete item.editable;
  if (item.subItems)
    item.subItems = item.subItems.map(removeEditable);
  return item;
}

async function addAction(groupId, subItemId, action) {
  const groups = await load();
  const [group] = groups.filter(({id}) => id === groupId);
  if (!group)
    return false;

  const [subItem] = group.subItems.filter(({id}) => id === subItemId);
  if (!subItem || !subItem.actions)
    return false;

  const {actions} = subItem;
  actions.push(action);
  return saveState(groups);
}

async function importProjects(subItems, groupText)
{
  const groups = await load(name);
  let group = null;
  if (!groupText)
  {
    const text = getNextText(groups, "group");
    let num = 0;
    while (hasId(groups, `${text}_${++num}`)) {}
    const id = `${text}_${num}`;
    console.log(id);
    group = createGroupObj(text, id);
    groups.push(group);
  }
  else
  {
    group = groups.filter(({text}) => text === groupText)[0];
  }

  for (const subItem of subItems)
  {
    const {text, id} = subItem;
    if (hasTextWithValue(group.subItems, text))
      subItem.text = getNextText(group.subItems, `${text}_`);
    if (!id || hasId(groups, id))
    {
      let num = 0;
      while (hasId(groups, `${text}_${++num}`)) {}
      subItem.id = `${text}_${num}`;
    }
    group.subItems.push(subItem);
  }
  return saveState(groups);
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

function hasId(groups, currentId)
{
  for (const {id, subItems} of groups)
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

module.exports = {load, saveState, importProjects, addAction, name};
