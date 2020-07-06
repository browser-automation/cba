const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, setDefaultCollections, cbaListHasTextCount, cbaListItemExpand,
       cbaListItemSelect, cbaTableGetItem, cbaTableItemsLength,
       cbaTableSelectRow, setValue, getValue, triggerDragStart,
       getCbaListRowHandle, getCbaTableRowHandle,
       triggerDrop} = require("./utils");
const {page} = require("../main");

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

const clickAddAction = () => page().click("[data-action='addAction']");
const clickDeleteAction = () => page().click("[data-action='deleteAction']");
const clickSaveAction = () => page().click("[data-action='saveAction']");

beforeEach(async () =>
{
  await setDefaultCollections();
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

it("'Rename' button renames both project and group name in storage and projects accordingly");

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
    event: "",
    value: ""
  };
  const item1 = {
    id: "cba-table-id-1",
    texts
  };
  const item2 = {
    id: "cba-table-id-2",
    texts
  };
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), item1);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), item2);

  await page().reload({waitUntil: "domcontentloaded"});
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 0), item1);
  deepEqual(await cbaTableGetItem(cbaTableQuery, 1), item2);
});

it("'Delete' button removes selected action from the selected project", async () =>
{
  await addThreeEmptyActions();

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");
  await clickDeleteAction();
  equal(await cbaTableItemsLength(cbaTableQuery), 2);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");
  equal((await cbaTableGetItem(cbaTableQuery, 1)).id, "cba-table-id-3");

  await clickDeleteAction();
  equal(await cbaTableItemsLength(cbaTableQuery), 1);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");

  await page().reload({waitUntil: "domcontentloaded"});
  equal(await cbaTableItemsLength(cbaTableQuery), 1);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");
});

it("'Save' button updates selected action with the data from action input fields", async() =>
{
  await addThreeEmptyActions()
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  const data = "testAction1";
  const event = "bg-inject";
  const value = "testValue1";
  await setValue(inputDataQuery, data);
  await setValue(inputEventQuery, event);
  await setValue(inputValueQuery, value);

  await clickSaveAction();

  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, event, value});

  await page().reload({waitUntil: "domcontentloaded"});
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, event, value});
});

it("Selecting action populates input deselecting clears", async() =>
{
  await addThreeEmptyActions();
  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");

  const data = "testAction1";
  const event = "bg-inject";
  const value = "testValue1";

  await setValue(inputDataQuery, data);
  await setValue(inputEventQuery, event);
  await setValue(inputValueQuery, value);

  await clickSaveAction();
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, event, value});

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-1");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");

  await cbaTableSelectRow(cbaTableQuery, "cba-table-id-2");
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, event, value});

  await cbaListItemSelect(cbaListQuery, "group");
  equal(await getValue(inputDataQuery), "");
  equal(await getValue(inputEventQuery), "inject");
  equal(await getValue(inputValueQuery), "");

  await cbaListItemSelect(cbaListQuery, "project", "group");
  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data, event, value});

  equal(await getValue(inputDataQuery), data);
  equal(await getValue(inputEventQuery), event);
  equal(await getValue(inputValueQuery), value);
});



it("dragndropping from the functions table or self-organizing actions table should update actions accordingly", async() =>
{
  await addThreeEmptyActions();
  const handle = await getCbaListRowHandle(cbaFunctionsQuery, "cba-list-id-1");

  const actionTableItemIsTimer = async(index) =>
  {
    const data = "Please enter the time in milliseconds";
    const event = "timer";
    const value = "1000";
    deepEqual((await cbaTableGetItem(cbaTableQuery, index)).texts, {data, event, value});
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

  deepEqual((await cbaTableGetItem(cbaTableQuery, 1)).texts, {data: "", event: "", value: ""});
});

async function addThreeEmptyActions()
{
  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");

  await clickAddAction();
  await clickAddAction();
  await clickAddAction();

  equal(await cbaTableItemsLength(cbaTableQuery), 3);
  equal((await cbaTableGetItem(cbaTableQuery, 0)).id, "cba-table-id-1");
  equal((await cbaTableGetItem(cbaTableQuery, 1)).id, "cba-table-id-2");
  equal((await cbaTableGetItem(cbaTableQuery, 2)).id, "cba-table-id-3");
}

module.exports = {pageSetup};
