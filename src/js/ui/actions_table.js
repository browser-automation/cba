var actionsDefaultDataWidth = window.location.pathname != "/options.html"?100:100;
var actionsDefaultEvTypeWidth = window.location.pathname != "/options.html"?100:150;
var actionsDefaultnewValueWidth = window.location.pathname != "/options.html"?100:100;

var actionsDefaultHeight = window.location.pathname != "/options.html"?170:250;

jQuery("#actionsTable").jqGrid({
  datatype: "local",
  gridComplete: actionGridLoad,
  onSelectRow: actionSelected,
     colNames:['data', 'event', 'value'],
     colModel:[
       {name:'data',index:'data', width:actionsDefaultDataWidth, sortable:false},
       {name:'evType',index:'evType', width:actionsDefaultEvTypeWidth, sortable:false},
       {name:'newValue',index:'newValue', width:actionsDefaultnewValueWidth, sortable:false}
     ],
     height: actionsDefaultHeight,
     multiselect: false,
     hidegrid: false,
     autoencode:true,
     caption: "Actions"
});

jQuery("#actionsTable").jqGrid('sortableRows');
var actionsQuantity = 0;

/*
 * Binding event on sort stop to pass after sorting data to local storage and load grid again
 */
jQuery("#actionsTable").bind('sortstop', function(event, ui) {
  actionsSortStop();
});

function actionGridLoad() {
   $("#actionsTable .jqgrow").mouseover(function(e){
     var rowId = $(this).attr('id');
     var selector = jQuery("#actionsTable").jqGrid('getRowData',rowId).data;
     var overEvType = jQuery("#actionsTable").jqGrid('getRowData',rowId).evType;
     if((overEvType=="inject")||(overEvType=="bg-inject")||(overEvType=="cs-inject")
       ||(overEvType=="bg-function")||(overEvType=="update")
       ||(overEvType=="redirect")||(overEvType=="pause")
       ||(window.location.pathname == "/options.html")) {
       return;
     }
     chrome.tabs.getSelected(null ,async (tab) => {
       if((tab.url.indexOf("chrome://") ==-1)&&(tab.url.indexOf("chrome-extension://")==-1)) {
         browser.tabs.sendMessage(tab.id, {"action": "highlight" ,"selector": selector});
       }
     });
   });
   
   $("#actionsTable .jqgrow").mouseout(function(e){
     var rowId = $(this).attr('id');
     var selector = jQuery("#actionsTable").jqGrid('getRowData',rowId).data;
     var outEvType = jQuery("#actionsTable").jqGrid('getRowData',rowId).evType;
     if((outEvType=="inject")||(outEvType=="bg-inject")
       ||(outEvType=="cs-inject")||(outEvType=="bg-function")
       ||(outEvType=="update")||(outEvType=="redirect")
       ||(outEvType=="pause")||(window.location.pathname == "/options.html")) {
       return;
     }
     //if(currentUrl.indexOf("chrome://") !=-1) 
     chrome.tabs.getSelected(null ,async (tab) => {
       if((tab.url.indexOf("chrome://") ==-1)&&(tab.url.indexOf("chrome-extension://")==-1)) {
          browser.tabs.sendMessage(tab.id, {"action": "unHighlight" ,"selector": selector});
       }
     });
   });
}

/*
 * Function that calls after stop dragNDrop sort
 */
function actionsSortStop() {
  
  var projObj = getSelectedProjData ();


  var dataObj = JSON.parse(localStorage.getItem("data"));
  var projectsArray = dataObj[projObj["group"]].projects;
  
  for(i=0;i<projectsArray.length;i++) {
    if(projectsArray[i].name == projObj["project"]) {
      projectsArray[i].action = jQuery("#actionsTable").jqGrid('getRowData');
    }
  }
  localStorage.setItem("data", JSON.stringify(dataObj));
  getActionsData();
}

/*
 * Adding new action to action grid
 */
