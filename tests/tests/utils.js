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

async function getLocalStorageData()
{
  return backgroundPage().evaluate(() => JSON.parse(localStorage.getItem("data")));
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

async function getElementAttribute(query, attribute)
{
  const element = await page().$(query);
  return page().evaluate((element, attribute) => element[attribute], element, attribute);
}

async function getTextContent(query)
{
  return getElementAttribute(query, "textContent");
}

async function getValue(query)
{
  return getElementAttribute(query, "value");
}

async function isChecked(query)
{
  return getElementAttribute(query, "checked");
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

module.exports = {setTestProject, playTestProject, getBackgroundGlobalVar,
                  resetBackgroundGlobalVar, wait, startTestRecording,
                  stopTestRecording, getTestProjectActions, getProjectActions,
                  getTextContent, getValue, isChecked, addCookie, getCookie,
                  getActiveElementId, setListener, addTestAction, getPageUrl,
                  focusAndType, getBadgeText, getLocalStorageData};
