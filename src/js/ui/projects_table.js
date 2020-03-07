var projectOldName;
var projectRenameId;
var projectRenameParentGroup;

var projDefaultWidth = window.location.pathname != "/options.html"?150:200;

var projDefaultHeight = window.location.pathname != "/options.html"?150:231;

jQuery("#projectsTable").jqGrid({
	datatype: "jsonstring",
	onSelectRow: projectSelected,
   	colNames:['record'],
   	colModel:[
   		{name:'pname',index:'pname',editable:true, width:projDefaultWidth}
   	],
   	height: projDefaultHeight,
   	multiselect: false,
   	hidegrid: false,
    treeGrid: true,
    treeGridModel: 'adjacency',
    treedatatype: "local",
    ExpandColumn: 'pname',
   	caption: "Projects",
   	jsonReader: {
                    repeatitems: false,
                    root: function (obj) { return obj; },
                    page: function (obj) { return 1; },
                    total: function (obj) { return 1; },
                    records: function (obj) { return obj.length; }
                }
});

var orgExpandNode = $.fn.jqGrid.expandNode,
    orgCollapseNode = $.fn.jqGrid.collapseNode;
$.jgrid.extend({
    expandNode: function (rc) {
        var record = jQuery("#projectsTable").getRowData(rc._id_);
        var dataObj = JSON.parse(localStorage.getItem("data"));
        dataObj[record.pname].expanded = true;
        localStorage.setItem("data", JSON.stringify(dataObj));
        return orgExpandNode.call(this, rc);
    },
    collapseNode: function (rc) {
    	var record = jQuery("#projectsTable").getRowData(rc._id_);
        var dataObj = JSON.parse(localStorage.getItem("data"));
        dataObj[record.pname].expanded = false;
        localStorage.setItem("data", JSON.stringify(dataObj));
        return orgCollapseNode.call(this, rc);
    }
});

function projectSelected(id) {
	if(window.location.pathname != "/options.html") {
		bg.lastSelectedProjectId = id;
	}
	
	getActionsData();
	jQuery("#actionsTable").setSelection(0, true);
}

/*
 * Function that makes selected row editable and saving changes and send to local storage
 */
function projectRename() {
	if ($("#projectRenameBtn").val() == "Rename") {
		$("#projectRenameBtn").val("save");
		
		projectRenameId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
		var record = jQuery("#projectsTable").getRowData(projectRenameId);
		
		//check whether we have selected any row from project table, if not then write message
		if(record.pname == null) {
			writeHelpMessage("Please select Group or Project", "red");
			return;
		}
		
		projectRenameParentGroup = jQuery("#projectsTable").getNodeParent(record);
		
		projectOldName = getSelectedProjectName();
		jQuery("#projectsTable").jqGrid('editRow', projectRenameId);
	}
	else {
		var dataObj = JSON.parse(localStorage.getItem("data"));
		$("#projectRenameBtn").val("Rename");
		jQuery("#projectsTable").jqGrid('saveRow', projectRenameId, false, 'clientArray');
		
		var newName = jQuery("#projectsTable").jqGrid('getRowData',projectRenameId).pname;
		
		if(newName == projectOldName) {
			return;
		}
		
		// In case we don't have parent object then It's mean we have selected the group (not projectd)
		// hhere is the logic that checks that case and getting right group name
		if(projectRenameParentGroup == null) {
			// in case group is selected
			if(dataObj[newName] != null) {
				writeHelpMessage("The group with choosen name already exists", "red");
				$("#projectsTable").jqGrid("clearGridData");
				populateProjectsTable();
				return;
			}
			dataObj[newName] = dataObj[projectOldName];
			dataObj[newName].name = newName;
			delete dataObj[projectOldName]; 
			
		}
		else {
			// in case project is selected
			var groupName = projectRenameParentGroup.pname;
			var groupOBJ = dataObj[groupName];
			var projectsArray = groupOBJ.projects;
			
			for(i=0;i<projectsArray.length;i++) {
				if(projectsArray[i].name == newName) {
					writeHelpMessage("The group already has project with current name", "red");
					$("#projectsTable").jqGrid("clearGridData");
					populateProjectsTable();
					return;
				}
			}
			
			for(i=0;i<projectsArray.length;i++) {
				if(projectsArray[i].name == projectOldName) {
					projectsArray[i].name = newName;
				}
			}
		}  
		//V8
		localStorage.setItem("data", JSON.stringify(dataObj));
		$("#projectsTable").jqGrid("clearGridData");
		populateProjectsTable();
	}
}

/*
 * Deleting project
 */
