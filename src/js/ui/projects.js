const {load: prefefinedActionsLoad, saveState: prefefinedActionsSave} = require("../db/predefinedActions");
const notification = require("./notification");
const {NO_PROJ_SELECTED, NO_PROJ_GROUP_SELECTED, NO_ACTION_SELECTED,
  SELECT_PROJ_NOT_GROUP, CHANGES_SAVED} = notification;

const {load, saveState} = require("../db/collections");

const projects = document.querySelector("#projects cba-list");
const functions = document.querySelector("#functions");
const actionsComp = document.querySelector("#actions");
const actionData = document.querySelector("#actionData");
const actionEvType = document.querySelector("#actionEvType");
const actionNewValue = document.querySelector("#actionNewValue");

const bg = chrome.extension.getBackgroundPage().cba;

async function loadProjects()
{
  projects.items = await load();
  if (bg.lastSelectedProjectId)
    projects.selectRow(bg.lastSelectedProjectId);

  const {type, actions} = projects.getSelectedItem();
  if (type === "project")
    populateActions(actions);
  else
    populateActions([]);

  //TODO: avoide specifing those here.
  if(bg.allowPlay || bg.paused)
    keepHighlightingPlayingAction();
}

async function loadFunctions()
{
  functions.items = await prefefinedActionsLoad();
}

function populateActions(items)
{
  actionsComp.items = items;
  const projectId = projects.getSelectedItem().id;
  if (bg.lastSelectedActionId && bg.lastSelectedProjectId === projectId)
    actionsComp.selectRow(bg.lastSelectedActionId);
  else
    selectFirstAction();
  onActionSelect();
}

async function onProjectSelect()
{
  const {type, actions, id} = projects.getSelectedItem();
  bg.lastSelectedProjectId = id;
  resetActionInput();
  if (type === "project")
    populateActions(actions);
  else
    populateActions([]);
}

function resetActionInput()
{
  actionData.value = "";
  actionEvType.selectedIndex = 0;
  actionNewValue.value = "";
}

function selectFirstAction()
{
  const [firstItem] = actionsComp.items;
  if (firstItem)
    actionsComp.selectRow(firstItem.id);
}

async function onActionSelect()
{
  const {texts, id} = actionsComp.getSelectedItem();
  bg.lastSelectedActionId = id;
  if (!texts) {
    return null;
  }
  const {data, type, value} = texts;
  actionData.value = data;
  actionNewValue.value = value;
  if (type)
    actionEvType.value = type;
  else
    actionEvType.selectedIndex = 0;

  actionEvType.dispatchEvent(new Event("change"));
}

function onEventInputChange()
{
  // TODO: Reset writeHelpMessage
  actionNewValue.disabled = false;
  actionData.disabled = false;
  const actionType = actionEvType.value;
  const disablesNewValue = ["inject", "cs-inject", "bg-inject", "bg-function",
                            "check", "click","submit-click","update", "redirect",
                            "copy", "pause"];
  const disablesData = ["update", "timer", "pause"];
  if (disablesNewValue.includes(actionType))
  {
    actionNewValue.disabled = true;
  }
  if (disablesData.includes(actionType))
  {
    actionData.disabled = true;
  }
}

function updateRecordButtonState() {
  const recordButton = document.querySelector("#recordButton");
  if (bg.allowRec)
    recordButton.textContent = "recording...";
  else
    recordButton.textContent = "rec";
}

function updatePlayButtonState() {
  const playButton = document.querySelector("#playButton");
  if (bg.paused)
    playButton.textContent = "resume";
  else
    playButton.textContent = "play";
}

function keepHighlightingPlayingAction()
{
  updatePlayButtonState();
  if(bg.allowPlay || bg.paused)
  {
    projects.selectRow(bg.playingProjectId);

    console.log(bg.playingActionIndex);
    if (bg.playingActionIndex >= 0)
    {
      const {id} = actionsComp.items[bg.playingActionIndex];
      actionsComp.selectRow(id);
    }
    setTimeout(keepHighlightingPlayingAction, 100);
  }
  else
  {
    selectFirstAction();
  }
}

