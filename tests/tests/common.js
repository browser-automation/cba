const {backgroundPage, page} = require("../main");

async function setTestProject(data, evType, newValue)
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
        "action": [
        {
          data,
          evType,
          "msgType": "userEvent",
          newValue
        }],
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

async function playTestProject()
{
  const porjectData = {
    isProject: true,
    project: "testProject",
    group: "testGroup",
    groupObj: ""
  };
  const projectId = "2";
  const repeate = "1";
  backgroundPage().evaluate((porjectData, projectId, repeate) => playButtonClick(porjectData, projectId, repeate), porjectData, projectId, repeate);
}

async function getTextContent(query)
{
  const element = await page().$(query);
 return page().evaluate(element => element.textContent, element);
}

async function getBackgroundGlobalVar(name)
{
  return backgroundPage().evaluate((name) => window[name] , name);
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

module.exports = {setTestProject, playTestProject, getBackgroundGlobalVar, wait,
                  getTextContent, addCookie, getCookie};