function projectDelete() {
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var selectedId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	
	var record = jQuery("#projectsTable").getRowData(selectedId);
	
	//check whether we have selected any row from project table, if not then write message
	if(record.pname == null) {
		writeHelpMessage("Please select Group or Project", "red");
		return;
	}
	
	
	// Get the parent of the selected element in our case it's group name
	var parentGroup = jQuery("#projectsTable").getNodeParent(record);
	
	var deletionName = "";
	
	// In case we don't have parent object then It's mean we have selected the group (not projectd)
	// hhere is the logic that checks that case and getting right group name
	if(parentGroup == null) {
		// in case group is selected
		deletionName = getSelectedProjectName();
		delete dataObj[deletionName]; 
		
	}
	else {
		// in case project is selected  
		deletionName = parentGroup.pname;
		var groupOBJ = dataObj[deletionName];
		var projectsArray = groupOBJ.projects;
		var projectName = getSelectedProjectName();
		
		for(i=0;i<projectsArray.length;i++) {
			if(projectsArray[i].name == projectName) {
				projectsArray.splice(i, 1);
			}
		}
	}
	
	localStorage.setItem("data", JSON.stringify(dataObj));
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
}

/*
 * Adding new empty project
 */
function projectAdd() {
	// V8
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var selectedId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	
	
	var record = jQuery("#projectsTable").getRowData(selectedId);
	
	//check whether we have selected any row from project table, if not then write message
	if(record.pname == null) {
		writeHelpMessage("Please select Group or Project", "red");
		return;
	}
	
	// Get the parent of the selected element in our case it's group name
	var parentGroup = jQuery("#projectsTable").getNodeParent(record);
	
	var groupName = "";
	
	// In case we don't have parent object then It's mean we have selected the group (not projectd)
	// hhere is the logic that checks that case and getting right group name
	if(parentGroup == null) {
		groupName = getSelectedProjectName();
		groupId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	}
	else {
		groupName = parentGroup.pname;
		groupId = parentGroup._id_;
	}
	
	var groupOBJ = dataObj[groupName];
	
	var groupProjArray = groupOBJ.projects;
	for(i=0;i<100;i++) {
		var allowProject = true;
		for(j=0;j<groupProjArray.length;j++) {
			if(groupProjArray[j].name == "project"+i) {
				allowProject = false;
			}
		}
		if(allowProject) {
			var project = {};
			project["action"] = new Array();
			project["name"] = "project"+i;
			project["level"] = "1";
			project["isLeaf"] = true;
			project["expanded"] = false;
			project["loaded"] = true;
			groupProjArray.push(project);
			
			break;
		}
		else {
			continue;
		}
	}
	groupProjArray.sort();
	localStorage.setItem("data", JSON.stringify(dataObj));
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
}

function groupAdd() {
	var dataObj = JSON.parse(localStorage.getItem("data"));
	for(i=0;i<100;i++) {
		if(dataObj["group"+i] == null){
			var group = {};
			group["name"] = "group"+i;
			group["level"] = "0";
			group["parent"] = "";
			group["isLeaf"] = false;
			group["expanded"] = false;
			group["loaded"] = true;
			group["projects"] = new Array();
			dataObj["group"+i] = group;
			break;
		}
	}
	localStorage.setItem("data", JSON.stringify(dataObj));
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
}

//V8
function checkStorage() {
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
		//project["parent"] = "1";
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
function populateProjectsTable() {
	checkStorage();
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
	
	$("#projectsTable")[0].addJSONData({
    		total: 1,
    		page: 1,
    		records: projectsArray.length,
    		rows: projectsArray
	});
}

// Function that return info regarding seleccted project
function getSelectedProjData () {
	var infoObj = {};
	infoObj["isProject"] = "";
	infoObj["project"] = "";
	infoObj["group"] = "";
	infoObj["groupObj"] = "";
	
	var selectedId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	
	var record = jQuery("#projectsTable").getRowData(selectedId);
	
	//check whether we have selected any row from project table, if not then write message
	if(record.pname == null) {
		return null;
	}
	
	var parentGroup = jQuery("#projectsTable").getNodeParent(record);
	// In case we don't have parent object then It's mean we have selected the group (not projectd)
	// hhere is the logic that checks that case and getting right group name
	if(parentGroup == null) {
		infoObj["isProject"] = false;
		infoObj["project"] = getSelectedProjectName();
	}
	else {
		infoObj["isProject"] = true;
		infoObj["group"] = parentGroup.pname;
		infoObj["project"] = getSelectedProjectName();
	}
	return infoObj;
}
populateProjectsTable();
