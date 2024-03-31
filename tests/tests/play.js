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
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, getTextContent, getInnerHTML, getValue,
       isChecked, getActiveElementId, getPageUrl, getBackgroundGlobalVar,
       resetBackgroundGlobalVar, addCookie, getCookie, wait,
       getBadgeText, setListeners, getSelectedValue, resetClipboardValue,
       isElementExist, getCbaState} = require("./utils");
const {setTestPage, navigateTo} = require("../main");
const {server} = require("../config");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  body: `
    <div id="changeContent">Change me</div>
    <div id="changeContent2">Change me2</div>
    <div id="cba-change">
      <input id="cba-textbox" type="text" />
      <select id="cba-selectbox">
        <option value="1" selected>First</option>
        <option value="2">Second</option>
      </select>
      <textarea id="cba-textarea"></textarea>
    </div>
    <input id="cba-num" type="num" />
    <input id="cba-checkbox" type="checkbox" />
    <input id="cba-click" type="checkbox" />
    <form action="/redirect">
      <input type="submit" id="cba-submit">Submit form</input>
    </form>
    <a id="cba-anchor-redirect" href="/redirect">Redirect</a>
    <span id="cba-copy">Copy <b>me</b></span>
    <input id="cba-paste" type="text"></input>
    <div id="cba-editable" contenteditable="true"><p></p></div>
  `,
  path: server
}

beforeEach(async () =>
{
  const pageUrl = await getPageUrl();
  await resetBackgroundGlobalVar(bgGlobalVarName);
  await resetClipboardValue();

  if (path.relative(pageUrl, server) != "")
    await navigateTo(server);
  await setTestPage(pageSetup.body);
});

it("Playing actions should add badge text 'play' to the icon.", async() =>
{
  const tests = createAction("150", "timer", "");
  playTestProject([tests]);
  await wait(20);
  equal(await getBadgeText(), "play");
  await wait(150);
  equal(await getBadgeText(), "");
});

it("Inject function runs specified script in the web page", async() =>
{
  const evType = "inject";
  const newText = "Injected text";
  const action = createAction(setTextContentScript("#changeContent", newText), evType, "");
  await playTestProject([action]);
  equal(await getTextContent("#changeContent"), newText);
});

it("Executing project with bg-inject skips the bg-inject execution", async() =>
{
  const value = "BG injected text";
  const data = `window["${bgGlobalVarName}"] = "${value}";`;
  const evType = "bg-inject";
  const action = createAction(data, evType, "");
  const newText = "Injected text";
  const injectAction = createAction(setTextContentScript("#changeContent", newText), "inject", "");
  await playTestProject([action, injectAction]);
  notOk(await getBackgroundGlobalVar(bgGlobalVarName));
  equal(await getTextContent("#changeContent"), newText);
});

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const evType = "cs-inject";
  const action =  createAction(setTextContentScript("#changeContent", newText), evType, "");
  await playTestProject([action]);
  equal(await getTextContent("#changeContent"), newText);
});

/*
Can't support unless https://github.com/w3c/webextensions/pull/540 is implemented
by the browsers.
it("cs-inject action executes script with async(await) code before moving to the next action", async() =>
{
  const evType = "cs-inject";
  const valuePromise = "Promise action has been played";
  const dataPromise = `
    await new Promise(r => setTimeout(()=>
    {
      ${setTextContentScript("#changeContent", valuePromise)}
      r();
    }, 50));
  `;
  const actionPromise = createAction(dataPromise, evType, "");

  const valueSync = "Sync action has been played after async one";
  const dataSync = setTextContentScript("#changeContent", valueSync, true);
  const actionSync = createAction(dataSync, evType, "");
  await playTestProject([actionPromise, actionSync]);
  equal(await getTextContent("#changeContent"), valuePromise+valueSync);
});
*/

it("Jquery is accessible through cs-inject", async() =>
{
  const newText = "Jquery in CS injected text";
  const query = "#changeContent";
  const action = createAction(`$("${query}").text("${newText}")`, "cs-inject", "");
  await playTestProject([action]);
  equal(await getTextContent(query), newText);
});

