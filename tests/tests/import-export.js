const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, setCollections, cbaListHasTextCount, cbaListItemSelect,
  getValue} = require("./utils");
const {page} = require("../main");

const pageSetup = {
  path: "options.html"
}

const exportListQuery = "#exportList";
const importListQuery = "#importList";

const importInputQuery = "#automImport";
const exportOutputQuery = "#automExport";

const importButtonQuery = "#importProjects";

const defaultCollections = [{
  expanded: false,
  id: "group1",
  type: "group",
  text: "group1",
  subItems: [{
    id: "group1_project1",
    text: "project1",
    type: "project",
    actions: [
      setAction("group1_project1_action1", "#main", "change", "1"),
      setAction("group1_project1_action2", "", "", "")
    ]
  },
  {
    id: "group1_project2",
    text: "project2",
    type: "project",
    actions: [
      setAction("group1_project2_action3", "", "", "")
    ]
  }]
  },
  {
    expanded: true,
    id: "group2",
    type: "group",
    text: "group2",
    subItems: [{
      id: "group2_project1",
      text: "project1",
      type: "project",
      actions: [
        setAction("group2_project1_action4", "", "timer", "100")
      ]
    }]
  }
];

beforeEach(async () =>
{
  await setCollections();
  await wait(50);
  await page().reload({waitUntil: "domcontentloaded"});
});

it("Ensure import list is populate", async() =>
{
  await setCollections(defaultCollections);
  await wait(50);

  equal(await cbaListHasTextCount(importListQuery, "Root"), 1);
  equal(await cbaListHasTextCount(importListQuery, "group1"), 1);
  equal(await cbaListHasTextCount(importListQuery, "group2"), 1);
  equal(await cbaListHasTextCount(importListQuery, "project1", "group1"), 0);
  equal(await cbaListHasTextCount(importListQuery, "project2", "group1"), 0);
  equal(await cbaListHasTextCount(importListQuery, "project1", "group2"), 0);
});

it("Ensure export list is populate", async() =>
{
  await setCollections(defaultCollections);
  await wait(50);
  equal(await cbaListHasTextCount(exportListQuery, "group1"), 1);
  equal(await cbaListHasTextCount(exportListQuery, "group2"), 1);
  equal(await cbaListHasTextCount(exportListQuery, "project1", "group1"), 1);
  equal(await cbaListHasTextCount(exportListQuery, "project2", "group1"), 1);
  equal(await cbaListHasTextCount(exportListQuery, "project1", "group2"), 1);
});

it("Selecting item from export list populates export output with project or group items", async() =>
{
  const getExportedObj = async() => JSON.parse(await getValue(exportOutputQuery));
  const findCollection = (text, parentText) => {
    const groupText = parentText ? parentText : text;
    const group = defaultCollections.filter((item) => item.text === groupText)[0];
    if (parentText)
      return group.subItems.filter((item) => item.text === text)[0];
    else
      return group;
  };
  await setCollections(defaultCollections);
  await wait(50);
  let result = "";

  await cbaListItemSelect(exportListQuery, "group1");
  result = findCollection("group1");
  result.selected = false;
  deepEqual(await getExportedObj(), result);

  await cbaListItemSelect(exportListQuery, "project1", "group1");
  result = findCollection("project1", "group1");
  result.selected = false;
  deepEqual(await getExportedObj(), result);

  await cbaListItemSelect(exportListQuery, "group2");
  result = findCollection("group2");
  result.selected = false;
  result.expanded = false;
  deepEqual(await getExportedObj(), result);

  await cbaListItemSelect(exportListQuery, "project1", "group2");
  result = findCollection("project1", "group2");
  result.selected = false;
  deepEqual(await getExportedObj(), result);
});


it("Adding import items into import input, selecting Root or group adds items into the group or creates new group acccordingly", async() =>
{
  
});

function setAction(data, type, value, id)
{
  return {id, texts: {data, type, value}}
}

module.exports = {pageSetup};
