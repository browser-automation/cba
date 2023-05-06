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
const {wait, setProjects, cbaListHasTextCount, cbaListItemExpand,
       cbaListItemSelect, cbaTableGetItem, cbaTableItemsLength,
       cbaTableSelectRow, setValue, changeValue, getValue, isDisabled, triggerDragStart,
       getCbaListRowHandle, getCbaTableRowHandle, resetCbaObject, getSelectedRow,
       triggerDrop, getNotificationMsg, getTextContent, getCurrentWindowUrl,
       getBadgeText, isDisplayNone, cbaTableUnselectRow, cbaTooltipGetHeader,
       cbaTooltipGetParagraph, cbaTooltipGetLink, hoverElement,
       cbaListGetTooltipText, cbaListItemsByText,
       cbaListhoverRowInfo, cbaTooltipClickAction} = require("./utils");
const {page} = require("../main");
const {NO_ACTION_SELECTED, NO_PROJ_SELECTED,
       NO_PROJ_GROUP_SELECTED, SELECT_PROJ_NOT_GROUP,
       CHANGES_SAVED, NAME_EXISTS_GROUP, NAME_EXISTS_PROJECT,
       PROJECT_EDIT} = require("../../src/js/ui/notification");

const {predefined} = require("../../src/js/db/customActions");

const pageSetup = {
  path: "popup.html"
}

const cbaTableQuery = "#actions";
const cbaListQuery = "#projects cba-list";
const cbaFunctionsQuery = "#functions";

const inputDataQuery = "#actionData";
const inputEventQuery = "#actionEvType";
const inputValueQuery = "#actionNewValue";

const actionInfoQuery = "#actionInfo";
const playButtonTooltipQuery = "#playButtonTooltip";

const clickAddGroup = () => page().click("[data-action='addGroup']");
const clickAddProject = () => page().click("[data-action='addProject']");
const clickRemoveProject = () => page().click("[data-action='removeProject']");
const clickRenameProject = () => page().click("[data-action='renameProject']");
const clickSaveProject = () => page().click("[data-action='saveProject']");

const clickAddAction = () => page().click("[data-action='addAction']");
const clickDeleteAction = () => page().click("[data-action='deleteAction']");
const clickSaveAction = () => page().click("[data-action='saveAction']");

const clickPlay = () => page().click("[data-action='play']");
const clickRecord = () => page().click("[data-action='record']");
const clickStop = () => page().click("[data-action='stop']");

beforeEach(async () =>
{
  await setProjects();
  await resetCbaObject();
  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
});

it("'G+' button adds new group item with unique text", async() =>
{
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 0);

  await clickAddGroup();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "group2"), 0);

  await clickAddGroup();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group2"), 1);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "group2"), 1);
});

it("'+' button adds new project item with unique text", async() =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 0);

  await clickAddProject();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 0);

  await cbaListItemSelect(cbaListQuery, "project", "group");
  await clickAddProject();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project2", "group"), 0);

  await cbaListItemSelect(cbaListQuery, "group");
  await clickAddProject();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project2", "group"), 1);

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project2", "group"), 1);
});

it("'-' button removes both project and group from items", async() =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 1);

  await clickRemoveProject();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 0);
  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 0);

  await cbaListItemSelect(cbaListQuery, "group");
  await clickRemoveProject();
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 0);
  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 0);
});

it("'Rename' and 'save' buttons rename project or group accordingly", async() =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  await clickAddProject();
  await clickAddGroup();

  ok(await isDisplayNone("#renameBtn"));
  notOk(await isDisplayNone("#saveBtn"))

  await clickRenameProject();
  notOk(await isDisplayNone("#renameBtn"));
  ok(await isDisplayNone("#saveBtn"))

  page().keyboard.press("ArrowDown");
  page().keyboard.type("1");
  await clickSaveProject();
  equal(await getNotificationMsg(), NAME_EXISTS_PROJECT);

  page().keyboard.type("1");
  await clickSaveProject();
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 0);
  equal(await cbaListHasTextCount(cbaListQuery, "project11", "group"), 1);
  ok(await isDisplayNone("#renameBtn"));
  notOk(await isDisplayNone("#saveBtn"))

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 0);
  equal(await cbaListHasTextCount(cbaListQuery, "project11", "group"), 1);

  await cbaListItemSelect(cbaListQuery, "group");
  await clickRenameProject();

  page().keyboard.press("ArrowDown");
  page().keyboard.type("1");
  await clickSaveProject();
  equal(await getNotificationMsg(), NAME_EXISTS_GROUP);

  page().keyboard.type("1");
  await clickSaveProject();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 0);
  equal(await cbaListHasTextCount(cbaListQuery, "group11"), 1);

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 0);
  equal(await cbaListHasTextCount(cbaListQuery, "group11"), 1);
});