it("bg-function should execute predefined function and play next action when/if defined in function", async() =>
{
  await addCookie("https://www.example.com/", "cba", "1");
  ok(await getCookie("https://www.example.com/", "cba"));
  const data = `
<$function=removeCookie>
<$attr=example>
  `;
  const evType = "bg-function";
  const action1 = createAction(data, evType, "");
  const injectText = "Next action is played";
  const query = "#changeContent";
  const action2 = createAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  notOk(await getCookie("https://www.example.com/", "cba"));
  equal(await getTextContent(query), injectText);
});

it("bg-function saveToClipboard should save JSON data into the clipboard", async() =>
{
  const clipboardObject = `{"key1": "value1", "key2": "value2"}`;
  const data = `
<$function=saveToClipboard>
<$attr=${clipboardObject}>
  `;
  const action1 = createAction(data, "bg-function", "");
  await playTestProject([action1]);
  await wait();
  deepEqual((await getCbaState()).clipboard, JSON.parse(clipboardObject));
});

it("bg-function reloadCurrentTab(without attributes test) should reload current tab", async() =>
{
  const query = "#defaultContent";
  const newText = "New default text";
  const action1 = createAction(`<$function=reloadCurrentTab>`, "bg-function", "");
  const action2 = createAction("", "update", "");
  const action3 = createAction(setTextContentScript(query, newText), "inject", "");
  await playTestProject([action1, action2, action3]);
  await wait();
  notOk(await isElementExist("#changeContent"));
  equal(await getTextContent(query), newText);
});

it("bg-function actionToPlay should jump to another action", async() =>
{
  const query = "#changeContent";
  const query2 = "#changeContent2";
  const firstInjectedText = "First Injected Text";
  const secondInjectedText = "Second Injected Text";
  const jumpToAction = 3;
  const lastActionText = "Last action has been played";
  const action1 = createAction(setTextContentScript(query, firstInjectedText), "inject");
  const action2 = createAction(`<$function=actionToPlay>\n<$attr=${jumpToAction}>`, "bg-function");
  const action3 = createAction(setTextContentScript(query, secondInjectedText), "inject");
  const action4 = createAction(setTextContentScript(query2, lastActionText), "inject");
  await playTestProject([action1, action2, action3, action4]);
  await wait();
  equal(await getTextContent(query), firstInjectedText);
  equal(await getTextContent(query2), lastActionText);
});

it("Change action updates value of a textbox, focuses and fires a change event", async() =>
{
  const newText = "Injected value";
  const id = "cba-textbox";
  const query = `#${id}`;
  const evType = "change";
  const action = createAction(query, evType, newText);
  let changeEvent = null;
  await setListeners(query, ["change"], (e) =>
  {
    changeEvent = e;
  });
  await playTestProject([action]);
  equal(await getValue(query), newText);
  equal(await getActiveElementId(), id);
  ok(changeEvent);
});

it("Change action updates value of selectbox and textarea", async() =>
{
  const evType = "change";
  const selectboxQuery = "#cba-selectbox";
  const action1 = createAction(selectboxQuery, evType, "2");

  const newText = "Injected value";
  const textareaQuery = "#cba-textarea";
  const action2 = createAction(textareaQuery, evType, newText);
  
  await playTestProject([action1, action2]);
  equal(await getSelectedValue(selectboxQuery), "2");
  equal(await getValue(textareaQuery), newText);
});

it("Change action updates value of element with contenteditable=true parent attribute", async() =>
{
  const evType = "change";
  const eitableQuery = "#cba-editable p";
  const newText = "Injected value";
  const action = createAction(eitableQuery, evType, newText);
  await playTestProject([action]);
  equal(await getInnerHTML("#cba-editable"), `<p>${newText}</p>`);
});

it("Check action checks the checkbox", async() =>
{
  const query = "#cba-checkbox";
  const evType = "check";
  const action = createAction(query, evType, "");
  await playTestProject([action]);
  ok(await isChecked(query));
});

it("Click action toggle the checkbox", async() =>
{
  const query = "#cba-click";
  const evType = "click";
  const action = createAction(query, evType, "");
  await playTestProject([action]);
  ok(await isChecked(query));
  await playTestProject([action]);
  notOk(await isChecked(query))
});

it("click action fire, pointerdown, mousedown, click, mouseup and pointerup  events respectively", async() =>
{
  const eventNames = ["pointerdown", "mousedown", "click", "mouseup", "pointerup"];
  const query = "#cba-click";
  let matchedEventNames = [];
  await setListeners(query, eventNames, (e) =>
  {
    matchedEventNames.push(e);
  });
  deepEqual(matchedEventNames, []);
  await playTestProject([createAction(query, "click", "")]);
  await wait();
  deepEqual(matchedEventNames, eventNames);
});

