const {load: prefefinedActionsLoad, saveState: prefefinedActionsSave} = require("../db/predefinedActions");
const {load, saveState} = require("../db/collections");

const projects = document.querySelector("#projects cba-list");
const functions = document.querySelector("#functions");
const actionsComp = document.querySelector("#actions");
const actionData = document.querySelector("#actionData");
const actionEvType = document.querySelector("#actionEvType");
const actionNewValue = document.querySelector("#actionNewValue");

async function loadProjects()
{
  projects.items = await load();
  const {type, actions} = projects.getSelectedItem();
  if (type === "project")
    populateActions(actions);
  else
    populateActions([]);
}

async function loadFunctions()
{
  functions.items = await prefefinedActionsLoad();
}

function populateActions(items)
{
  actionsComp.items = items;
  onActionSelect();
}

async function onProjectSelect()
{
  const {type, actions} = projects.getSelectedItem();
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

async function onActionSelect()
{
  const {texts} = actionsComp.getSelectedItem();
  if (!texts) {
    return null;
  }
  const {data, event, value} = texts;
  actionData.value = data;
  actionNewValue.value = value;
  if (event)
    actionEvType.value = event;
  else
    actionEvType.selectedIndex = 0;
}

async function onAction(action)
{
  switch (action) {
    case "addGroup": {
      const num = getNextTextNumber(projects.items, "group");
      projects.addRow(createGroupObj(`group${num}`));
      saveState(projects.items);
      break;
    }
    case "addProject": {
      const project = projects.getSelectedItem();
      if (!project)
        return null;

      const {type, id} = project;
      const topItem = type == "group" ? project : projects.getParentItem(id);

      const num = getNextTextNumber(topItem.subItems, "project");
      projects.addRow(createProjectObj(`project${num}`), topItem.id);
      saveState(projects.items);
      break;
    }
    case "removeProject": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return null;

      const {id} = selectedProject;
      projects.deleteRow(id);
      saveState(projects.items);
      break;
    }
    case "renameProject": {
      // TBA
      break;
    }
    case "addAction": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return null;

      const {type} = selectedProject;
      if (type === "project") {
        const data = "";
        const event = "";
        const value = "";
        actionsComp.addRow({texts: {data, event, value}});
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveState(projects.items);
      }
      break;
    }
    case "deleteAction": {
      const selectedProject = projects.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedProject || !selectedAction)
        return null;

      const {type} = selectedProject;
      if (type === "project") {
        actionsComp.deleteRow(selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveState(projects.items);
      }
      break;
    }
    case "saveAction": {
      const selectedProject = projects.getSelectedItem();
      const selectedAction = actionsComp.getSelectedItem();
      if (!selectedProject || !selectedAction)
        return null;

      const {type} = selectedProject;
      if (type === "project") {
        const data = actionData.value;
        const event = actionEvType.value;
        const value = actionNewValue.value;

        actionsComp.updateRow({texts: {data, event, value}}, selectedAction.id);
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveState(projects.items);
      }
      break;
    }
    case "drop": {
      const selectedProject = projects.getSelectedItem();

      const {type} = selectedProject;
      if (type === "project") {
        selectedProject.actions = actionsComp.items;
        projects.updateRow(selectedProject, selectedProject.id);
        saveState(projects.items);
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