it("'Enter' key saves project name when renaming", async() =>
{
  await cbaListItemSelect(cbaListQuery, "project", "group");
  await clickRenameProject();

  page().keyboard.type("1");
  page().keyboard.press("Enter");

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 0);
});

it("During rename, buttons other than 'save' show notification about edit and don't execute", async() =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "group");
  await clickRenameProject();

  await clickRemoveProject();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);

  await clickAddGroup();
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 0);

  equal(await getNotificationMsg(), PROJECT_EDIT);
  notOk(await isDisplayNone("#renameBtn"));
  ok(await isDisplayNone("#saveBtn"))

  await clickSaveProject();
  await wait(30);

  equal(await getNotificationMsg(), "");
  ok(await isDisplayNone("#renameBtn"));
  notOk(await isDisplayNone("#saveBtn"));

  await clickRenameProject();
  notOk(await isDisplayNone("#renameBtn"));
  ok(await isDisplayNone("#saveBtn"))
  await clickSaveProject();
  await wait(30);

  ok(await isDisplayNone("#renameBtn"));
  notOk(await isDisplayNone("#saveBtn"));
});

it("'Add' button adds new empty action to the selected project", async () =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaTableItemsLength(cbaTableQuery), 0);

  const createEmptyItem = (id, selected) =>
  {
    if (selected === undefined)
      return {id, type: "", inputs: ["", ""]};
    else 
      return {id, selected, type: "", inputs: ["", ""]};
  }

  await clickAddAction();
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), createEmptyItem("cba-table-id-1", true));

  await clickAddAction();
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), createEmptyItem("cba-table-id-2", true));
  equal(await cbaTableItemsLength(cbaTableQuery), 2);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), createEmptyItem("cba-table-id-1"));
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), createEmptyItem("cba-table-id-2", true));

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-1");
  await clickAddAction();
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), createEmptyItem("cba-table-id-3", true));

  cbaTableUnselectRow(cbaTableQuery, "cba-table-id-3");
  await clickAddAction();
  deepEqual(await cbaTableGetItem(cbaTableQuery, 3), createEmptyItem("cba-table-id-4", true));
});

it("'Delete' button removes selected action from the selected project", async () =>
{
  await addFourEmptyActions();

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");
  await clickDeleteAction();
  equal(await cbaTableItemsLength(cbaTableQuery), 3);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");
  equal((await cbaTableGetItem(cbaTableQuery, 1)).id, "cba-table-id-3");

  await clickDeleteAction();
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");
});

it("'Save' button updates selected action with the data from action input fields", async() =>
{
  await addFourEmptyActions()
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  const type = "bg-inject";
  const input1 = "testAction1";
  const input2 = "testValue1";
  await setValue(inputEventQuery, type);
  await setValue(inputDataQuery, input1);
  await setValue(inputValueQuery, input2);

  await clickSaveAction();
  
  equal(await getNotificationMsg(), CHANGES_SAVED)
  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), type, [input1, input2]);

  await page().reload({waitUntil: "domcontentloaded"});
  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), type, [input1, input2]);
});

it("Selecting action populates input deselecting clears", async() =>
{
  await addFourEmptyActions();
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  const type = "bg-inject";
  const input1 = "testAction1";
  const input2 = "testValue1";

  await setValue(inputDataQuery, input1);
  await setValue(inputEventQuery, type);
  await setValue(inputValueQuery, input2);

  await clickSaveAction();
  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), type, [input1, input2]);

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-1");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");
  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), type, [input1, input2]);
  equal(await getValue(inputEventQuery), type);
  equal(await getValue(inputDataQuery), input1);
  equal(await getValue(inputValueQuery), input2);

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await getValue(inputEventQuery), type);
  equal(await getValue(inputDataQuery), input1);
  equal(await getValue(inputValueQuery), input2);

  await cbaListItemSelect(cbaListQuery, "group");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputValueQuery), "");

  await cbaListItemSelect(cbaListQuery, "project", "group");
  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), type, [input1, input2]);

  equal(await getValue(inputEventQuery), type);
  equal(await getValue(inputDataQuery), input1);
  equal(await getValue(inputValueQuery), input2);
});

