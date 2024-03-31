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
const {sendRpcMessage, addRpcListener, removeRpcListener} = require("../rpc/client");

/**
 * @typedef {import("../rpc/types").RpcHandler} RpcHandler
 */
/**
 * @typedef {object} PayloadDef
 * @property {import("../db/projects").Action[]} actions - Actions to be executed.
 * @property {"project|group"} type - type of the list item item.
 */

/**
 * @typedef {(import("cba-components/src/cba-list/cba-list").ListItem|import("cba-components/src/cba-list/cba-list").ListSubItem) & PayloadDef } ItemPayloadDef
 */

/**
 * @type {import("cba-components/src/cba-list/cba-list").List}
 */
const projectsComp = document.querySelector("#projects cba-list");
/**
 * @type {import("cba-components/src/cba-list/cba-list").List}
 */
const functions = document.querySelector("#functions");
/**
 * @type {import("cba-components/src/cba-table/cba-table").Table}
 */
const actionsComp = document.querySelector("#actions");

const playButtonTooltip = document.querySelector("#playButtonTooltip");

const actionInputs = new ActionInputs({type: "#actionEvType",
                                       inputs: ["#actionData",
                                                "#actionNewValue"]});
actionInputs.setTooltip("#actionInfo");

const notification = new Notification("#notification");

const warnings = {
  powerFullActions: {
      heading: "bg-inject & cs-inject",
      text: "Current project contains some powerful action types, before running please ensure you trust those.",
      link: "https://chrome-automation.com/powerful-actions",
      linkText: "Learn more",
      actionText: "Hide message"
  },
  bgActionsMv3: {
    text: "Current project contains bg-inject action, which we can not support since Manifest v3, please replace it with another action.",
    link: "https://chrome-automation.com/mv3#bg-inject",
    linkText: "Learn more",
  },
  csActionsMv3: {
    text: "Current project contains cs-inject action, cs-inject current acts very similar to inject action since migration to Manifest v3.",
    link: "https://chrome-automation.com/mv3#cs-inject",
    linkText: "Learn more",
  }
};

let renamingItem = null;

async function loadProjects()
{
  projectsComp.items = (await projectsDb.load()).map((groups) => {
    groups.subItems = groups.subItems.map(setAlertsToProjects);
    return groups;
  });
  const lastSelectedProjectId = await prefs.get("lastSelectedProjectId");
  if (lastSelectedProjectId)
    projectsComp.selectRow(lastSelectedProjectId);

  /** @type {import("../db/projects").Action} actions */
  const {type, actions} = projectsComp.getSelectedItem();
  if (type === "project")
    await populateActions(actions);
  else
    await populateActions([]);

  keepHighlightingPlayingAction(true);
}

/**
 * @param {import("../db/projects").Project} project
 * @returns {import("cba-components/src/cba-list/cba-list").ListItem}
 */
function setAlertsToProjects(project) {
  const hasBgInject = project.actions.some((action) => action.type === "bg-inject");
  const hasCsInject = project.actions.some((action) => action.type === "cs-inject");
  /** @type {import("cba-components/src/cba-list/cba-list").ListItem} */
  const listItem = {...project};
  if (hasCsInject) {
    listItem.info = {
      type: "warning",
      description: warnings["csActionsMv3"].text,
      link: warnings["csActionsMv3"].link,
      linkText: warnings["csActionsMv3"].linkText
    }
  }
  if (hasBgInject) {
    listItem.info = {
      type: "error",
      description: warnings["bgActionsMv3"].text,
      link: warnings["bgActionsMv3"].link,
      linkText: warnings["bgActionsMv3"].linkText
    }
  }
  return listItem
}

/**
 * @param {import("../db/projects").Project["actions"]} actions
 * @returns {import("cba-components/src/cba-table/cba-table").TableItem[]}
 */
