//var localStorageKeys = Object.keys(localStorage);

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-32260034-1']);
_gaq.push(['_trackPageview']);
	
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


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
	/*
	var exportStr;
	//var exportArray = [];
	
	//var localStorageKeys = Object.keys(localStorage);
	if(key == "All") {
		console.log(localStorage.getItem("data"));
		var dataObj = JSON.parse(localStorage.getItem("data"));
		exportStr = JSON.stringify(dataObj);
		//for(var i=0;i<localStorageKeys.length;i++) {
			//exportArray[i] = {automRecord: localStorageKeys[i], data: localStorage.getItem(localStorageKeys[i])};
		//}
	}
	else {
		var dataObj = JSON.parse(localStorage.getItem("data"));
		var projObj = {};
		projObj[key] = dataObj[key];
		exportStr = JSON.stringify(projObj);
		//exportArray[0] = {automRecord: key, data: localStorage.getItem(key)};
	}
	//console.log({storage:exportArray});
	$("#automExport").val(exportStr);
	
	*/
}


function importStorage() {
	//V7
	/*
	var importData = JSON.parse($("#automImport").val());
	for(var i=0;i<importData.length;i++) {
		localStorage.setItem(importData[i].automRecord, importData[i].data);
	}
	$("#projectsTableExport").jqGrid("clearGridData");
	populateExportProjectsTable();
	*/
	//V8
	//var importData = $("#automImport").val();
	//localStorage.setItem("data", importData);
	var existProject = new Array();
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var importData = JSON.parse($("#automImport").val());
	
	var gr = jQuery("#projectsTableImport").jqGrid('getGridParam', 'selrow');
	var projectName = jQuery("#projectsTableImport").jqGrid('getRowData',gr).name;
	
	var gr = jQuery("#projectsTableExport").jqGrid('getGridParam', 'selrow');
	var expProjectName = jQuery("#projectsTableExport").jqGrid('getRowData',gr).pname;
	
	if(projectName == undefined) {
		//TODO write error message
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
			//console.log(projects[i].name);
			//console.log(importData.name);
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
		//console.log(dataObj[projectName].projects);
		//console.log(projects);
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
	/*
	for(var attr in importData) {
		 
		if(dataObj[attr]==null) {
			dataObj[attr] = importData[attr];
			console.log("step1");
		}
		else {
			console.log("step2");
			var counter = 0;
			var attrOld = attr;
			while(dataObj[attr]!=null){
				attr = attrOld+"_"+counter;
				counter++;
			}
			dataObj[attr] = importData[attrOld];
			dataObj[attr].name = attr;
			dataObj[attr].expanded = false;
		}
	}
	localStorage.setItem("data", JSON.stringify(dataObj));
	*/
}


function navigationManage() {
	var selectedSetting = 1;
	if(localStorage.getItem("settings") == null) {
		localStorage.setItem("settings", 1);
	}
	else {
		selectedSetting = parseInt(localStorage.getItem("settings"));
	}
	//console.log($(".navigation"));
	
	for(var i = 0; i < $('.navigation').length; i++) {
        if(parseInt($('.navigation')[i].id.substring(6))==selectedSetting) {
        	$('#navLnk'+(i+1)).addClass("selected");
        	//console.log('#navLnk'+(i+1));
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