it("dragndropping from the functions table or self-organizing actions table should update actions accordingly", async() =>
{
  await addFourEmptyActions();
  const handle = await getCbaListRowHandle(cbaFunctionsQuery, "cba-list-id-1");

  const actionTableItemIsTimer = async(index) =>
  {
    const type = "timer";
    const input1 = "1000";
    const input2 = "Please enter the time in milliseconds";
    const item = await cbaTableGetItem(cbaTableQuery, index);
    equal(item.type, type);
    deepEqual(item.inputs, [input1, input2]);
  };

  await triggerDrop(cbaTableQuery, "cba-table-id-1", await triggerDragStart(handle));
  await actionTableItemIsTimer(0);

  await page().reload({waitUntil: "domcontentloaded"});
  await actionTableItemIsTimer(0);

  const {id} = await cbaTableGetItem(cbaTableQuery, 0);
  const tableRowHandle = await getCbaTableRowHandle(cbaTableQuery, id);

  await triggerDrop(cbaTableQuery, "cba-table-id-3", await triggerDragStart(tableRowHandle));

  await actionTableItemIsTimer(2);
  await page().reload({waitUntil: "domcontentloaded"});
  await actionTableItemIsTimer(2);

  itemHasTypeAndInputs(await cbaTableGetItem(cbaTableQuery, 1), "", ["", ""]);
});

it("Changing action selectbox disables fields accordingly", async() =>
{
  // [data, value]
  const disableState = {
    "inject": [false, true],
    "cs-inject": [false, true],
    "bg-inject": [false, true],
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
    await changeValue(inputEventQuery, type);
    equal(await isDisabled(inputDataQuery), dataVisible, `${type}'s data should${dataVisible ? "": " not"} be disabled`);
    equal(await isDisabled(inputValueQuery), valueVisible, `${type}'s value should${valueVisible ? "": " not"} be disabled`);
  }
});

it("Test error messages", async() =>
{
  await clickAddProject();
  equal(await getNotificationMsg(), NO_PROJ_GROUP_SELECTED);

  await clickRemoveProject();
  equal(await getNotificationMsg(), NO_PROJ_GROUP_SELECTED);

  await clickRenameProject();
  equal(await getNotificationMsg(), NO_PROJ_GROUP_SELECTED);

  await clickPlay();
  equal(await getNotificationMsg(), NO_PROJ_SELECTED);

  await clickRecord();
  equal(await getNotificationMsg(), NO_PROJ_SELECTED);

  await clickAddAction();
  equal(await getNotificationMsg(), NO_PROJ_SELECTED);

  await clickDeleteAction();
  equal(await getNotificationMsg(), NO_ACTION_SELECTED);

  await clickSaveAction();
  equal(await getNotificationMsg(), NO_ACTION_SELECTED);

  await cbaListItemSelect(cbaListQuery, "group");
  await clickAddAction();
  equal(await getNotificationMsg(), SELECT_PROJ_NOT_GROUP);

  await clickPlay();
  equal(await getNotificationMsg(), SELECT_PROJ_NOT_GROUP);

  await clickRecord();
  equal(await getNotificationMsg(), SELECT_PROJ_NOT_GROUP);
});

it("Selecting project and actions is remembered after reload", async() =>
{
  notOk(await getSelectedRow(cbaListQuery));
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  await page().reload({waitUntil: "domcontentloaded"});
  ok(await getSelectedRow(cbaListQuery));
  equal((await getSelectedRow(cbaListQuery)).text, "project");

  await addFourEmptyActions();
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  await page().reload({waitUntil: "domcontentloaded"});
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");

  await resetCbaObject();
  await page().reload({waitUntil: "domcontentloaded"});
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-1");
});

it("Actions are being updated while playing", async() =>
{
  await addFourEmptyActions();

  await updateSpecificAction("cba-table-id-1", "", "timer", "90");
  await updateSpecificAction("cba-table-id-2", "", "timer", "90");
  await updateSpecificAction("cba-table-id-3", "", "timer", "190");
  await updateSpecificAction("cba-table-id-4", "", "timer", "200");
  await clickPlay();

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-3");

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-3");

  await wait(200);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-4");

  await wait(250);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-1");
});

it("When paused play button becomes 'resume', when clicked resumes playback", async() => {
  await addFourEmptyActions();

  await updateSpecificAction("cba-table-id-1", "", "timer", "90");
  await updateSpecificAction("cba-table-id-2", "", "timer", "90");
  await updateSpecificAction("cba-table-id-3", "", "pause", "");
  await updateSpecificAction("cba-table-id-4", "", "timer", "190");

  await clickPlay();

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-3");

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-3");
  equal(await getTextContent("#playButton"), "resume");

  await clickPlay();
  equal(await getTextContent("#playButton"), "play");
  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-4");
  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-1");
});

it("Setting repeate should repeate the project, specified amount of times", async() =>
{
  await setValue("#repeat", 2);
  await addEmptyActions(3);
  await updateSpecificAction("cba-table-id-1", "", "timer", "100");
  await updateSpecificAction("cba-table-id-2", "", "timer", "100");
  await updateSpecificAction("cba-table-id-3", "", "timer", "100");

  await clickPlay();
  await wait(110);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");
  
  await wait(350);
  equal(await getBadgeText(), "play");
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");

  await wait(250);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-1");
  equal(await getBadgeText(), "");
});

