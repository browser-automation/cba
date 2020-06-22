const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, setDefaultCollections, cbaListHasTextCount, cbaListItemExpand,
       cbaListItemSelect} = require("./utils");
const {page} = require("../main");

const pageSetup = {
  path: "popup.html"
}

beforeEach(async () =>
{
  await setDefaultCollections();
});

it("'G+' button adds new group item with unique text", async() =>
{
  const action = "addGroup";
  const buttonQuery = `[data-action="${action}"]`;
  const cbaListQuery = "#projects";
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 0);
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group1"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "group2"), 0);
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group2"), 1);
});

it("'+' button adds new project item with unique text", async() =>
{
  const action = "addProject";
  const buttonQuery = `[data-action="${action}"]`;
  const cbaListQuery = "#projects";
  
  await cbaListItemExpand(cbaListQuery, "group");
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 0);
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 0);
  await cbaListItemSelect(cbaListQuery, "project", "group");
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project1", "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project2", "group"), 0);
  await cbaListItemSelect(cbaListQuery, "group");
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "project2", "group"), 1);
});

it("'-' button removes both project and group from items", async() =>
{
  const action = "removeProject";
  const buttonQuery = `[data-action="${action}"]`;
  const cbaListQuery = "#projects";

  await cbaListItemExpand(cbaListQuery, "group");
  await cbaListItemSelect(cbaListQuery, "project", "group");
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 1);
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 1);
  equal(await cbaListHasTextCount(cbaListQuery, "project", "group"), 0);
  await cbaListItemSelect(cbaListQuery, "group");
  await page().click(buttonQuery);
  await wait();
  equal(await cbaListHasTextCount(cbaListQuery, "group"), 0);
});


it("'Rename' button renames both project and group name in storage and projects accordingly");

module.exports = {pageSetup};
