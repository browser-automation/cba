const eventTypes = require("./eventTypes");
const registerActionListener = require("./actionListener");
const customActionsDb = require("../db/customActions");
const {Notification, NO_FUNCTION_NAME, NO_SELECTED_FUNCTION} = require("./notification");

const notification = new Notification("#panel-functions .notification");

const inputEventType = eventTypes.init("#funcEvType");
const inputName = document.querySelector("#funcName");
const inputData = document.querySelector("#funcData");
const inputValue = document.querySelector("#funcNewValue");
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
  const {type, inputs} = item.data;
  const [input1, input2] = inputs;
  inputName.value = item.text;
  inputEventType.value = type;
  inputData.value = input1;
  inputValue.value = input2;
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
  const type = inputEventType.value;
  const input1 = inputData.value;
  const input2 = inputValue.value;
  const name = inputName.value;
  return {
    data: {
      type, inputs: [input1, input2]
    },
    text: name
  }
}

loadFunctions();
functionsList.addEventListener("select", onFunctionSelect);
registerActionListener(onAction);
browser.storage.onChanged.addListener((result) => {
  if (result[customActionsDb.name])
    loadFunctions();
});
