const eventTypes = require("./eventTypes");
const registerActionListener = require("./actionListener");
const {load: prefefinedActionsLoad, saveState} = require("../db/predefinedActions");
const {Notification, NO_FUNCTION_NAME, NO_SELECTED_FUNCTION} = require("./notification");

const notification = new Notification("#setting3 .notification");

const inputEventType = eventTypes.init("#funcEvType");
const inputName = document.querySelector("#funcName");
const inputData = document.querySelector("#funcData");
const inputValue = document.querySelector("#funcNewValue");
const functionsList = document.querySelector("#functions");

async function loadFunctions()
{
  functionsList.items = await prefefinedActionsLoad();
}

function saveFunctionsState()
{
  return saveState(functionsList.items);
}

function onFunctionSelect()
{
  const item = functionsList.getSelectedItem();
  const {data, type, value} = item.data.texts;
  inputData.value = data;
  inputEventType.value = type;
  inputValue.value = value;
  inputName.value = item.text;
}

function onAction(action)
{
  switch (action) {
    case "addFunction": {
      const item = createFunctionItem();
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

      const item = createFunctionItem();
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

function createFunctionItem()
{
  const data = inputData.value;
  const type = inputEventType.value;
  const value = inputValue.value;
  const name = inputName.value;
  return {
    data: {
      texts: {data, type, value}
    },
    text: name
  }
}

loadFunctions();
functionsList.addEventListener("select", onFunctionSelect);
registerActionListener(onAction);
browser.storage.onChanged.addListener(({predefinedActions}) => {
  if (predefinedActions)
    loadFunctions();
});