it("Clicking record button adds redirect event to the selected project", async() => {
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  await clickRecord();
  const type = "redirect";
  const input1 = await getCurrentWindowUrl();
  const input2 = "";
  const msgType = "RecordedEvent";
  const item = await cbaTableGetItem(cbaTableQuery, 0);
  itemHasTypeAndInputs(item, type, [input1, input2]);
  equal(item.msgType, msgType);
  equal(await getTextContent("#recordButton"), "recording...");
  equal(await getBadgeText(), "rec");

  await clickStop();
  equal(await getTextContent("#recordButton"), "rec");
  equal(await getBadgeText(), "");
});

it("click and bg-function actions doesn't stop project execution on error", async() =>
{
  await addEmptyActions(3);
  await updateSpecificAction("cba-table-id-1", "#non-existing", "click", "");
  await updateSpecificAction("cba-table-id-2", "<$function=invalidMethod>", "bg-function", "");
  await updateSpecificAction("cba-table-id-3", "", "timer", "150");

  await clickPlay();

  await wait(100);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-3");
  equal(await getBadgeText(), "play");

  await wait(100);
  equal(await getBadgeText(), "");
});

it("Selecting a project that has 'bg-inject' or 'cs-inject' shows powerful actions tooltip unless 'Hide message' is clicked", async() =>
{
  const projects = [{
    id: "group",
    text: "group",
    type: "group",
    expanded: false,
    subItems: [
      {
        id: "project",
        text: "project",
        type: "project",
        actions: [{type: "cs-inject", inputs: ["alert('Hello from CBA!')", ""]}]
      },
      {
        id: "project1",
        text: "project1",
        type: "project",
        actions: [{type: "bg-inject", inputs: ["alert('Hello from CBA!')", ""]}]
      },
      {
        id: "project2",
        text: "project2",
        type: "project",
        actions: [{type: "inject", inputs: ["alert('Hello from CBA!')", ""]}]
      }
    ]
  }];
  await setProjects(projects);

  await cbaListItemExpand(cbaListQuery, "group");

  ok(await isDisabled(playButtonTooltipQuery));

  await cbaListItemSelect(cbaListQuery, "project", "group");
  notOk(await isDisabled(playButtonTooltipQuery));

  await cbaListItemSelect(cbaListQuery, "project1", "group");
  notOk(await isDisabled(playButtonTooltipQuery));
  await cbaListItemSelect(cbaListQuery, "project2", "group");
  ok(await isDisabled(playButtonTooltipQuery));

  await cbaListItemSelect(cbaListQuery, "project", "group");
  notOk(await isDisabled(playButtonTooltipQuery));
  await hoverElement(playButtonTooltipQuery);
  await cbaTooltipClickAction(playButtonTooltipQuery);
  ok(await isDisabled(playButtonTooltipQuery));

  await cbaListItemSelect(cbaListQuery, "project1", "group");
  ok(await isDisabled(playButtonTooltipQuery));
});

it("Functions cba-list items contain tooltip with description about each of them", async() =>
{
  for (const {info, text} of predefined) {
    const [item] = await cbaListItemsByText(cbaFunctionsQuery, text);
    await cbaListhoverRowInfo(cbaFunctionsQuery, item.id);
    const {description} = info;
    equal(await cbaListGetTooltipText(cbaFunctionsQuery), description);
  }
});

it("Changing action updates information with the action information accordingly.", async() =>
{
  const actionTypes = require("../../src/js/ui/actionsTypes");
  for (const {name, description, link} of actionTypes)
  {
    await changeValue(inputEventQuery, name);
    await hoverElement(inputEventQuery);
    await hoverElement(actionInfoQuery);
    equal(await cbaTooltipGetHeader(actionInfoQuery), name);
    equal(await cbaTooltipGetParagraph(actionInfoQuery), description);
    equal(await cbaTooltipGetLink(actionInfoQuery), link);
  }
});

function itemHasTypeAndInputs(item, type, inputs)
{
  equal(item.type, type);
  deepEqual(item.inputs, inputs);
}

async function addFourEmptyActions()
{
  return addEmptyActions(4);
}

async function addEmptyActions(amount)
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  for (let index = 0; index < amount; index++) {
    await clickAddAction();
    await wait(50);
  }

  equal(await cbaTableItemsLength(cbaTableQuery), amount);

  for (let index = 0; index < amount; index++)
    equal((await cbaTableGetItem(cbaTableQuery, index)).id, `cba-table-id-${index + 1}`);
}

async function updateSpecificAction(id, data, type, value)
{
  await cbaTableSelectRow(cbaTableQuery, id);

  await setValue(inputDataQuery, data);
  await setValue(inputEventQuery, type);
  await setValue(inputValueQuery, value);
  await clickSaveAction();
}

module.exports = {pageSetup};
