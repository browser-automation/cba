jQuery("#projectsTableExport").jqGrid({
  datatype: "jsonstring",
  onSelectRow: projectExportSelected,
     colNames:['record'],
     colModel:[
       {name:'pname',index:'pname',editable:true, width:150}
     ],
     height: 153,
     multiselect: false,
     hidegrid: false,
    treeGrid: true,
    treeGridModel: 'adjacency',
    treedatatype: "local",
    ExpandColumn: 'pname',
     caption: "Export",
     jsonReader: {
                    repeatitems: false,
                    root: function (obj) { return obj; },
                    page: function (obj) { return 1; },
                    total: function (obj) { return 1; },
                    records: function (obj) { return obj.length; }
                }
});

function projectExportSelected(id) {
  var projObj = getSelectedExpProjData();
  exportStorage(projObj);
}

function checkExpStorage() {
  if(localStorage.getItem("data") == null) {
    var dataObj = {};
    var group = {};
    var projectsArray = new Array();
    
    group["name"] = "group0";
    group["level"] = "0";
    group["parent"] = "";
    group["isLeaf"] = false;
    group["expanded"] = false;
    group["loaded"] = true;
    
    var project = {};
    project["action"] = new Array();
    project["name"] = "project";
    project["level"] = "1";
    project["isLeaf"] = true;
    project["expanded"] = false;
    project["loaded"] = true;
    projectsArray.push(project);
    
    group["projects"] = projectsArray;
    dataObj["group0"] = group;
    localStorage.setItem("data", JSON.stringify(dataObj));
  }
}


/*
 * function that gets all keys from local storage and populate projects grid using them
 */
function populateExportProjectsTable() {
  checkExpStorage();
  var dataObj = JSON.parse(localStorage.getItem("data"));
  var allGroups = Object.keys(dataObj);
  var projectsArray = new Array();
  allGroups.sort();
  
  var projectId = 0;
  var groupId = 0;
  for(var i=0;i<allGroups.length;i++) {
    var groupOBJ = dataObj[allGroups[i]];
    var groupJSON = {pname : groupOBJ.name, level:groupOBJ.level, parent:groupOBJ.parent, 
            isLeaf:groupOBJ.isLeaf, expanded:groupOBJ.expanded, 
            loaded:groupOBJ.loaded};
    projectsArray.push(groupJSON);
    projectId ++;
    groupId  = projectId;
    var groupProjects = groupOBJ.projects;
    groupProjects.sort();
    for(var j=0;j<groupProjects.length;j++) {
      var projectOBJ = groupProjects[j];
      var projectJSON = {pname : projectOBJ.name, level:projectOBJ.level, parent:groupId, 
            isLeaf:projectOBJ.isLeaf, expanded:projectOBJ.expanded, 
            loaded:projectOBJ.loaded};
      projectsArray.push(projectJSON);
      projectId ++;
    }
  }
  
  $("#projectsTableExport")[0].addJSONData({
        total: 1,
        page: 1,
        records: projectsArray.length,
        rows: projectsArray
  });
}

// Function that return info regarding seleccted project
function getSelectedExpProjData () {
  var infoObj = {};
  infoObj["isProject"] = "";
  infoObj["project"] = "";
  infoObj["group"] = "";
  infoObj["groupObj"] = "";
  
  var selectedId = jQuery("#projectsTableExport").jqGrid('getGridParam', 'selrow');
  
  var record = jQuery("#projectsTableExport").getRowData(selectedId);
  if(record.pname == null) {
    return null;
  }
  var parentGroup = jQuery("#projectsTableExport").getNodeParent(record);
  // In case we don't have parent object then It's mean we have selected the group (not projectd)
  // hhere is the logic that checks that case and getting right group name
  if(parentGroup == null) {
    infoObj["isProject"] = false;
    var gr = jQuery("#projectsTableExport").jqGrid('getGridParam', 'selrow');
    var projectName = jQuery("#projectsTableExport").jqGrid('getRowData',gr).pname;
    infoObj["project"] = projectName;
  }
  else {
    infoObj["isProject"] = true;
    infoObj["group"] = parentGroup.pname;
    var gr = jQuery("#projectsTableExport").jqGrid('getGridParam', 'selrow');
    var projectName = jQuery("#projectsTableExport").jqGrid('getRowData',gr).pname;
    infoObj["project"] = projectName;
  }
  return infoObj;
}

populateExportProjectsTable();
