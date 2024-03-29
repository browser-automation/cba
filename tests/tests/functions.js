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

const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, setCustomActions, getElementAttribute,
  getValue, cbaListItemSelect, setValue, cbaListHasTextCount,
  getFunctionFromStorage, changeValue, isDisabled} = require("./utils");
const {page} = require("../main");

const {NO_FUNCTION_NAME,
  NO_SELECTED_FUNCTION} = require("../../src/js/ui/notification");

const pageSetup = {
  path: "options.html"
}

const addButtonClick = () => page().click("[data-action='addFunction']");
const deleteButtonClick = () => page().click("[data-action='deleteFunction']");
const saveButtonClick = () => page().click("[data-action='saveFunction']");
const optionTabClick = () => page().click("#functions-tab");

const inputNameQuery = "#funcName";
const inputDescriptionQuery = "#funcDescription";
const inputLinkQuery = "#funcLink";
const inputDataQuery = "#funcData";
const inputTypeQuery = "#funcEvType";
const inputValueQuery = "#funcNewValue";

const functionsList = "#functions";

beforeEach(async () =>
{
  await setCustomActions();
  await wait(50);
  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  await optionTabClick();
});

it("Selecting function populates inputs accordingly", async() =>
{
  const link = "";

  await cbaListItemSelect(functionsList, "Timer");
  const timerType = "timer";
  const timerInput1 = "Please enter the time in milliseconds";
  const timerInput2 = "1000";
  const timerDescription = "Stops workflow of project for mentioned period in milliseconds then continue with it.";
  await ensureInputValues("Timer", timerDescription, link, timerInput1, timerType, timerInput2);

  const updateType = "update";
  const updateInput1 = "this event will let the script wait for page update";
  const updateInput2 = "";
  const updateDescription = "This action will let the execution flow wait for page update/load and then continue with it.";
  await cbaListItemSelect(functionsList, "Update");
  await ensureInputValues("Update", updateDescription, link, updateInput1, updateType, updateInput2);
});

it("Changing action selectbox disables fields accordingly", async() =>
{
  // [data, value]
  const disableState = {
    "inject": [false, true],
    "cs-inject": [false, true],
    "bg-function": [false, true],
    "change": [false, false],
    "check": [false, true],
    "click": [false, true],
    "click-update": [false, true],
    "update": [true, true],
    "timer": [true, false],
    "redirect": [false, true],
    "copy": [false, true],
    "copy-html": [false, true],
    "pause": [true, true],
  }

  for (const type in disableState) {
    const [dataVisible, valueVisible] = disableState[type];
    await changeValue(inputTypeQuery, type);
    equal(await isDisabled(inputDataQuery), dataVisible, `${type}'s data should${dataVisible ? "": " not"} be disabled`);
    equal(await isDisabled(inputValueQuery), valueVisible, `${type}'s value should${valueVisible ? "": " not"} be disabled`);
  }
});

it("Clicking 'add' button creates new function with specified input data", async() =>
{
  const name = "New function";
  const type = "inject";
  const input1 = "test1";
  const input2 = "test2";
  const description = "Function description";
  const link = "https://example.com";
  
  const info = {description, link};
  const inputs = [input1, input2];
  await setInputs(name, type, inputs, info);
  await addButtonClick();

  const func = await getFunctionFromStorage(name);
  delete func.id;
  deepEqual(func, {text: name, data: {type, inputs: inputs}, info})
  
  equal(await cbaListHasTextCount(functionsList, "New function"), 1);
  await cbaListItemSelect(functionsList, "New function");
  await ensureInputValues(name, description, link, input1, type, input2);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(30);

  equal(await cbaListHasTextCount(functionsList, "New function"), 1);
  await cbaListItemSelect(functionsList, "New function");
  await ensureInputValues(name, description, link, input1, type, input2);

  await addButtonClick();
  equal(await cbaListHasTextCount(functionsList, "New function"), 2);
});

it("Clicking 'delete' button deletes selected function", async() =>
{
  equal(await cbaListHasTextCount(functionsList, "Update"), 1);
  await cbaListItemSelect(functionsList, "Update");
  await deleteButtonClick();
  equal(await cbaListHasTextCount(functionsList, "Update"), 0);

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(functionsList, "Update"), 0);
});

it("Clicking 'save' button updates selected function with the specified input data", async() =>
{
  await cbaListItemSelect(functionsList, "Update");
  const data = "new Data";
  const type = "inject";
  const value = "New value";
  const description = "New Description";
  const link = "https://chrome-automation.com"
  await setValue(inputDataQuery, data);
  await setValue(inputTypeQuery, type);
  await setValue(inputValueQuery, value);
  await setValue(inputDescriptionQuery, description);
  await setValue(inputLinkQuery, link);
  await saveButtonClick();

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  await cbaListItemSelect(functionsList, "Update");
  await ensureInputValues("Update", description, link, data, type, value);
  equal(await cbaListHasTextCount(functionsList, "Update"), 1);

  await setValue(inputNameQuery, "New function");
  await saveButtonClick();
  equal(await cbaListHasTextCount(functionsList, "Update"), 0);
  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(functionsList, "Update"), 0);
  equal(await cbaListHasTextCount(functionsList, "New function"), 1);

  await cbaListItemSelect(functionsList, "New function");
  await ensureInputValues("New function", description, link, data, type, value);
});

it("Test error messages", async() =>
{
  await addButtonClick();
  equal(await getNotificationMsg(), NO_FUNCTION_NAME);

  await deleteButtonClick();
  equal(await getNotificationMsg(), NO_SELECTED_FUNCTION);

  await saveButtonClick();
  equal(await getNotificationMsg(), NO_SELECTED_FUNCTION);

  await cbaListItemSelect(functionsList, "Update");
  await setValue(inputNameQuery, "");
  await saveButtonClick();
  equal(await getNotificationMsg(), NO_FUNCTION_NAME);
});

function getNotificationMsg()
{
  return getElementAttribute("#panel-functions .notification", "textContent");
}

async function ensureInputValues(name, description, link, data, type, value)
{
  const currentName = await getValue(inputNameQuery);
  const currentData = await getValue(inputDataQuery);
  const currentType = await getValue(inputTypeQuery);
  const currentValue = await getValue(inputValueQuery);
  const currentDescription = await getValue(inputDescriptionQuery);
  const currentLink = await getValue(inputLinkQuery);

  equal(currentName, name);
  equal(currentDescription, description);
  equal(currentLink, link)
  equal(currentData, data);
  equal(currentType, type);
  equal(currentValue, value);
}

async function setInputs(name, type, inputs, info)
{
  const [input1, input2] = inputs;
  const {description, link} = info;
  await setValue(inputNameQuery, name);
  await setValue(inputTypeQuery, type);
  await setValue(inputDataQuery, input1);
  await setValue(inputValueQuery, input2);
  await setValue(inputDescriptionQuery, description);
  await setValue(inputLinkQuery, link);
}

module.exports = {pageSetup};
