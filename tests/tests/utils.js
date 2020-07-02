const {backgroundPage, page} = require("../main");

async function setTestProject()
{
  const dataObj = {
    "testGroup": {
      "name": "testGroup",
      "level": "0",
      "parent": "",
      "isLeaf": false,
      "expanded": true,
      "loaded": true,
      "projects": [{
        "action": [],
        "name": "testProject",
        "level": "1",
        "isLeaf": true,
        "expanded": false,
        "loaded": true
      }]
    }
  };
  return backgroundPage().evaluate((data) => localStorage.setItem("data", JSON.stringify(data)) , dataObj);
}

async function setWindowLocalStorage(key, data)
{
  return backgroundPage().evaluate((key, data) => localStorage.setItem(key, JSON.stringify(data)) , key, data);
}

async function getWindowLocalStorage(key)
{
  return backgroundPage().evaluate((key) => JSON.parse(localStorage.getItem(key)) , key);
}

async function reloadExtension()
{
  return backgroundPage().evaluate(() => browser.runtime.reload());
}

async function setDefaultCollections()
{
    const collections = [{
      text: "group",
      type: "group",
      expanded: false,
      subItems: [
        {
          text: "project",
          type: "project",
          actions: []
        }
      ]
    }];
  return backgroundPage().evaluate(async(collections) => await browser.storage.local.set({collections}), collections);
}

async function cbaListHasTextCount(query, text, parentText)
{
  const items = await cbaListItemsByText(query, text, parentText);
  if (!items)
    return 0;
  else
    return items.length;
}

async function cbaListItemsByText(query, text, parentText)
{
  return page().evaluate(async(query, text, parentText) => {
    let items = document.querySelector(query).items;
    if (parentText)
    {
      const {subItems} = items.filter((item) => item.text === parentText)[0];
      if (!subItems)
        return null;
      else
        items = subItems;
    }
    return items.filter((item) => item.text === text);
  }, query, text, parentText);
}

async function cbaListItemExpand(query, text)
{
  const [item] = await cbaListItemsByText(query, text);
  return page().evaluate(async(query, id) => {
    return document.querySelector(query).setExpansion(id, true);
  }, query, item.id);
}

async function cbaListItemSelect(query, text, parentText)
{
  const [item] = await cbaListItemsByText(query, text, parentText);
  return page().evaluate(async(query, id) => {
    return document.querySelector(query).selectRow(id);
  }, query, item.id);
}

async function cbaTableItemsLength(query)
{
  return page().evaluate(async(table) => {
    return table.items.length;
  }, await page().$(query));
}

async function cbaTableGetItem(query, itemIndex)
{
  return page().evaluate(async(table, itemIndex) => {
    return table.items[itemIndex];
  }, await page().$(query), itemIndex);
}

async function cbaTableSelectRow(query, id)
{
  return page().evaluate(async(table, id) => {
    return table.selectRow(id);
  }, await page().$(query), id);
}

async function startTestRecording()
{
  const projectId = "testProject";
  const projectObj = {
    "isProject": true,
    "project": `${projectId}`,
    "group": "testGroup",
  };
  return backgroundPage().evaluate((projectObj, projectId) => cba.recordButtonClick(projectObj, projectId) , projectObj, projectId);
}

async function stopTestRecording()
{
  return backgroundPage().evaluate(() => cba.stopButtonClick());
}

async function getLocalStorageData(key)
{
  return backgroundPage().evaluate(async(key) => await browser.storage.local.get(key), key);
}

async function getProjectActions(groupName, projectName, num, key)
{
  return backgroundPage().evaluate((groupName, projectName, num, key) =>
  {
    const group = JSON.parse(localStorage.getItem("data"))[groupName];
    const project = group.projects.find(({name}) => name == projectName);
    if (num === undefined)
      return project.action;

    const action = project.action[num];
    if (!action)
      return false;
    else
      return key ? action[key] : action;
  }, groupName, projectName, num, key);
}

async function getTestProjectActions(num, key)
{
  return getProjectActions("testGroup", "testProject", num, key);
}

async function addTestAction(data, evType, newValue)
{
  const actionObj = {
      data,
      evType,
      "msgType": "userEvent",
      newValue
  };

  return backgroundPage().evaluate((actionObj) => {
    const dataObj = JSON.parse(localStorage.getItem("data"));
    const testProject = dataObj["testGroup"].projects[0];
    testProject.action.push(actionObj);
    localStorage.setItem("data", JSON.stringify(dataObj));
  }, actionObj);
}