function actionAdd() {
  var projObj = getSelectedProjData ();
  if(projObj==null) {
    writeHelpMessage("Please select project", "red");
    return;
  }
  
  if(projObj["isProject"] == false) {
    writeHelpMessage("Please select project (not group)", "red");
    return;
  }
  
  var emptyJson = 
  {   
    data: "",
    evType: "",
    msgType: "",
    newValue: ""
  };
  var dataObj = JSON.parse(localStorage.getItem("data"));
  var projectsArray = dataObj[projObj["group"]].projects;
  var actionId = jQuery("#actionsTable").jqGrid('getGridParam', 'selrow');
  
  for(i=0;i<projectsArray.length;i++) {
    if(projectsArray[i].name == projObj["project"]) {
      if(actionId == null) {
        projectsArray[i].action.push(emptyJson);
      }
      else {
        actionId++;
        projectsArray[i].action.splice(actionId++, 0, emptyJson);
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
}

/*
 * Deleting action from Actions grid
 */
function actionDelete() {
  var projObj = getSelectedProjData ();
  
  var actionId = jQuery("#actionsTable").jqGrid('getGridParam', 'selrow');
  if(actionId == null) {
    writeHelpMessage("Please select action", "red");
    return;
  }
  
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
  
  for(i=0;i<projectsArray.length;i++) {
    if(projectsArray[i].name == projObj["project"]) {
      projectsArray[i].action.splice(actionId, 1);
    }
  }
  localStorage.setItem("data", JSON.stringify(dataObj));
  getActionsData();
  jQuery("#actionsTable").setSelection(actionId, true);
}

/**
 * Deprecated method
 */
function actionDeleteById(actId) {
  var projectId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
  var projectKey = jQuery("#projectsTable").jqGrid('getRowData',projectId).name;
  var projectJSON = JSON.parse(localStorage.getItem("data"));
  projectJSON[projectKey].action.splice(actId, 1);
  localStorage.setItem("data", JSON.stringify(projectJSON));
  getActionsData(projectKey);
  
  jQuery("#actionsTable").setSelection(actId, true);
}

/*
 * Saving changes on action
 */
function actionSave() {
  writeHelpMessage("", "");
  var actionId = jQuery("#actionsTable").jqGrid('getGridParam', 'selrow');
  if(actionId == null) {
    writeHelpMessage("Please select action", "red");
    return;
  }
  var projObj = getSelectedProjData ();
  var dataObj = JSON.parse(localStorage.getItem("data"));
  var projectsArray = dataObj[projObj["group"]].projects;
  
  for(i=0;i<projectsArray.length;i++) {
    if(projectsArray[i].name == projObj["project"]) {
      projectsArray[i].action[actionId].data = $("#actionData").val();
      projectsArray[i].action[actionId].evType = $("#actionEvType").val();
      projectsArray[i].action[actionId].msgType = "userEvent";
      projectsArray[i].action[actionId].newValue = $("#actionNewValue").val();
    }
  }
  localStorage.setItem("data", JSON.stringify(dataObj));
  getActionsData();
  jQuery("#actionsTable").setSelection(actionId, true);
  writeHelpMessage("Changes has been saved", "green");
}

/*
 * Getting actions data using projectKey and reloading actions grid
 */
function getActionsData() {
  $("#actionsTable").jqGrid("clearGridData");
  var projObj = getSelectedProjData();
  
  if(projObj == null) {
    writeHelpMessage("Please select a project", "red");
    return;
  }
  if(projObj["isProject"] == true) {
    var dataObj = JSON.parse(localStorage.getItem("data"));
    var projectsArray = dataObj[projObj["group"]].projects;
    var actions = "";
    for(i=0;i<projectsArray.length;i++) {
      if(projectsArray[i].name == projObj["project"]) {
        actions = projectsArray[i].action;
      }
    }
    loadActionsData(actions);
  } 
}

/*
 * Populating Edit inputs after selecting an action 
 */
function actionSelected(id) {
  var actionObj = jQuery("#actionsTable").jqGrid('getRowData',id);
  $("#actionData").val(actionObj.data);
  $("#actionEvType").val(actionObj.evType);
  $("#actionNewValue").val(actionObj.newValue);
  $("#actionEvType").change();
  
}

function loadActionsData(jsonArray) {
  actionsQuantity = jsonArray.length;
  for(var i=0;i<jsonArray.length;i++) {
    jQuery("#actionsTable").jqGrid('addRowData',i, jsonArray[i]);
  }
}
