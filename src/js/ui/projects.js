/*
 * This file is part of Chromium Browser Automation.
 * Copyright (C) 2020-present Manvel Saroyan
 * 
 * Chromium Browser Automation is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Chromium Browser Automation is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Chromium Browser Automation. If not, see
 * <http://www.gnu.org/licenses/>.
 */

const customActionsDb = require("../db/customActions");
const {NO_PROJ_SELECTED, NO_PROJ_GROUP_SELECTED, NO_ACTION_SELECTED,
  SELECT_PROJ_NOT_GROUP, CHANGES_SAVED, NAME_EXISTS_GROUP, NAME_EXISTS_PROJECT,
  Notification, PROJECT_EDIT} = require("./notification");

const projectsDb = require("../db/projects");
const prefs = require("../db/prefs");
const ActionInputs = require("./ActionInputs");

const projectsComp = document.querySelector("#projects cba-list");
const functions = document.querySelector("#functions");
const actionsComp = document.querySelector("#actions");

const playButtonTooltip = document.querySelector("#playButtonTooltip");

const actionInputs = new ActionInputs({type: "#actionEvType",
                                       inputs: ["#actionData",
                                                "#actionNewValue"]});
actionInputs.setTooltip("#actionInfo");

const bg = chrome.extension.getBackgroundPage().cba;
const notification = new Notification("#notification");

const warningHeading = "bg-inject & cs-inject";
const warningText = "Current project contains some powerful action types, before running please ensure you trust those.";
const warningLink = "https://chrome-automation.com/powerful-actions";
const warningLinkText = "Learn more";
const warningActionText = "Hide message";

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
    actionsComp.selectRow(bg.lastSelectedActionId, false);
  else
    selectFirstAction();
  onActionSelect();
}

function projectHasAction(id, types)
{
  const project = projectsComp.getItem(id);
  if (project.type !== "project" || !project.actions)
    return false;

  const filterTypes = (action) => types.indexOf(action.type) >= 0;
  return project.actions.filter(filterTypes).length > 0;
}

async function initPlayButtonTooltip()
{
  const text = warningText;
  const link = warningLink;
  const linkText = warningLinkText;
  const heading = warningHeading;
  const actionText = warningActionText;
  const action = hideWarningMessage;
  playButtonTooltip.setData({heading, text, link, linkText, actionText,
                             action});
  await setPlayButtonTooltip();
}

async function hideWarningMessage()
{
  await prefs.set("hidePowerfulActionWarning", true);
  playButtonTooltip.disable();
}

async function setPlayButtonTooltip()
{
  const {id} = await projectsComp.getSelectedItem();
  if (await prefs.get("hidePowerfulActionWarning") == true)
  {
    playButtonTooltip.disable();
  }
  else if (projectHasAction(id, ["bg-inject", "cs-inject"])) {
    playButtonTooltip.enable();
  }
  else {
    playButtonTooltip.disable();
  }
}

async function onProjectSelect()
{
  const {type, actions, id} = projectsComp.getSelectedItem();
  bg.lastSelectedProjectId = id;
  actionInputs.reset();
  await setPlayButtonTooltip();

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
  // updating projects during rename can cause unexpected behavior, ex. updating
  // storage with old item name, it's easier to ignore actions while editing.
  if (renamingItem && action !== "saveProject") {
    notification.error(PROJECT_EDIT);
    projectsComp.selectRow(projectsComp.getSelectedItem().id);
    return;
  }
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
      renamingItem = null;
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
    return 1;

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

async function highlight(type, [query], highlight = true)
{
  if (actionInputs.isHighlight(type))
  {
    const action = highlight ? "highlight" : "unHighlight";
    const selector = query;
    const [tab] = await browser.tabs.query({active: true});
    if (tab.url.startsWith("http"))
      await browser.tabs.sendMessage(tab.id, {action ,selector});
  }
}

loadProjects();
loadFunctions();
updateRecordButtonState();
initPlayButtonTooltip();

projectsComp.addEventListener("expand", saveProjectsState);
projectsComp.addEventListener("keydown", ({key}) =>
{
  if (key === "Enter")
  {
    onAction("saveProject");
  }
});
projectsComp.addEventListener("select", onProjectSelect);
actionsComp.addEventListener("select", onActionSelect);
actionsComp.addEventListener("rowmouseover", ({detail}) =>
{
  const {type, inputs} = actionsComp.getItem(detail.rowId);
  highlight(type, inputs);
});

actionsComp.addEventListener("rowmouseout", ({detail}) =>
{
  const {type, inputs} = actionsComp.getItem(detail.rowId);
  highlight(type, inputs, false);
});

actionsComp.addEventListener("dragndrop", ()=>
{
  onAction("drop");
});
registerActionListener(onAction);
browser.storage.onChanged.addListener((result) => {
  if (result[projectsDb.name])
    loadProjects();
});
