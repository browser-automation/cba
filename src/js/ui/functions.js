const registerActionListener = require("./actionListener");
const customActionsDb = require("../db/customActions");
const {Notification, NO_FUNCTION_NAME, NO_SELECTED_FUNCTION} = require("./notification");
const ActionInputs = require("./ActionInputs");

const notification = new Notification("#panel-functions .notification");
const actionInputs = new ActionInputs({type: "#funcEvType",
                                       inputs: ["#funcData", "#funcNewValue"],
                                       text: "#funcName",
                                       info: {description: "#funcDescription",
                                              link: "#funcLink"}});

const functionsList = document.querySelector("#functions");

async function loadFunctions()
{
  functionsList.items = await customActionsDb.load();
}

function saveFunctionsState()
{
  return customActionsDb.saveState(functionsList.items);
}

function onFunctionSelect()
{
  const item = functionsList.getSelectedItem();
  actionInputs.setItem(item);
}

function onAction(action)
{
  switch (action) {
    case "addFunction": {
      const item = actionInputs.getItem();
      if (!item.text) {
        notification.error(NO_FUNCTION_NAME);
        return;
      }
      
      functionsList.addRow(item);
      saveFunctionsState();
      break;
    }
    case "deleteFunction": {
      const selectedFunction = functionsList.getSelectedItem();
      if (!selectedFunction) {
        notification.error(NO_SELECTED_FUNCTION);
        return;
      }
      functionsList.deleteRow(selectedFunction.id);
      saveFunctionsState();
      break;
    }
    case "saveFunction": {
      const selectedFunction = functionsList.getSelectedItem();
      if (!selectedFunction) {
        notification.error(NO_SELECTED_FUNCTION);
        return;
      }

      const item = actionInputs.getItem();
      if (!item.text) {
        notification.error(NO_FUNCTION_NAME);
        return;
      }
      functionsList.updateRow(item, selectedFunction.id);
      saveFunctionsState();
      break;
    }
    default:
      break;
  }
}

loadFunctions();
functionsList.addEventListener("select", onFunctionSelect);
registerActionListener(onAction);
browser.storage.onChanged.addListener((result) => {
  if (result[customActionsDb.name])
    loadFunctions();
});
