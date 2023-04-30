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
const {wait, setProjects, cbaListHasTextCount, cbaListItemSelect,
  getValue, setValue, getProjectFromStorage, getGroupFromStorage,
  getElementAttribute} = require("./utils");
const {page} = require("../main");

const {NO_GROUP_ROOT_SELECTED, NO_IMPORT_DATA, PROJECT_IMPORTED,
  NO_PROJ_GROUP_TYPE} = require("../../src/js/ui/notification");

const pageSetup = {
  path: "options.html"
}

const exportListQuery = "#exportList";
const importListQuery = "#importList";

const importInputQuery = "#automImport";
const exportOutputQuery = "#automExport";

const importButtonClick = () => page().click("#importProjects");

const defaultProjects = [{
  expanded: false,
  id: "group1",
  type: "group",
  text: "group1",
  subItems: [{
    id: "group1_project1",
    text: "project1",
    type: "project",
    actions: [
      setAction("change", "#main", "1", "group1_project1_action1"),
      setAction("", "", "", "group1_project1_action2")
    ]
  },
  {
    id: "group1_project2",
    text: "project2",
    type: "project",
    actions: [
      setAction("", "", "", "group1_project2_action3")
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
        setAction("timer", "100", "", "group2_project1_action4")
      ]
    }]
  }
];

beforeEach(async () =>
{
  await setProjects();
  await wait(50);
  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
});

