/*
 * This file is part of Chromium Browser Automation.
 * Copyright (C) 2020-present Manvel Saroyan
 * 
 * Chromium Browser Automation is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Chromium Browser Automation is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Chromium Browser Automation. If not, see
 * <http://www.gnu.org/licenses/>.
 */

// Keep types in [sync with Wiki](https://github.com/browser-automation/cba/wiki/Storage-%7C-projects).

/**
 * @typedef {"Inject"|"inject-cs"|"bg-inject"|"bg-function"|"change"|"check"|"click"|"click-update"|"update"|"timer"|"redirect"|"copy-html"|"copy"|"pause"} ActionType
 */

/**
 * Injectable actions as seen in [Actions table](https://chrome-automation.com/actions-grid).
 * Learn more about [Various actions](https://chrome-automation.com/actions).
 * @typedef  {object} Action
 * @property {string} id - Unique Identifier.
 * @property {ActionType} type - One of [injectable action types](https://chrome-automation.com/actions).
 * @property {string[]} inputs - action's arguments/inputs:
 *                               1. Query, code, timer wait time or redirection link.
 *                               2. New input value. 
 */

/**
 * Projects containing actions.
 * @typedef  {object} Project
 * @property {Action[]} actions - Injectable actions.
 * @property {string} id - Unique Identifier.
 * @property {string} text - Name of the project.
 * @property {"project"} type - Project item indication.
 */

/**
 * [Groups, containing project](https://chrome-automation.com/project) which
 * contain [actions](https://chrome-automation.com/actions-grid).
 * @typedef  {object} Group
 * @property {boolean} expanded - expands/collapse group.
 * @property {string} id - Unique Identifier.
 * @property {Project[]} subItems - Sub projects.
 * @property {string} text - Name of the group.
 * @property {"group"} type - Group item indication.
 */

const name = "projects";

/**
 * Loads project Groups from storage.
 * @returns {Promise<Group[]>}
 */
async function load() {
  const result = await browser.storage.local.get(name);
  return result[name];
}

/**
 * @param {Group[]} items 
 */
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

/**
 * Add action to subItem and save to storage.
 * @param {Group["id"]} groupId 
 * @param {Project["id"]} subItemId 
 * @param {Action} action 
 */
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

/**
 * Import project into a Group with group name.
 * @param {Group["subItems"]} subItems
 * @param {Group["text"]} groupText 
 */
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

/**
 * Create an empty group object.
 * @param {Group["text"]} groupText 
 * @param {Group["id"]} groupId 
 * @returns {Group}
 */
function createGroupObj(groupText, groupId) {
  return {
    id: groupId,
    text: groupText,
    type: "group",
    expanded: false,
    subItems: []
  }
}

/**
 * Check if project with specific name exists in Projects.
 * @param {Project[]} items 
 * @param {string} value 
 */
function hasTextWithValue(items, value)
{
  return items.filter(({text}) => text === value).length > 0;
}

/**
 * Get unique text for a new project.
 * @param {Project[]} items 
 * @param {string} prefix 
 */
function getNextText(items, prefix) {
  if (!items || !items.length)
    return null;

  let num = 1;
  while (items.filter(({text}) => text === `${prefix}${num}`).length > 0)
    num++
  return `${prefix}${num}`;
}

/**
 * Check if id exists in the groups.
 * @param {Group[]} groups 
 * @param {string} currentId 
 */
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
