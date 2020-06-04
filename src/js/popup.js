const {_gaq} = require("./analytics")

var bg = chrome.extension.getBackgroundPage().cba;

function trackButtonClick(e) {
   _gaq.push(['_trackEvent', e.target.id, 'clicked']);
};
  
  
function analytAllButtons() {
  var buttons = document.querySelectorAll('input[type=button]');
  for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', trackButtonClick);
  }
 }

function recordButtonClick() {
  var projObj = getSelectedProjData ();
  if(projObj==null) {
    writeHelpMessage("Please select project", "red");
    return;
  }
  
  if(projObj["isProject"] == false) {
    writeHelpMessage("Please select project (not group)", "red");
    return;
  }
  
  //var bg = chrome.extension.getBackgroundPage();
  var projectId = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
  bg.recordButtonClick(projObj, projectId);
  $("#recordButton").val("recording...");
  $("#recordButton").css({"width":"90px"});
  
}


function stopButtonClick() {
  writeHelpMessage("", "");
  bg.stopButtonClick();
  $("#recordButton").val("rec");
  $("#recordButton").css({"width":"37px"});
}

function playButtonClick() {
  var projObj = getSelectedProjData ();
  if(projObj==null) {
    writeHelpMessage("Please select project", "red");
    return;
  }
  
  if(projObj["isProject"] == false) {
    writeHelpMessage("Please select project (not group)", "red");
    return;
  }
  
  if ($("#playButton").val() != "play") {
    $("#playButton").val("play");
  }
  bg.playButtonClick(projObj, jQuery("#projectsTable").jqGrid('getGridParam', 'selrow'), $("#repeat").val());
  timedCount();
}


function popupLoad() {
  bg.allowRec==0?$("#recordButton").val("rec"):$("#recordButton").val("recording...");
  
  if(bg.allowRec == 1) {
    jQuery("#projectsTable").jqGrid('setSelection',bg.selectedProjectId);
    $("#recordButton").css({"width":"90px"});
  }
  else {
    $("#recordButton").css({"width":"37px"});
  }
  timedCount();
  
  CSPbindings();
  analytAllButtons();
}

function getSelectedProjectName() {
  var gr = jQuery("#projectsTable").jqGrid('getGridParam', 'selrow');
  var projectName = jQuery("#projectsTable").jqGrid('getRowData',gr).pname;
  return projectName;
}

function actionEvTypeChange() {
  writeHelpMessage("", "");
  var actionEvTypeValue = $("#actionEvType").val();
  
  if(actionEvTypeValue == "inject") {
     $("#actionNewValue").prop("disabled",true);
     $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "cs-inject") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "bg-inject") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "bg-function") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "change") {
    $("#actionNewValue").prop("disabled",false);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "check") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "click") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "redirect") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "submit-click") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "update") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",true);
  }
  else if(actionEvTypeValue == "timer") {
    $("#actionData").prop("disabled",true);
    $("#actionNewValue").prop("disabled",false);
  }
  else if(actionEvTypeValue == "copy") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",false);
  }
  else if(actionEvTypeValue == "pause") {
    $("#actionNewValue").prop("disabled",true);
    $("#actionData").prop("disabled",true);
  }
}

function writeHelpMessage(helpMsg, color) {
  $("#helpMessage").html(helpMsg);
  $("#helpMessage").css('color', color);
}

function timedCount() {
  if(bg.lastSelectedProjectId != null) {
    jQuery("#projectsTable").setSelection(bg.lastSelectedProjectId, true);
  }
  if(bg.allowPlay == 1) {
    jQuery("#projectsTable").setSelection(bg.playingProjectId, true);
    jQuery("#actionsTable").setSelection(actionsQuantity - bg.instructArray.length - 1, true);
    setTimeout(timedCount,100);
  }
  else if (bg.paused == 1) {
    jQuery("#projectsTable").setSelection(bg.playingProjectId, true);
    jQuery("#actionsTable").setSelection(actionsQuantity - bg.instructArray.length - 1, true);
    if ($("#playButton").val() != "resume") {
      $("#playButton").val("resume");
    }
    setTimeout(timedCount,100);
  }
  else {
    writeHelpMessage("", "");
    //console.log(bg.allowPlay);
    jQuery("#actionsTable").setSelection(actionsQuantity - 1, true);
  }
}

function CSPbindings() {
  $("#actionEvType").change();
  $("#groupAddBtn").click(groupAdd);
  $("#projectAddBtn").click(projectAdd);
  $("#projectDeleteBtn").click(projectDelete);
  $("#projectRenameBtn").click(projectRename);
  $("#actionsAdd").click(actionAdd);
  $("#actionsDelete").click(actionDelete);
  $("#actionsSave").click(actionSave);
  $("#recordButton").click(recordButtonClick);
  $("#stopButton").click(stopButtonClick);
  $("#playButton").click(playButtonClick);
  $("#actionEvType").change(actionEvTypeChange);
  
}
$(document).ready(popupLoad);