it("click-update should wait for the page load before proceeding with next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction("#cba-submit", "click-update", "");
  const action2 = createAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("click-update on an anchor element redirects to the new page", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction("#cba-anchor-redirect", "click-update", "");
  const action2 = createAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Update should wait for the page load before proceeding with next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction(gotoRedirectPageScript(), "inject", "");
  const action2 = createAction("", "update", "");
  const action3 = createAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject([action1, action2, action3]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Timer should wait for specified amount of milliseconds before proceeding with the next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction(gotoRedirectPageScript(), "inject", "");
  const action2 = createAction("150", "timer", "");
  const action3 = createAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject([action1, action2, action3]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Redirect should redirect to specific page and wait for page load before proceeding with the next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction("/redirect", "redirect", "");
  const action2 = createAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Copy action should save element text content into the clipboard and <$clipboard=copy> can be used to paste value", async() =>
{
  const pasteQuery = "#cba-paste";
  const action1 = createAction("#cba-copy", "copy", "");
  const action2 = createAction(pasteQuery, "change", "<$clipboard=copy>");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getValue(pasteQuery), "Copy me");
});

it("Copy-html action should save element content into the clipboard and <$clipboard=copy> can be used to paste value", async() =>
{
  const pasteQuery = "#cba-paste";
  const action1 = createAction("#cba-copy", "copy-html", "");
  const action2 = createAction(pasteQuery, "change", "<$clipboard=copy>");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getValue(pasteQuery), "Copy <b>me</b>");
});

it("Pause action pauses the workflow until the project is played again and set '||' badge text", async() =>
{
  const beforePauseText = "First change";
  const afterPauseText = "Second change";
  const action1 = createAction(setTextContentScript("#changeContent", beforePauseText), "inject", "");
  const action2 = createAction("", "pause", "");
  const action3 = createAction(setTextContentScript("#changeContent", afterPauseText), "inject", "");
  await playTestProject([action1, action2, action3]);
  equal(await getTextContent("#changeContent"), beforePauseText);
  equal(await getBadgeText(), "||");
  await playTestProject();
  equal(await getTextContent("#changeContent"), afterPauseText);
  equal(await getBadgeText(), "");
});

it("Clipboard set in inject should be accessible in cs-inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const action1 = createAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "inject", "");
  const action2 = createAction(setContentFromClipboardScript("#changeContent", clipboardName) , "cs-inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
});

it("Clipboard set in cs-inject should be accessible in inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const action1 = createAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "cs-inject", "");
  const action2 = createAction(setContentFromClipboardScript("#changeContent", clipboardName) , "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
});

it("<$unique=> placeholder should generate random number with the specified characters length", async() =>
{
  const pasteQuery = "#cba-paste";
  const action1 = createAction(pasteQuery, "change", "<$unique=2>");
  await playTestProject([action1]);
  await wait(30);
  const firstUnique = await getValue(pasteQuery);
  equal(firstUnique.length, 2);
  const action2 = createAction(pasteQuery, "change", "<$unique=2>");
  await playTestProject([action2]);
  const secondUnique = await getValue(pasteQuery);
  equal(secondUnique.length, 2);
  notEqual(firstUnique, secondUnique);
});

it("Repeat option should keep repeating actions in the project", async() =>
{
  const query = "#cba-num";
  const code = `
    value = document.querySelector("${query}").value;
    if (!value)
      value = 1;
    document.querySelector("${query}").value = ++value;`;

  const action = createAction(code, "inject", "");
  await playTestProject([action], 4);
  await wait();
  equal(await getValue("#cba-num"), "5");
});

function gotoRedirectPageScript()
{
  return `window.location.pathname = "/redirect";`
}

function setTextContentScript(query, newText, concatenate)
{
  const elementTextContent = `document.querySelector("${query}").textContent`;
  if (concatenate)
  {
    return `${elementTextContent} = ${elementTextContent} + "${newText}";`;
  }
  return `${elementTextContent} = "${newText}";`;
}

function setContentFromClipboardScript(query, clipboardName)
{
  return `document.querySelector('${query}').textContent = clipboard["${clipboardName}"];`
}

function createAction(data, type, value)
{
  return {type, inputs: [data, value]};
}

module.exports = {pageSetup};
