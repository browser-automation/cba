const {load, importProjects} = require("../db/collections");
const {migrateData, migrateProjects} = require("../background/migrate");

const exportList = document.querySelector("#exportList");
const importList = document.querySelector("#importList");

const importInput = document.querySelector("#automImport");
const exportOutput = document.querySelector("#automExport");

async function loadExportList()
{
  const projects = await load();
  const expandItems = (item) => {
    item.expanded = true;
    return item;
  };

  exportList.items = projects.map(expandItems);
}

async function loadImportList()
{
  const projects = await load();
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
  if (!importInput.value)
  {
    // TODO: Show warning
    return;
  }

  const selectedGroup = importList.getSelectedItem();
  if (!selectedGroup)
  {
    // TODO: Show warning
    // Please selected group or Root
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
    //TODO: show warning
    // Imported data should be either of type group or project
    return;
  }
  
  if (selectedGroup.text === "Root")
  {
    await importProjects(projects);
  }
  else
  {
    const groupText = selectedGroup.text;
    await importProjects(projects, groupText);
  }
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

browser.storage.onChanged.addListener(({collections}) => {
  if (collections) {
    loadExportList();
    loadImportList();
  }
});
