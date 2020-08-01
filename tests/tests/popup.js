const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, setCollections, cbaListHasTextCount, cbaListItemExpand,
       cbaListItemSelect, cbaTableGetItem, cbaTableItemsLength,
       cbaTableSelectRow, setValue, changeValue, getValue, isDisabled, triggerDragStart,
       getCbaListRowHandle, getCbaTableRowHandle, resetCbaObject, getSelectedRow,
       triggerDrop, getNotificationMsg, getTextContent, getCurrentWindowUrl,
       getBadgeText, isDisplayNone} = require("./utils");
const {page} = require("../main");
const {NO_ACTION_SELECTED, NO_PROJ_SELECTED,
       NO_PROJ_GROUP_SELECTED, SELECT_PROJ_NOT_GROUP,
       CHANGES_SAVED, NAME_EXISTS_GROUP,
       NAME_EXISTS_PROJECT} = require("../../src/js/ui/notification");

const pageSetup = {
  path: "popup.html"
}

const cbaTableQuery = "#actions";
const cbaListQuery = "#projects cba-list";
const cbaFunctionsQuery = "#functions";

const inputDataQuery = "#actionData";
const inputEventQuery = "#actionEvType";
const inputValueQuery = "#actionNewValue";

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
  await setCollections();
  await resetCbaObject();
  await wait(50);
  await page().reload({waitUntil: "domcontentloaded"});
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

it("'Add' button adds new empty action to the selected project", async () =>
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaTableItemsLength(cbaTableQuery), 0);

  await clickAddAction();
  await clickAddAction();
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  const texts = {
    data: "",
    type: "",
    value: ""
  };
  const item1 = {
    id: "cba-table-id-1",
    selected: true,
    texts
  };
  const item2 = {
    id: "cba-table-id-2",
    texts
  };
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), item1);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), item2);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), item1);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), item2);
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

  const data = "testAction1";
  const type = "bg-inject";
  const value = "testValue1";
  await setValue(inputDataQuery, data);
  await setValue(inputEventQuery, type);
  await setValue(inputValueQuery, value);

  await clickSaveAction();
  
  equal(await getNotificationMsg(), CHANGES_SAVED)
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, type, value});

  await page().reload({waitUntil: "domcontentloaded"});
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, type, value});
});

it("Selecting action populates input deselecting clears", async() =>
{
  await addFourEmptyActions();
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  const data = "testAction1";
  const type = "bg-inject";
  const value = "testValue1";

  await setValue(inputDataQuery, data);
  await setValue(inputEventQuery, type);
  await setValue(inputValueQuery, value);

  await clickSaveAction();
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, type, value});

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-1");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, type, value});
  equal(await getValue(inputDataQuery), data);
  equal(await getValue(inputEventQuery), type);
  equal(await getValue(inputValueQuery), value);

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await getValue(inputDataQuery), data);
  equal(await getValue(inputEventQuery), type);
  equal(await getValue(inputValueQuery), value);

  await cbaListItemSelect(cbaListQuery, "group");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");

  await cbaListItemSelect(cbaListQuery, "project", "group");
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, type, value});

  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");
});

it("dragndropping from the functions table or self-organizing actions table should update actions accordingly", async() =>
{
  await addFourEmptyActions();
  const handle = await getCbaListRowHandle(cbaFunctionsQuery, "cba-list-id-1");

  const actionTableItemIsTimer = async(index) =>
  {
    const data = "Please enter the time in milliseconds";
    const type = "timer";
    const value = "1000";
    deepEqual((await cbaTableGetItem(cbaTableQuery, index)).texts, {data, type, value});
  };

  await triggerDrop(cbaTableQuery, "cba-table-id-1", await triggerDragStart(handle));
  await actionTableItemIsTimer(1);

  await page().reload({waitUntil: "domcontentloaded"});
  await actionTableItemIsTimer(1);

  const {id} = await cbaTableGetItem(cbaTableQuery, 1);
  const tableRowHandle = await getCbaTableRowHandle(cbaTableQuery, id);

  await triggerDrop(cbaTableQuery, "cba-table-id-2", await triggerDragStart(tableRowHandle));

  await actionTableItemIsTimer(2);
  await page().reload({waitUntil: "domcontentloaded"});
  await actionTableItemIsTimer(2);

  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data: "", type: "", value: ""});
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
    "submit-click": [false, true],
    "update": [true, true],
    "timer": [true, false],
    "redirect": [false, true],
    "copy": [false, true],
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
  await updateSpecificAction("cba-table-id-1", "", "timer", "90");
  await updateSpecificAction("cba-table-id-2", "", "timer", "90");
  await updateSpecificAction("cba-table-id-3", "", "timer", "90");

  await clickPlay();
  await wait(110);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");
  
  await wait(310);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-2");
  equal(await getBadgeText(), "play");

  await wait(250);
  equal((await getSelectedRow(cbaTableQuery)).id, "cba-table-id-1");
  equal(await getBadgeText(), "");
});

it("Clicking record button adds redirect event to the selected project", async() => {
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  await clickRecord();
  const data = await getCurrentWindowUrl();
  const type = "redirect";
  const value = "";
  const msgType = "RecordedEvent";
  deepEqual((await cbaTableGetItem(cbaTableQuery, 0)).texts, {data, type, value, msgType});
  equal(await getTextContent("#recordButton"), "recording...");
  equal(await getBadgeText(), "rec");

  await clickStop();
  equal(await getTextContent("#recordButton"), "rec");
  equal(await getBadgeText(), "");
});

async function addFourEmptyActions()
{
  return addEmptyActions(4);
}

async function addEmptyActions(amount)
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  for (let index = 0; index < amount; index++)
    await clickAddAction();

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
