const {load, remove, addGroup, addProject} = require("../db/collections");

const projects = document.querySelector("#projects");
const actions = document.querySelector("#actions");

async function loadProjects()
{
  projects.items = await load();
}

function populateActions(actions)
{
  console.log(actions);
}

async function onProjectSelect()
{
  const {type, actions} = projects.getSelectedItem();
  if (type === "project")
    populateActions(actions);
}

async function onAction(action)
{
  switch (action) {
    case "addGroup": {
      await addGroup();
      break;
    }
    case "addProject": {
      const project = projects.getSelectedItem();
      if (!project)
        return null;

      const {type, id} = project;
      const topItem = type == "group" ? project : projects.getParentItem(id);
      addProject(topItem.text);
      break;
    }
    case "removeProject": {
      const selectedProject = projects.getSelectedItem();
      if (!selectedProject)
        return null;

      const {type, id} = selectedProject;
      const parentItem = projects.getParentItem(id);
      if (type === "group") {
        remove(selectedProject.text);
      }
      else {
        remove(selectedProject.text, parentItem.text);
      }
      break;
    }
    case "renameProject": {
      // TBA
      break;
    }
    default:
      break;
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
projects.addEventListener("select", onProjectSelect);
registerActionListener(onAction);
browser.storage.onChanged.addListener(({collections}) => {
  if (collections)
    loadProjects();
});
