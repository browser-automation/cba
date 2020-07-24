const {load, importProjects} = require("../db/collections");

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

  const importData = JSON.parse(importInput.value);
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

/*
function importStorage() {
  var dataObj = JSON.parse(localStorage.getItem("data"));
  var importData = JSON.parse($("#automImport").val());
  var gr = jQuery("#projectsTableImport").jqGrid('getGridParam', 'selrow');
  var projectName = jQuery("#projectsTableImport").jqGrid('getRowData',gr).name;
  var gr = jQuery("#projectsTableExport").jqGrid('getGridParam', 'selrow');
  
  if(projectName == undefined) {
    return;
  }
  
  var group = {};
  if(projectName == "Root") {
    for(i=0;i<100;i++) {
      if(dataObj["group"+i] == null){
        group["name"] = "group"+i;
        group["level"] = "0";
        group["parent"] = "";
        group["isLeaf"] = false;
        group["expanded"] = false;
        group["loaded"] = true;
        group["projects"] = new Array();
        dataObj["group"+i] = group;
        if(importData['parent'] == undefined) {
          group["projects"].push(importData);
        }
        else {
          var projectsImp = importData.projects;
          
          for(var i=0;i<projectsImp.length;i++) {
            group["projects"].push(projectsImp[i]);
          }
        }
        
        break;
      }
    }
    localStorage.setItem("data", JSON.stringify(dataObj));
    
    $("#projectsTable").jqGrid("clearGridData");
    populateProjectsTable();
    $("#projectsTableExport").jqGrid("clearGridData");
    populateExportProjectsTable();
    $("#projectsTableImport").jqGrid("clearGridData");
    populateImportProjectsTable();
    return;
  }
  
  if(importData['parent'] == undefined) {
    var projects = dataObj[projectName].projects;
    for(var i=0;i<projects.length;i++) {
      if(projects[i].name == importData.name) {
        
        importData.name = importData.name+"_1";
        i=0;
      }
    }
    projects.push(importData);
    localStorage.setItem("data", JSON.stringify(dataObj));
    
    $("#projectsTable").jqGrid("clearGridData");
    populateProjectsTable();
    $("#projectsTableExport").jqGrid("clearGridData");
    populateExportProjectsTable();
    $("#projectsTableImport").jqGrid("clearGridData");
    populateImportProjectsTable();
  }else {
    var projectsImp = importData.projects;
    var projects = dataObj[projectName].projects;
    for(var i=0;i<projectsImp.length;i++) {
      for(var j=0;j<projects.length;j++) {
        if(projectsImp[i].name == projects[j].name) {
          projectsImp[i].name = projectsImp[i].name+"_1";
          j = 0;
        }
      }
      projects.push(projectsImp[i]);
    }
    localStorage.setItem("data", JSON.stringify(dataObj));
    
    $("#projectsTable").jqGrid("clearGridData");
    populateProjectsTable();
    $("#projectsTableExport").jqGrid("clearGridData");
    populateExportProjectsTable();
    $("#projectsTableImport").jqGrid("clearGridData");
    populateImportProjectsTable();
  }
}

*/
