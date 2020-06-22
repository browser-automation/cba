const dbName = "collections";

async function load() {
  const {collections} = await browser.storage.local.get(dbName);
  return collections;
}

async function addGroup() {
  const collections = await load();
  const num = getNextTextNumber(collections, "group");

  collections.push(createGroupObj(`group${num}`));
  return browser.storage.local.set({collections});
}

async function addProject(groupText) {
  const collections = await load();
  const {subItems} = collections.find(({text}) => text === groupText);
  const num = getNextTextNumber(subItems, "project");
  if (num)
    subItems.push(createProjectObj(`project${num}`));

  return browser.storage.local.set({collections});
}

async function remove(text, groupText) {
  let collections = await load();
  if (groupText) {
    let groupItem  = collections.filter((item) => item.text === groupText)[0];
    groupItem.subItems = groupItem.subItems.filter((item) => item.text != text);
  } else {
    collections = collections.filter((item) => item.text !== text);
  }
  return browser.storage.local.set({collections});
}

function getNextTextNumber(items, prefix) {
  if (!items || !items.length)
    return null;

  let num = 1;
  while (items.filter(({text}) => text === `${prefix}${num}`).length > 0)
    num++
  return num;
}

function createGroupObj(groupText) {
  return {
    text: groupText,
    type: "group",
    expanded: false,
    subItems: [
      {
        text: "project",
        type: "project",
        actions: []
      }
    ]
  }
}

function createProjectObj(projectText) {
  return {
        text: projectText,
        type: "project",
        actions: []
  }
}

module.exports = {addGroup, addProject, remove, load};
