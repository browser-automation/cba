const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, addTestAction, getTextContent, getValue,
       isChecked, getActiveElementId, getPageUrl, getBackgroundGlobalVar,
       resetBackgroundGlobalVar, addCookie, getCookie, wait,
       getBadgeText, setListener, getSelectedValue, resetClipboardValue,
       isElementExist} = require("./utils");
const {setTestPage, navigateTo} = require("../main");
const {server} = require("../config");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  body: `
    <div id="changeContent">Change me</div>
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
  await playTestProject([tests]);
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

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const evType = "cs-inject";
  const action =  createAction(setTextContentScript("#changeContent", newText), evType, "");
  await playTestProject([action]);
  equal(await getTextContent("#changeContent"), newText);
});

it("Jquery is accessible through cs-inject", async() =>
{
  const newText = "Jquery in CS injected text";
  const query = "#changeContent";
  const action = createAction(`$("${query}").text("${newText}")`, "cs-inject", "");
  await playTestProject([action]);
  equal(await getTextContent(query), newText);
});

it("bg-inject function runs specified script in background page", async() =>
{
  const value = "BG injected text";
  const data = `window["${bgGlobalVarName}"] = "${value}";`;
  const evType = "bg-inject";
  const action = createAction(data, evType, "");
  await playTestProject([action]);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), value);
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
  const action2 = createAction(`window["${bgGlobalVarName}"] = clipboard;`, "bg-inject", "");
  await playTestProject([action1, action2]);
  await wait();
  deepEqual(await getBackgroundGlobalVar(bgGlobalVarName), JSON.parse(clipboardObject));
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

it("Change action updates value of a textbox, focuses and fires a change event", async() =>
{
  const newText = "Injected value";
  const id = "cba-textbox";
  const query = `#${id}`;
  const evType = "change";
  const action = createAction(query, evType, newText);
  let changeEvent = null;
  setListener(query, "change", (e) =>
  {
    changeEvent = e;
  });
  await wait();
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

it("submit-click should wait for the page load before proceeding with next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction("#cba-submit", "submit-click", "");
  const action2 = createAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent(query), injectText);
});

it("submit-click on an anchor element redirects to the new page", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  const action1 = createAction("#cba-anchor-redirect", "submit-click", "");
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

it("Clipboard set in inject should be accessible in cs-inject and bg-inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const bgGlobalVarName = "cba-bg-test";
  const action1 = createAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "inject", "");
  const action2 = createAction(setContentFromClipboardScript("#changeContent", clipboardName) , "cs-inject", "");
  const action3 = createAction(`window["${bgGlobalVarName}"] = clipboard["${clipboardName}"];`, "bg-inject", "");
  await playTestProject([action1, action2, action3]);
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), clipboardValue);
});

it("Clipboard set in cs-inject should be accessible in inject and bg-inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const bgGlobalVarName = "cba-bg-test";
  const action1 = createAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "cs-inject", "");
  const action2 = createAction(setContentFromClipboardScript("#changeContent", clipboardName) , "inject", "");
  const action3 = createAction(`window["${bgGlobalVarName}"] = clipboard["${clipboardName}"];`, "bg-inject", "");
  await playTestProject([action1, action2, action3]);
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), clipboardValue);
});

it("Clipboard set in bg-inject should be accessible in inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const action1 = createAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "bg-inject", "");
  const action2 = createAction(setContentFromClipboardScript("#changeContent", clipboardName) , "inject", "");
  await playTestProject([action1, action2]);
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
});

it("clipboard[...] set as bg-function attribute should be passed along the function call", async() =>
{
  await addCookie("https://www.example1.com/", "cba", "1");
  await addCookie("https://www.example2.com/", "cba", "1");
  ok(await getCookie("https://www.example1.com/", "cba"));
  ok(await getCookie("https://www.example2.com/", "cba"));
  const clipboardKey = "clip-key";
  const clipboardValue = "example1";
  const action1 = createAction(`clipboard["${clipboardKey}"] = "${clipboardValue}";`, "bg-inject", "");
  const action2 = createAction(`<$function=removeCookie> <$attr=clipboard["${clipboardKey}"]>`, "bg-function", "");
  await playTestProject([action1, action2]);
  await wait();
  notOk(await getCookie("https://www.example1.com/", "cba"));
  ok(await getCookie("https://www.example2.com/", "cba"));
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

it("sendBgInstruction variable and sendInstruction() method can be used in bg-inject to stop and continue next action invocation", async() =>
{
  const firstActionText = "first-action-text";
  const secondActionText = "second-action-text";
  const bgGlobalVarName = "cba-control-instructions";
  const code = `
  sendBgInstruction = false;
  setTimeout(() => {
    window["${bgGlobalVarName}"] = "${firstActionText}";
    sendInstruction();
  }, 100);`;
  const action1 = createAction(code, "bg-inject", "");
  const action2 = createAction(`window["${bgGlobalVarName}"] = "${secondActionText}";`, "bg-inject");
  await playTestProject([action1, action2]);
  await wait(200);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), secondActionText);
});

it("actionToPlay can be used in bg-inject to Jump to another action", async() =>
{
  const query = "#changeContent";
  const firstInjectedText = "First Injected Text"; 
  const secondInjectedText = "Second Injected Text"; 
  const jumpToAction = 3;
  const lastActionText = "Last action has been played";
  const action1 = createAction(setTextContentScript(query, firstInjectedText), "inject");
  const action2 = createAction(`actionToPlay(${jumpToAction});`, "bg-inject");
  const action3 = createAction(setTextContentScript(query, secondInjectedText), "inject");
  const action4 = createAction(`window["${bgGlobalVarName}"] = "${lastActionText}";`, "bg-inject", "");
  await playTestProject([action1, action2, action3, action4]);
  await wait();
  equal(await getTextContent(query), firstInjectedText);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), lastActionText);
});

function gotoRedirectPageScript()
{
  return `window.location.pathname = "/redirect";`
}

function setTextContentScript(query, newText)
{
  return `document.querySelector("${query}").textContent = "${newText}";`;
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
