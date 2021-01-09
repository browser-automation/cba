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

const projectsDb = require("../db/projects");
const {migrateData, migrateProjects} = require("../background/migrate");
const {Notification, NO_GROUP_ROOT_SELECTED,
  NO_IMPORT_DATA, NO_PROJ_GROUP_TYPE,
  PROJECT_IMPORTED} = require("./notification");

const notification = new Notification("#panel-import .notification");

const exportList = document.querySelector("#exportList");
const importList = document.querySelector("#importList");

const importInput = document.querySelector("#automImport");
const exportOutput = document.querySelector("#automExport");

async function loadExportList()
{
  const projects = await projectsDb.load();
  const expandItems = (item) => {
    item.expanded = true;
    return item;
  };

  exportList.items = projects.map(expandItems);
}

async function loadImportList()
{
  const projects = await projectsDb.load();
  const removeSubitem = (item) => {
    if (item.subItems)
      delete item.subItems;
    return item;
  };

  const importItems = projects.map(removeSubitem);
  if (importItems[0].id !== "root") {
    importItems.unshift({id: "root", text: "Root", type: "group"});
  }
  importList.items = importItems;
}

async function onImport()
{
  notification.clean();
  if (!importInput.value)
  {
    notification.error(NO_IMPORT_DATA);
    return;
  }

  const selectedGroup = importList.getSelectedItem();
  if (!selectedGroup)
  {
    notification.error(NO_GROUP_ROOT_SELECTED);
    return;
  }

  let importData = JSON.parse(importInput.value);
  if ("isLeaf" in importData)
  {
    if (importData["isLeaf"]) {
      const projects = [importData];
      [importData] = migrateProjects({projects}, "");
    }
    else {
      const newData = {};
      newData[importData.name] = importData;
      [importData] = migrateData(newData);
    }
  }

  let projects = "";
  if (importData.type === "group")
  {
    projects = importData.subItems;
  }
  else if (importData.type === "project")
  {
    projects = [importData];
  }
  else
  {
    notification.error(NO_PROJ_GROUP_TYPE);
    return;
  }
  
  if (selectedGroup.text === "Root")
  {
    await projectsDb.importProjects(projects);
  }
  else
  {
    const groupText = selectedGroup.text;
    await projectsDb.importProjects(projects, groupText);
  }
  notification.show(PROJECT_IMPORTED);
}

async function exportProjects()
{
  const item = exportList.getSelectedItem();
  if (item.expanded)
    item.expanded = false;
  if (item.selected)
    item.selected = false;

  exportOutput.value = JSON.stringify(item);
}

loadExportList();
loadImportList();
document.querySelector("#importProjects").addEventListener("click", onImport)
exportList.addEventListener("select", exportProjects);

browser.storage.onChanged.addListener((result) => {
  if (result[projectsDb.name]) {
    loadExportList();
    loadImportList();
  }
});
