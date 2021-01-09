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
