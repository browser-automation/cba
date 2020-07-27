const {backgroundPage, page} = require("../main");

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

async function setCollections(collections)
{
  if (!collections)
  {
    collections = [{
      id: "group",
      text: "group",
      type: "group",
      expanded: false,
      subItems: [
        {
          id: "project",
          text: "project",
          type: "project",
          actions: []
        }
      ]
    }];
  }
  return backgroundPage().evaluate(async(collections) => await browser.storage.local.set({collections}), collections);
}

async function setPredefinedActions(predefinedActions)
{
  if (!predefinedActions)
  {
    predefinedActions = [
      {
        data: {
          texts: {
            data: "Please enter the time in milliseconds",
            type: "timer",
            value: "1000"
          }
        },
        text: "Timer"
      },
      {
        data: {
          texts: {
            data: "this event will let the script wait for page update",
            type: "update",
            value: ""
          }
        },
        text: "Update"
      },
      {
        data: {
          texts: {
            data: "<$function=removeCookie>\n<$attr=.*>",
            type: "bg-function",
            value: "use regular expressions to filter domains"
          }
        },
        text: "Clear cookies"
      },
      {
        data: {
          texts: {
            data: '<$function=saveToClipboard>\n<$attr={"name": "value"}>',
            type: "bg-function",
            value: "Write to clipboard Object to access data later. Use Json in the attr."
          }
        },
        text: "Clipboard"
      }
    ];
  }
  return backgroundPage().evaluate(async(predefinedActions) => await browser.storage.local.set({predefinedActions}), predefinedActions);
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

async function getSelectedRow(query)
{
  const listItem = await page().$(query);
  return listItem.evaluate(async(listItem) => listItem.getSelectedItem());
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

async function getCbaTableRowHandle(query, id)
{
  const rootHandle = await getShadowRoot(query)
  return rootHandle.$(`tr[data-id="${id}"]`);
}

async function getShadowRoot(query)
{
  const handle = await page().$(query);
  return handle.evaluateHandle((cbaList) => cbaList.shadowRoot);
}

async function getCbaListRowHandle(query, id)
{
  const rootHandle = await getShadowRoot(query);
  return rootHandle.$(`ul [data-id="${id}"]`);
}

async function getNotificationMsg()
{
  return getElementAttribute("#notification", "textContent");
}

async function getCurrentWindowUrl()
{
  return page().evaluate(async() => {
    return window.location.href;
  });
}

async function triggerDrop(query, id, data)
{
  const handle = await getCbaTableRowHandle(query, id);
  const table = await page().$(query);
  return handle.evaluate((cbaTableRow, cbaTable, data) => {
    return new Promise((resolve) => {
      cbaTable.addEventListener('dragndrop', ({detail}) =>
      {
        return resolve(detail);
      })
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", data);
      const event = new DragEvent("drop", {
        bubbles: true,
        dataTransfer
      });
      cbaTableRow.dispatchEvent(event);
    });
    
  }, table, data);
}

async function triggerDragStart(handle)
{
  return handle.evaluate((row) => {
    const event = new DragEvent("dragstart", {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    row.dispatchEvent(event);

    return event.dataTransfer.getData("text/plain");
  });
}

async function startTestRecording()
{
  const groupId = "group";
  const projectId = "project";
  return backgroundPage().evaluate((groupId, projectId) => cba.recordButtonClick(groupId, projectId) , groupId, projectId);
}

async function stopTestRecording()
{
  return backgroundPage().evaluate(() => cba.stopButtonClick());
}

async function getLocalStorageData(key)
{
  return backgroundPage().evaluate(async(key) => await browser.storage.local.get(key), key);
}

async function getGroupFromStorage(groupText)
{
  const {collections} = await getLocalStorageData("collections");
  const [group] = collections.filter(({text}) => text == groupText);
  return group
}

async function getFunctionFromStorage(functionName)
{
  const {predefinedActions} = await getLocalStorageData("predefinedActions");
  const [func] = predefinedActions.filter(({text}) => text == functionName);
  return func;
}

async function getProjectFromStorage(groupText, projectText)
{
  const group = await getGroupFromStorage(groupText);
  if (!group)
    return null;
  if (projectText)
  {
    const [project] = group.subItems.filter(({text}) => text == projectText);
    if (!project)
      return null;
    return project;
  }
  else
  {
    return group;
  }
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
  const {collections} = await getLocalStorageData("collections");
  const [group] = collections.filter(({id}) => id === "group");
  if (!group)
    return null;
  const [project] = group.subItems.filter(({id}) => id === "project");

  if (!project || !project.actions)
    return null;

  const {actions} = project;
  return key ? actions[num].texts[key] : actions[num];
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

async function playTestProject(actions, repeate = "1")
{
  await backgroundPage().evaluate((actions, repeate) =>  {
    cba.playButtonClick(actions, repeate)
  }, actions, repeate);
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

async function isDisabled(query)
{
  const element = await page().$(query);
  return element.evaluate((element) => element.hasAttribute("disabled"))
}

async function setValue(query, value)
{
  const element = await page().$(query);
  return page().evaluate((element, value) => {
    return element.value = value;
  } , element, value);
}

async function changeValue(query, value)
{
  const element = await page().$(query);
  return page().evaluate((element, value) => {
    element.value = value;
    element.dispatchEvent(new Event("change"));
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

async function resetCbaObject()
{
  return backgroundPage().evaluate(() => {
    cba.allowRec = false;
    cba.allowPlay = 0;
    cba.paused = 0;
    cba.playingProjectId;
    cba.playingActionIndex = -1;
    cba.instructArray;
    cba.defInstructArray;
    cba.playingTabId = 0;
    cba.instruction;
    cba.selectedProjectId;
    cba.lastEvType;
    cba.currentTab;
    cba.projectRepeat = 1;
    cba.lastSelectedProjectId = null;
    cba.lastSelectedActionId = null;
    cba.selectedProjObj = null;
    return cba;
  });
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

module.exports = {playTestProject, getBackgroundGlobalVar,
                  resetBackgroundGlobalVar, wait, startTestRecording,
                  stopTestRecording, getTestProjectActions, getProjectActions,
                  getTextContent, getValue, setValue, changeValue, isDisabled,
                  isChecked, addCookie, getCookie,
                  getActiveElementId, setListener, addTestAction, getPageUrl,
                  focusAndType, getBadgeText, getLocalStorageData,
                  getProjectFromStorage,getGroupFromStorage,
                  sendCurrentTabRequest, getStyle, getSelectedValue,
                  resetClipboardValue, isElementExist, setCollections,
                  cbaListHasTextCount, cbaListItemExpand, cbaListItemSelect,
                  getSelectedRow,setWindowLocalStorage, getWindowLocalStorage,
                  reloadExtension,
                  cbaTableItemsLength, cbaTableGetItem, cbaTableSelectRow,
                  getCbaListRowHandle, triggerDrop, triggerDragStart,
                  getCbaTableRowHandle, getNotificationMsg, resetCbaObject,
                  getCurrentWindowUrl, getElementAttribute,
                  setPredefinedActions, getFunctionFromStorage};