function saveProjectsState()
{
  return saveState(projects.items);
}

async function onAction(action)
{
  switch (action) {
    case "addGroup": {
      const num = getNextTextNumber(projects.items, "group");
      projects.addRow(createGroupObj(`group${num}`));
      saveProjectsState();
      break;
    }
    case "addProject": {
      const project = projects.getSelectedItem();
      if (!project)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      const {type, id} = project;
      const topItem = type == "group" ? project : projects.getParentItem(id);

      const num = getNextTextNumber(topItem.subItems, "project");
      projects.addRow(createProjectObj(`project${num}`), topItem.id);
      saveProjectsState();
      break;
    }
    case "removeProject": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      const {id} = selectedProject;
      projects.deleteRow(id);
      saveProjectsState();
      break;
    }
    case "renameProject": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      // TODO: add errors  `The group with choosen name already exists` and
      // `The group already has project with current name` accordingly
      break;
    }
    case "addAction": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        const data = "";
        const type = "";
        const value = "";
        actionsComp.addRow({texts: {data, type, value}});
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "deleteAction": {
      const selectedProject = projects.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedAction)
        return notification.error(NO_ACTION_SELECTED);
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        actionsComp.deleteRow(selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "saveAction": {
      const selectedProject = projects.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedAction)
        return notification.error(NO_ACTION_SELECTED);
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        const data = actionData.value;
        const type = actionEvType.value;
        const value = actionNewValue.value;

        actionsComp.updateRow({texts: {data, type, value}}, selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        await saveProjectsState();
        notification.show(CHANGES_SAVED);
      }
      break;
    }
    case "drop": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "record": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type, id} = selectedProject;
      if (type === "project") {
        const parentItem = projects._findItem("id", id, true);
        bg.recordButtonClick(parentItem.id, id);
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      updateRecordButtonState();
      break;
    }
    case "stop": {
      notification.clean();
      bg.stopButtonClick();
      updateRecordButtonState();
      break;
    }
    case "play": {
      const uiToCbaActions = ({texts, id}) => {
        const {data, type, value} = texts;
        return {data, type, value, id};
      };

      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type, actions, id} = selectedProject;
      if (type === "project" && actions) {
        const repeateValue = document.querySelector("#repeat").value;
        bg.playButtonClick(actions.map(uiToCbaActions), repeateValue, id);
        keepHighlightingPlayingAction();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    default:
      break;
  }
}

function getNextTextNumber(items, prefix) {
  if (!items || !items.length)
    return null;

  let num = 1;
  while (items.filter(({text}) => text === `${prefix}${num}`).length > 0)
    num++
  return num;
}

function createGroupObj(groupText) {
  return {
    text: groupText,
    type: "group",
    expanded: false,
    subItems: [
      {
        text: "project",
        type: "project",
        actions: []
      }
    ]
  }
}

function createProjectObj(projectText) {
  return {
        text: projectText,
        type: "project",
        actions: []
  }
}

function registerActionListener(callback)
{
  document.body.addEventListener("click", ({target}) => 
  {
    const action = target.dataset.action;
    if (action)
      callback(action)
  });
}

loadProjects();
loadFunctions();
updateRecordButtonState();

projects.addEventListener("expand", saveProjectsState);
projects.addEventListener("select", onProjectSelect);
actionsComp.addEventListener("select", onActionSelect);
actionsComp.addEventListener("dragndrop", ()=>
{
  onAction("drop");
});
registerActionListener(onAction);
browser.storage.onChanged.addListener(({collections}) => {
  if (collections)
    loadProjects();
});

actionEvType.addEventListener("change", onEventInputChange);
onEventInputChange();
