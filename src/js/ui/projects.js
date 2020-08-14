const customActionsDb = require("../db/customActions");
const {NO_PROJ_SELECTED, NO_PROJ_GROUP_SELECTED, NO_ACTION_SELECTED,
  SELECT_PROJ_NOT_GROUP, CHANGES_SAVED, NAME_EXISTS_GROUP, NAME_EXISTS_PROJECT,
  Notification} = require("./notification");

const projectsDb = require("../db/projects");
const ActionInputs = require("./ActionInputs");

const projectsComp = document.querySelector("#projects cba-list");
const functions = document.querySelector("#functions");
const actionsComp = document.querySelector("#actions");

const actionInputs = new ActionInputs("#actionEvType", "#actionData",
                                      "#actionNewValue");

const bg = chrome.extension.getBackgroundPage().cba;
const notification = new Notification("#notification");

let renamingItem = null;

async function loadProjects()
{
  projectsComp.items = await projectsDb.load();
  if (bg.lastSelectedProjectId)
    projectsComp.selectRow(bg.lastSelectedProjectId);

  const {type, actions} = projectsComp.getSelectedItem();
  if (type === "project")
    populateActions(actions);
  else
    populateActions([]);

  keepHighlightingPlayingAction(true);
}

async function loadFunctions()
{
  functions.items = await customActionsDb.load();
}

function populateActions(items)
{
  actionsComp.items = items;
  const projectId = projectsComp.getSelectedItem().id;
  if (bg.lastSelectedActionId && bg.lastSelectedProjectId === projectId)
    actionsComp.selectRow(bg.lastSelectedActionId);
  else
    selectFirstAction();
  onActionSelect();
}

async function onProjectSelect()
{
  const {type, actions, id} = projectsComp.getSelectedItem();
  bg.lastSelectedProjectId = id;
  actionInputs.reset();
  if (type === "project")
    populateActions(actions);
  else
    populateActions([]);
}

function selectFirstAction()
{
  const [firstItem] = actionsComp.items;
  if (firstItem)
    actionsComp.selectRow(firstItem.id);
}

async function onActionSelect()
{
  const item = actionsComp.getSelectedItem();
  if (!item) {
    return null;
  }
  bg.lastSelectedActionId = item.id;
  actionInputs.setItem(item);
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

function keepHighlightingPlayingAction(isPopupLoad)
{
  updatePlayButtonState();
  if(bg.allowPlay || bg.paused)
  {
    projectsComp.selectRow(bg.playingProjectId);
    if (bg.playingActionIndex >= 0)
    {
      const {id} = actionsComp.items[bg.playingActionIndex];
      actionsComp.selectRow(id);
    }
    setTimeout(keepHighlightingPlayingAction, 100);
  }
  else if (!isPopupLoad)
  {
    selectFirstAction();
  }
}

function saveProjectsState()
{
  return projectsDb.saveState(projectsComp.items);
}

async function onAction(action)
{
  switch (action) {
    case "addGroup": {
      const num = getNextTextNumber(projectsComp.items, "group");
      projectsComp.addRow(createGroupObj(`group${num}`));
      saveProjectsState();
      break;
    }
    case "addProject": {
      const project = projectsComp.getSelectedItem();
      if (!project)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      const {type, id} = project;
      const topItem = type == "group" ? project : projectsComp.getParentItem(id);

      const num = getNextTextNumber(topItem.subItems, "project");
      projectsComp.addRow(createProjectObj(`project${num}`), topItem.id);
      saveProjectsState();
      break;
    }
    case "removeProject": {
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      const {id} = selectedProject;
      projectsComp.deleteRow(id);
      saveProjectsState();
      break;
    }
    case "renameProject": {
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_GROUP_SELECTED);

      projectsComp.setEditable(selectedProject.id, true);
      renamingItem = selectedProject;
      document.querySelector("#projects").classList.add("rename");
      break;
    }
    case "saveProject": {
      if (!renamingItem) {
        location.reload();
        document.querySelector("#projects").classList.remove("rename");
        return;
      }

      const {text, type, id} = renamingItem;
      const editedText = projectsComp._getRowContent(id);
      if (type === "project")
      {
        const subItems = projectsComp.getParentItem(id).subItems;
        if (itemsHasText(subItems, editedText) && text != editedText)
        {
          projectsComp.selectRow(id);
          return notification.error(NAME_EXISTS_PROJECT);
        }
      }
      else if (itemsHasText(projectsComp.items, editedText) && text != editedText)
      {
        projectsComp.selectRow(id);
        return notification.error(NAME_EXISTS_GROUP);
      }
      projectsComp.saveEditables();
      await saveProjectsState();
      notification.clean();
      document.querySelector("#projects").classList.remove("rename");
      break;
    }
    case "addAction": {
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {id} = actionsComp.getSelectedItem();
      const {type} = selectedProject;
      if (type === "project") {
        const type = "";
        const inputs = ["", ""];
        actionsComp.addRow({type, inputs}, id);
        if (id)
        {
          actionsComp.selectNextRow();
        }
        else
        {
          const lastItem = actionsComp.items[actionsComp.items.length - 1];
          actionsComp.selectRow(lastItem.id);
        }
        selectedProject.actions = actionsComp.items;
        projectsComp.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "deleteAction": {
      const selectedProject = projectsComp.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedAction)
        return notification.error(NO_ACTION_SELECTED);
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        actionsComp.deleteRow(selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projectsComp.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "saveAction": {
      const selectedProject = projectsComp.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedAction)
        return notification.error(NO_ACTION_SELECTED);
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        actionsComp.updateRow(actionInputs.getItem(), selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projectsComp.updateRow(selectedProject, selectedProject.id);
        await saveProjectsState();
        notification.show(CHANGES_SAVED);
      }
      break;
    }
    case "drop": {
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type} = selectedProject;
      if (type === "project") {
        selectedProject.actions = actionsComp.items;
        projectsComp.updateRow(selectedProject, selectedProject.id);
        saveProjectsState();
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      break;
    }
    case "record": {
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type, id} = selectedProject;
      if (type === "project") {
        const parentItem = projectsComp._findItem("id", id, true);
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
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type, actions, id} = selectedProject;
      if (type === "project" && actions) {
        const repeateValue = document.querySelector("#repeat").value;
        bg.playButtonClick(actions, repeateValue, id);
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

function itemsHasText(items, text)
{
  return items.filter((item) => item.text === text).length > 0;
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

projectsComp.addEventListener("expand", saveProjectsState);
projectsComp.addEventListener("select", onProjectSelect);
actionsComp.addEventListener("select", onActionSelect);
actionsComp.addEventListener("dragndrop", ()=>
{
  onAction("drop");
});
registerActionListener(onAction);
browser.storage.onChanged.addListener((result) => {
  if (result[projectsDb.name])
    loadProjects();
});