async function playTestProject(repeate = "1")
{
  const porjectData = {
    isProject: true,
    project: "testProject",
    group: "testGroup",
    groupObj: ""
  };
  const projectId = "2";
  await backgroundPage().evaluate((porjectData, projectId, repeate) => cba.playButtonClick(porjectData, projectId, repeate), porjectData, projectId, repeate);
}

async function getElementAttribute(query, ...attributes)
{
  const element = await page().$(query);
  return page().evaluate((element, attributes) => {
    return attributes.reduce((acc, attribute) => acc[attribute] , element);
  } , element, attributes);
}

async function getTextContent(query)
{
  return getElementAttribute(query, "textContent");
}

async function getValue(query)
{
  return getElementAttribute(query, "value");
}

async function setValue(query, value)
{
  const element = await page().$(query);
  return page().evaluate((element, value) => {
    return element.value = value;
  } , element, value);
}

async function getSelectedValue(query)
{
  const element = await page().$(query);
  return page().evaluate((element) => {
    return element.selectedOptions[0].value;;
  } , element);
}

async function isChecked(query)
{
  return getElementAttribute(query, "checked");
}

async function isElementExist(query)
{
  return page().$(query);
}

async function getStyle(query, style)
{
  return getElementAttribute(query, "style", style);
}

async function getActiveElementId()
{
  return page().evaluate(() => document.activeElement.id);
}

async function getBackgroundGlobalVar(name)
{
  return backgroundPage().evaluate((name) => window[name] , name);
}

async function resetBackgroundGlobalVar(name)
{
  return backgroundPage().evaluate((name) => delete window[name] , name);
}

async function resetClipboardValue()
{
  return backgroundPage().evaluate(() => cba.clipboard = {});
}

async function getBadgeText()
{
  return backgroundPage().evaluate(() => {
    return new Promise((response) => {
      chrome.browserAction.getBadgeText({}, response);
    })
  });
}

// Usage: await setListener("#id", "change", (e) => {});
async function setListener(query, listener, callback)
{
  await page().exposeFunction("onCustomEvent", (e) => {
    callback(e);
  });

  await page().evaluate((query, listener) =>
  {
    document.querySelector(query).addEventListener(listener, window.onCustomEvent);
  }, query, listener);
}

async function addCookie(url, name, value)
{
  return backgroundPage().evaluate(async(url, name, value) =>
  {
    return new Promise((resolve) =>
    {
      chrome.cookies.set({url, name, value}, resolve);
    });
  }, url, name, value);
}

async function getCookie(url, name)
{
  return backgroundPage().evaluate(async(url, name) =>
  {
    return new Promise((resolve) =>
    {
      chrome.cookies.get({url, name}, resolve);
    });
  }, url, name);
}

async function wait(milliseconds = 200)
{
  return page().waitFor(milliseconds);
}

async function getPageUrl()
{
  return page().url();
}

async function focusAndType(query, text)
{
  await page().focus(query);
  return page().keyboard.type(text);
}

async function sendCurrentTabRequest(request)
{
  return backgroundPage().evaluate((request) => {
    return new Promise((resp) =>
    {
      chrome.tabs.getSelected(null , async (tab) => {
        await browser.tabs.sendMessage(tab.id, request);
        resp();
      });
    });
  }, request);
}

module.exports = {setTestProject, playTestProject, getBackgroundGlobalVar,
                  resetBackgroundGlobalVar, wait, startTestRecording,
                  stopTestRecording, getTestProjectActions, getProjectActions,
                  getTextContent, getValue, setValue, isChecked, addCookie,
                  getCookie,
                  getActiveElementId, setListener, addTestAction, getPageUrl,
                  focusAndType, getBadgeText, getLocalStorageData,
                  sendCurrentTabRequest, getStyle, getSelectedValue,
                  resetClipboardValue, isElementExist, setDefaultCollections,
                  cbaListHasTextCount, cbaListItemExpand, cbaListItemSelect,
                  setWindowLocalStorage, getWindowLocalStorage, reloadExtension,
                  cbaTableItemsLength, cbaTableGetItem, cbaTableSelectRow};
