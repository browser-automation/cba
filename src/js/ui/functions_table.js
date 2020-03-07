var funcDefaultWidth = window.location.pathname != "/options.html"?100:150;
var funcDefaultHeight = window.location.pathname != "/options.html"?170:250;

jQuery("#functionsTable").jqGrid({
	datatype: "local",
	onSelectRow: actionSelected,
   	colNames:['data', 'event', 'value', 'name'],
   	colModel:[
   		{name:'data',index:'data', hidden:true},
   		{name:'evType',index:'evType', hidden:true},
   		{name:'newValue',index:'newValue', hidden:true},
   		{name:'name',index:'name', width:funcDefaultWidth}
   	],
   	height: funcDefaultHeight,
   	multiselect: false,
   	hidegrid: false,
   	caption: "Functions"
});

if(window.location.pathname == "/options.html") {
	$("#addFunc").click(addFuncClick);
	$("#deleteFunc").click(deleteFuncClick);
	$("#saveFunc").click(saveFuncClick);
	
	jQuery("#functionsTableEdit").jqGrid({
		datatype: "local",
		onSelectRow: funcEditSelected,
	   	colNames:['data', 'event', 'value', 'name'],
	   	colModel:[
	   		{name:'data',index:'data', hidden:true},
	   		{name:'evType',index:'evType', hidden:true},
	   		{name:'newValue',index:'newValue', hidden:true},
	   		{name:'name',index:'name', width:funcDefaultWidth}
	   	],
	   	height: funcDefaultHeight,
	   	multiselect: false,
	   	hidegrid: false,
	   	caption: "Functions"
	});
}


jQuery("#functionsTable").jqGrid('gridDnD',{
	connectWith:'#actionsTable', 
	onstart : functDragStart,
	droppos: 'last', 
	beforedrop : functBeforeDrop
});

var functionsDefArray = 
[
{name: "Timer", data:"Please enter the time in milliseconds",evType:"timer", msgType:"apiEvent",newValue:"1000"},
{name: "Update", data:"this event will let the script wait for page update", evType:"update", msgType:"apiEvent",newValue:""},
{name: "Clear cookies", data:"<$function=removeCookie>\n<$attr=.*>",evType:"bg-function", msgType:"apiEvent",newValue:"use regular expressions to filter domains"},
{name: "Clipboard", data:'<$function=saveToClipboard>\n<$attr={"name": "value"}>',evType:"bg-function", msgType:"apiEvent",newValue:"Write to clipboard Object to access data later. Use Json in the attr."},
];

getFunctionsData();

function functDragStart(ev, ui) {
	if($(".ui-draggable.ui-widget-content.jqgrow.ui-state-hover").data('draggable') == undefined) {
		return;
	}
	possitionOffsX = ev.offsetX-$(ui.helper).width()-20;
	$(".ui-draggable.ui-widget-content.jqgrow.ui-state-hover").data('draggable').offset.click.left -= possitionOffsX;
	$(".ui-draggable.ui-widget-content.jqgrow.ui-state-hover").data('draggable').offset.click.top -= 0;
}

function functBeforeDrop(ev, ui, getdata, $source, $target) {
	var targetId = $("#actionsTable .ui-state-hover")[0].id;
    var projObj = getSelectedProjData ();
    
    if(projObj==null) {
		writeHelpMessage("Please select project", "red");
		return;
	}
	
	if(projObj["isProject"] == false) {
		writeHelpMessage("Please select project (not group)", "red");
		return;
	}
	
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var projectsArray = dataObj[projObj["group"]].projects;
	
	var actionId = targetId;
	
	for(i=0;i<projectsArray.length;i++) {
		if(projectsArray[i].name == projObj["project"]) {
			if(actionId == null) {
				projectsArray[i].action.push(getdata);
			}
			else {
				actionId++;
				projectsArray[i].action.splice(actionId++, 0, getdata);
			}
			
		}
	}
	localStorage.setItem("data", JSON.stringify(dataObj));
	getActionsData();
	
	if(actionId == null) {
		jQuery("#actionsTable").setSelection(actionsQuantity-1, true);
	}
	else {
		jQuery("#actionsTable").setSelection(actionId-1, true);
	}
	
	ui.helper.dropped = false;
}

function checkFuncStorage() {
	
	if((localStorage.getItem("cba-functions") == null)||(localStorage.getItem("cba-functions")==undefined)) {
		localStorage.setItem("cba-functions", JSON.stringify(functionsDefArray));
	}
}

function addFuncClick() {
	var functionsArray = JSON.parse(localStorage.getItem("cba-functions"));
	functionsArray.push({name: $("#funcName").val(), data: $("#funcData").val(), evType: $("#funcEvType").val(), msgType:"apiEvent", newValue: $("#funcNewValue").val()});
	localStorage.setItem("cba-functions", JSON.stringify(functionsArray));
	getFunctionsData();
}

function deleteFuncClick() {
	
	var gr = jQuery("#functionsTableEdit").jqGrid('getGridParam', 'selrow');
	if(gr == null) {
	} else {
		var functionsArray = JSON.parse(localStorage.getItem("cba-functions"));
		functionsArray.splice(gr, 1);
		localStorage.setItem("cba-functions", JSON.stringify(functionsArray));
		getFunctionsData();
	}
}

function saveFuncClick() {
	var gr = jQuery("#functionsTableEdit").jqGrid('getGridParam', 'selrow');
	if(gr == null) {
	} else {
		var functionsArray = JSON.parse(localStorage.getItem("cba-functions"));
		functionsArray[gr] = {name: $("#funcName").val(), data: $("#funcData").val(), evType: $("#funcEvType").val(), msgType:"apiEvent", newValue: $("#funcNewValue").val()};
		localStorage.setItem("cba-functions", JSON.stringify(functionsArray));
		getFunctionsData();
	}
}

/*
 * Populating functions table
 */
function getFunctionsData() {
	if(window.location.pathname == "/options.html") {
		$("#functionsTableEdit").jqGrid("clearGridData");
	}
	$("#functionsTable").jqGrid("clearGridData");
	
	checkFuncStorage();
	var functionsArray = JSON.parse(localStorage.getItem("cba-functions"));
	
	for(var i=0;i<functionsArray.length;i++) {
		if(window.location.pathname == "/options.html") {
			jQuery("#functionsTableEdit").jqGrid('addRowData',i, functionsArray[i]);
		}
		jQuery("#functionsTable").jqGrid('addRowData',i, functionsArray[i]);
		
	}
}