it("Ensure import list is populate", async() =>
{
  await setProjects(defaultProjects);
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
  await setProjects(defaultProjects);
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
    const group = defaultProjects.filter((item) => item.text === groupText)[0];
    if (parentText)
      return group.subItems.filter((item) => item.text === text)[0];
    else
      return group;
  };
  await setProjects(defaultProjects);
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


it("Importing projects after selecting Root or group adds project(s) accordigly", async() =>
{
  const project1 = {
    id: "group1_project1",
    text: "project1",
    type: "project",
    actions: [
      setAction("change", "#main", "1", "group1_project1_action1"),
      setAction("", "", "", "group1_project1_action2")
    ]
  }
  const project2 = {
    id: "group1_project2",
    text: "project2",
    type: "project",
    actions: [
      setAction("timer", "100", "", "group1_project2_action1")
    ]
  }
  const group = {
    expanded: false,
    id: "group1",
    type: "group",
    text: "group1",
    subItems: [project1, project2]
  };

  setValue(importInputQuery, JSON.stringify(group));
  await cbaListItemSelect(importListQuery, "group");
  await importButtonClick();
  await wait(100);

  deepEqual(await getProjectFromStorage("group", "project1"), project1);
  deepEqual(await getProjectFromStorage("group", "project2"), project2);
  equal(await getNotificationMsg(), PROJECT_IMPORTED);

  setValue(importInputQuery, JSON.stringify(project1));
  await cbaListItemSelect(importListQuery, "group");
  await importButtonClick();
  const project1_1 = copyObject(project1);
  project1_1.text = `project1_1`;
  project1_1.id = "project1_1";
  deepEqual(await getProjectFromStorage("group", "project1_1"), project1_1);

  await cbaListItemSelect(importListQuery, "group");
  await importButtonClick();
  const project1_2 = copyObject(project1);
  project1_2.text = `project1_2`;
  project1_2.id = "project1_2";
  deepEqual(await getProjectFromStorage("group", "project1_2"), project1_2);

  setValue(importInputQuery, JSON.stringify(group));
  await cbaListItemSelect(importListQuery, "Root");
  await importButtonClick();

  const group1_1 = copyObject(group);
  group1_1.id = "group1_1";
  group1_1.subItems[0].id = "project1_3";
  group1_1.subItems[1].id = "project2_1";
  deepEqual(await getGroupFromStorage("group1"), group1_1);

  setValue(importInputQuery, JSON.stringify(project1));
  await cbaListItemSelect(importListQuery, "Root");
  await importButtonClick();

  const group2 = {
    expanded: false,
    id: "group2_1",
    type: "group",
    text: "group2",
    subItems: [copyObject(project1)]
  };
  group2.subItems[0].id = "project1_4";
  deepEqual(await getGroupFromStorage("group2"), group2);
});

it("Importing projects with old data after selecting Root or group adds project(s) accordigly", async() =>
{
  const oldProject1 = {
    name: "project1",
    level: "1",
    isLeaf: true,
    expanded: false,
    loaded: true,
    action: [
      {
        "data": "#main",
        "evType": "change",
        "newValue": "1"
      },
      {
        "data": "",
        "evType": "",
        "newValue": ""
      }
    ]
  };

  const oldProject2 = {
    name: "project2",
    level: "1",
    isLeaf: true,
    expanded: false,
    loaded: true,
    action: [
      {
        "data": "",
        "evType": "timer",
        "newValue": "100"
      }
    ]
  };

  const oldGroup = {
    name: "group1",
    level: "0",
    parent: "",
    isLeaf: false,
    expanded: true,
    loaded: true,
    projects: [oldProject1, oldProject2]
  };

  const project1 = {
    id: "project1",
    text: "project1",
    type: "project",
    actions: [
      setAction("change", "#main", "1"),
      setAction("", "", "")
    ]
  }
  // TODO: Add id
  const project2 = {
    id: "project2",
    text: "project2",
    type: "project",
    actions: [
      setAction("timer", "100", "")
    ]
  }
  const group = {
    expanded: false,
    id: "group1",
    type: "group",
    text: "group1",
    subItems: [project1, project2]
  };

  setValue(importInputQuery, JSON.stringify(oldGroup));
  await cbaListItemSelect(importListQuery, "group");
  await importButtonClick();
  const group1_project1 = copyObject(project1);
  group1_project1.id = "group1_project1";
  deepEqual(await getProjectFromStorage("group", "project1"), group1_project1);
  const group1_project2 = copyObject(project2);
  group1_project2.id = "group1_project2";
  deepEqual(await getProjectFromStorage("group", "project2"), group1_project2);

  setValue(importInputQuery, JSON.stringify(oldProject1));
  await cbaListItemSelect(importListQuery, "group");
  await importButtonClick();
  const project1_1 = copyObject(project1);
  project1_1.text = `project1_1`;
  deepEqual(await getProjectFromStorage("group", "project1_1"), project1_1);

  setValue(importInputQuery, JSON.stringify(oldGroup));
  await cbaListItemSelect(importListQuery, "Root");
  await importButtonClick();

  const group1_1 = copyObject(group);
  group1_1.id = "group1_1";
  group1_1.subItems[0].id = "project1_1";
  group1_1.subItems[1].id = "project2_1";
  deepEqual(await getGroupFromStorage("group1"), group1_1);
});

it("Test error messages", async() =>
{
  await importButtonClick();
  equal(await getNotificationMsg(), NO_IMPORT_DATA);

  const project = {
    id: "group1_project1",
    text: "project1",
    actions: [
    ]
  }

  setValue(importInputQuery, JSON.stringify(project));
  await importButtonClick();
  equal(await getNotificationMsg(), NO_GROUP_ROOT_SELECTED);

  setValue(importInputQuery, JSON.stringify(project));
  await cbaListItemSelect(importListQuery, "Root");
  await importButtonClick();
  equal(await getNotificationMsg(), NO_PROJ_GROUP_TYPE);
});

function getNotificationMsg()
{
  return getElementAttribute("#panel-import .notification", "textContent");
}

function copyObject(obj)
{
  return JSON.parse(JSON.stringify(obj));
}

function setAction(type, input1, input2, id)
{
  const actions = {id, type, inputs: [input1, input2]};
  if (!id)
    delete actions.id;
  return actions;
}

module.exports = {pageSetup};