function setAlertsToActions(actions) {
  return actions.map((action) => {
    if (action.type === "bg-inject")
    {
      return  {...action, alert: {
        text: warnings["bgActionsMv3"].text,
        type: "error"
      }}
    } else if (action.type === "cs-inject")
    {
      return  {...action, alert: {
        text: warnings["csActionsMv3"].text,
        type: "warning"
      }}
    }
    else {
      return {...action};
    }
  });
}

async function loadFunctions()
{
  functions.items = await customActionsDb.load();
}

async function populateActions(items)
{
  const lastSelectedProjectId = await prefs.get("lastSelectedProjectId");
  const lastSelectedActionId = await prefs.get("lastSelectedActionId");
  actionsComp.items = setAlertsToActions(items);
  const projectId = projectsComp.getSelectedItem().id;
  if (lastSelectedActionId && lastSelectedProjectId === projectId)
    actionsComp.selectRow(lastSelectedActionId, false);
  else
    selectFirstAction();
  onActionSelect();
}

async function initPlayButtonTooltip()
{
  const text = warnings["powerFullActions"].text;
  const link = warnings["powerFullActions"].link;
  const linkText = warnings["powerFullActions"].linkText;
  const heading = warnings["powerFullActions"].heading;
  const actionText = warnings["powerFullActions"].actionText;
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
  // Disabling since MV3 as we no more have "Powerful" actions.
  playButtonTooltip.disable();
}

async function onProjectSelect()
{
  const {type, actions, id} = projectsComp.getSelectedItem();
  prefs.set("lastSelectedProjectId", id);
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
  await prefs.set("lastSelectedActionId", item.id);
  actionInputs.setItem(item);
}

async function updateRecordButtonState() {
  const cbaState = await getCbaState();
  const recordButton = document.querySelector("#recordButton");
  if (cbaState.allowRec)
    recordButton.textContent = "recording...";
  else
    recordButton.textContent = "rec";
}

async function keepHighlightingPlayingAction(isPopupLoad)
{
  const cbaState = await getCbaState();
  // Update play button state
  const playButton = document.querySelector("#playButton");
  if (cbaState.paused)
    playButton.textContent = "resume";
  else
    playButton.textContent = "play";

  if(cbaState.allowPlay || cbaState.paused)
  {
    projectsComp.selectRow(cbaState.playingProjectId);
    if (cbaState.playingActionIndex >= 0)
    {
      const {id} = actionsComp.items[cbaState.playingActionIndex];
      actionsComp.selectRow(id);
    }
    setTimeout(keepHighlightingPlayingAction, 100);
  }
  else if (!isPopupLoad)
  {
    selectFirstAction();
  }
}
/**
 * @returns {Promise<import("../background/CBA").State | null>}
 */
function getCbaState() {
  return new Promise((resolve) => {
    const uuid = uuidv4();
    const onTimeout = () => {
      removeRpcListener(handler);
      resolve(null);
    }
    /** @type {RpcHandler} */
    const handler = (state) => {
      if (state.msgType === "GetStateResponse" && state.id === uuid) {
        removeRpcListener(handler);
        resolve(state.state);
      }
      clearTimeout(onTimeout);
    };
    setTimeout(onTimeout, 1000);
    addRpcListener(handler);
    sendRpcMessage({msgType: "GetState", id: uuid});
  });
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
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
        sendRpcMessage({msgType: "RecordProject", groupId: parentItem.id, projectId: id});
      }
      else {
        return notification.error(SELECT_PROJ_NOT_GROUP);
      }
      updateRecordButtonState();
      break;
    }
    case "stop": {
      notification.clean();
      sendRpcMessage({msgType: "StopProject"});
      updateRecordButtonState();
      break;
    }
    case "play": {
      /** @type {ItemPayloadDef}  */
      const selectedProject = projectsComp.getSelectedItem();
      if (!selectedProject)
        return notification.error(NO_PROJ_SELECTED);

      const {type, actions, id} = selectedProject;
      if (type === "project" && actions) {
        /** @type {HTMLInputElement} */
        const inputElem = document.querySelector("#repeat");
        const repeatTimes = inputElem.value;
        sendRpcMessage({msgType: "PlayProject", actions, repeatTimes, id});
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
