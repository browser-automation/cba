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

const {saveState} = require("../db/projects");
const customActionsDb = require("../db/customActions");

function getOldData()
{
  const data = JSON.parse(localStorage.getItem("data"));
  const settings = JSON.parse(localStorage.getItem("settings"));
  const cbaFunctions = JSON.parse(localStorage.getItem("cba-functions"));
  return {data, settings, cbaFunctions};
}

/**
 * CBA previously were using windows.localStorage, here we ensure that user
 * won't loose their old data if migration to Chrome.storage API won't go well.
 */
async function backup() {
  const {data, settings, cbaFunctions} = getOldData();
  if (data || settings || cbaFunctions) {
    const backup = {data, settings, cbaFunctions};
    await browser.storage.local.set({backup});
  }
}

function migrateActions(actions) {
  if (actions && actions.length) {
    return actions.map(({data, evType, newValue}) => {
      let type = evType;
      if (evType === "copy")
        type = "copy-html";
      else if (evType === "submit-click")
        type = "click-update";

      const inputs = type === "timer" ? [newValue, data] : [data, newValue];
      return {type, inputs};
    });
  }
  else {
    return [];
  }
}

function migrateProjects({projects}, groupName) {
  if (projects && projects.length) {
    return projects.map(({name, action}) => {
      const id = groupName ? `${groupName}_${name}` : name;
      return {
        id,
        text: name, 
        actions: migrateActions(action), type: "project"}
    });
  }
  else {
    return [];
  }
}

function migrateData(oldData) {
  const groups = [];
  for (const groupName of Object.keys(oldData)) {
    const group = {
      "text": groupName,
      "id": groupName,
      "expanded": false,
      "subItems": migrateProjects(oldData[groupName], groupName),
      "type": "group"
    };
    groups.push(group);
  }
  return groups;
}

async function migrate() {
  const {data, cbaFunctions} = getOldData();
  if (data) {
    await saveState(migrateData(data));
  }
  if (cbaFunctions) {
    const customActions = [];
    for (const {name, data, evType, newValue} of cbaFunctions) {
      const type = evType;
      const inputs = type == "timer" ? [newValue, data] : [data, newValue];
      customActions.push({
        data: {type, inputs},
        text: name
      });
    }
    await customActionsDb.saveState(customActions);
  }
}

module.exports = {migrate, backup, migrateData, migrateProjects};
