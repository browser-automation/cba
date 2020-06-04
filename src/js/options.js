require("./analytics");

function optionsLoad() {
  $("#importBtn").click(importStorage);
  $("#exportBtn").click(exportStorage);
  $("#extVer").html("v. "+chrome.app.getDetails().version);
  
  $("#navigation .navigation").click(function() {
    localStorage.setItem("settings", this.id.substring(6));
    navigationManage();
  });
  navigationManage();
  
}

function writeHelpMessage(helpMsg, color) {
  $("#helpMessage").html(helpMsg);
  $("#helpMessage").css('color', color);
}


function funcEditSelected(id) {
  var actionObj = jQuery("#functionsTableEdit").jqGrid('getRowData',id);
  $("#funcName").val(actionObj.name);
  $("#funcData").val(actionObj.data);
  $("#funcEvType").val(actionObj.evType);
  $("#funcNewValue").val(actionObj.newValue);
  $("#funcEvType").change();
}

function exportStorage(projObj) {
  if(projObj["isProject"] == true) {
    var dataObj = JSON.parse(localStorage.getItem("data"));
    var projectsArray = dataObj[projObj["group"]].projects;
    var actions = "";
    for(i=0;i<projectsArray.length;i++) {
      if(projectsArray[i].name == projObj["project"]) {
        actions = projectsArray[i];
      }
    }
    
    $("#automExport").val(JSON.stringify(actions));
  }
  else {
    var dataObj = JSON.parse(localStorage.getItem("data"));
    var group = dataObj[projObj["project"]];
    $("#automExport").val(JSON.stringify(group));
  }
}

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


function navigationManage() {
  var selectedSetting = 1;
  if(localStorage.getItem("settings") == null) {
    localStorage.setItem("settings", 1);
  }
  else {
    selectedSetting = parseInt(localStorage.getItem("settings"));
  }
  
  for(var i = 0; i < $('.navigation').length; i++) {
        if(parseInt($('.navigation')[i].id.substring(6))==selectedSetting) {
          $('#navLnk'+(i+1)).addClass("selected");
        } else {
          $('#navLnk'+(i+1)).removeClass("selected");
        }
    }
    
    for(var i = 0; i < $('.settingContainer').length; i++) {
        if(parseInt($('.settingContainer')[i].id.substring(7))==selectedSetting) {
          $('#setting'+(i+1)).show();
          if(i+1==1){
            $("#projectsTableExport").jqGrid("clearGridData");
        populateExportProjectsTable();
        $("#projectsTableImport").jqGrid("clearGridData");
        populateImportProjectsTable();
          }
        } else {
          $('#setting'+(i+1)).hide();
        }
    }
}

$(document).ready(optionsLoad);
