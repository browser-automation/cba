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

//$("#projectsTable").tableDnD({ onDrop: projDrop });
/*
jQuery("#projectsTable").jqGrid('gridDnD', {
	connectWith : '#projectsTable',
	onstart : functDragStart,
	ondrop : functDrop,
	beforedrop : functBeforeDrop,
	droppos : 'last'
});

function functDragStart(ev, ui) {
	possitionOffsX = ev.pageX - 140;
	//$(".ui-draggable.ui-widget-content.jqgrow.ui-state-hover").data('draggable').offset.click.left -= possitionOffsX;
	$(".ui-draggable.ui-widget-content.jqgrow.ui-state-hover").data('draggable').offset.click.top -= 15;
	console.log("drag start");
}

function functDrop(ev, ui, getdata) {
	//console.log("Drop");
}

function functBeforeDrop(ev, ui, getdata, $source, $target) {
	var targetId = $("#projectsTable .ui-state-hover")[0].id;
	var sourceName = getdata.name;
	
	if((targetId == null)||(sourceName == null)) {
		return;
	}
	
	var targetName = jQuery("#projectsTable").jqGrid('getRowData',targetId).name;
	
}
*/
/*
 * Projects DND part
 */


function projectSelected(id) {
	if(window.location.pathname != "/options.html") {
		bg.lastSelectedProjectId = id;
	}
	
	var projectName = jQuery("#projectsTable").jqGrid('getRowData',id).name;
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
		
		console.log(projectOldName);
		
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
		//V7
		/*
		localStorage.setItem(newName, localStorage.getItem(projectOldName));
		localStorage.removeItem(projectOldName);
		$("#projectsTable").jqGrid("clearGridData");
		populateProjectsTable();
		*/
		
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
	// V7
	/*
	var gr = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	var projectName = jQuery("#projectsTable").jqGrid('getRowData',gr).name;
	localStorage.removeItem(projectName);
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
	*/
	
	//V8
	
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
	var isGroup = true;
	
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
	
	/*
	return;
	
	var gr = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
	var projectName = jQuery("#projectsTable").jqGrid('getRowData',gr).name;
	console.log(projectName);
	var dataObj = JSON.parse(localStorage.getItem("data"));
	delete dataObj[projectName];
	
	localStorage.setItem("data", JSON.stringify(dataObj));
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
	*/
}

/*
 * Adding new empty project
 */
function projectAdd() {
	// V7
	/*
	var newDate = new Date;
	var unique = newDate.getTime() + '';
	localStorage.setItem("record_"+unique.substring(unique.length - 5), '{"action":[]}');
	$("#projectsTable").jqGrid("clearGridData");
	populateProjectsTable();
	*/
	
	// V8
	//checkStorage();
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
	var groupId = 1;
	
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
	//TODO iterate here to see whether I have the project then add
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
			//project["parent"] = groupId;
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
	//dataObj[groupName].projects = groupProjArray;
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
	//V7
	/*
	var localStorageKeys = Object.keys(localStorage);
	localStorageKeys.sort();
	for(var i=0;i<localStorageKeys.length;i++) {
		var namesJSON = {name : localStorageKeys[i]};
		jQuery("#projectsTable").jqGrid('addRowData',i, namesJSON);
	}
	*/
	// { name:"Cash", level:"0", parent:"",  isLeaf:false, expanded:false, loaded:true },
	//V8
	checkStorage();
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var allGroups = Object.keys(dataObj);
	
	
	
	var projectsArray = new Array();
	allGroups.sort();
	
	var projectId = 0;
	var groupId = 0;
	
	for(var i=0;i<allGroups.length;i++) {
		
		//var groupName = allGroups[i];
		var groupOBJ = dataObj[allGroups[i]];
		console.log(groupOBJ.name);
		var groupJSON = {pname : groupOBJ.name, level:groupOBJ.level, parent:groupOBJ.parent, 
						isLeaf:groupOBJ.isLeaf, expanded:groupOBJ.expanded, 
						loaded:groupOBJ.loaded};
		projectsArray.push(groupJSON);
		projectId ++;
		groupId  = projectId;
		console.log(JSON.stringify(groupJSON));
		var groupProjects = groupOBJ.projects;
		groupProjects.sort();
		for(var j=0;j<groupProjects.length;j++) {
			var projectOBJ = groupProjects[j];
			var projectJSON = {pname : projectOBJ.name, level:projectOBJ.level, parent:groupId, 
						isLeaf:projectOBJ.isLeaf, expanded:projectOBJ.expanded, 
						loaded:projectOBJ.loaded};
			projectsArray.push(projectJSON);
			projectId ++;
			console.log(JSON.stringify(projectJSON));
		}
		//jQuery("#projectsTable").jqGrid('addRowData',i, namesJSON);
	}
	
	var mydata = [
                { name:"Cash", level:"0", parent:"",  isLeaf:false, expanded:false, loaded:true },
                { name:"Bank\'s",  level:"0", parent:"",  isLeaf:false, expanded:true, loaded:true },
                { name:"Cash 1", level:"1", parent:"1", isLeaf:false, expanded:false, loaded:true },
                { name:"Sub Cash 1",  level:"2", parent:"2", isLeaf:true,  expanded:false, loaded:true },
                { name:"Cash 2",  level:"1", parent:"1", isLeaf:true,  expanded:false, loaded:true },
                {  name:"Bank 1",   level:"1", parent:"2", isLeaf:true,  expanded:false, loaded:true },
                {  name:"Bank 2", level:"1", parent:"2", isLeaf:true,  expanded:false, loaded:true },
                {  name:"Fixed asset",  level:"0", parent:"",  isLeaf:true,  expanded:false, loaded:true }
                ];
                
	var namesJSON = {name : "project0", level:"0", parent:""};
	//projectsArray.push(namesJSON);
	var namesJSON = {name : "project1", level:"1", parent:"1"};
	//projectsArray.push(namesJSON);
	
	
	
	$("#projectsTable")[0].addJSONData({
    		total: 1,
    		page: 1,
    		records: projectsArray.length,
    		rows: projectsArray
	});
}

//TODO use this function to modify other project functions
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
