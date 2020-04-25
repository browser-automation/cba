const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, addTestAction, getTextContent, getValue,
       isChecked, getActiveElementId, getPageUrl, getBackgroundGlobalVar,
       resetBackgroundGlobalVar, addCookie, getCookie, wait,
       getBadgeText, setListener, getSelectedValue} = require("./utils");
const {server, setTestPage, navigateToTestPage} = require("../main");

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
    <span id="cba-copy">Copy me</span>
    <input id="cba-paste" type="text"></input>
  `
}

beforeEach(async () =>
{
  await setTestProject();
  const pageUrl = await getPageUrl();
  await resetBackgroundGlobalVar(bgGlobalVarName);

  if (path.relative(pageUrl, server) != "")
    await navigateToTestPage();
  await setTestPage(pageSetup);
});


it("Playing actions should add badge text 'play' to the icon.", async() =>
{
  await addTestAction("", "timer", "150");
  await playTestProject();
  equal(await getBadgeText(), "play");
  await wait(150);
  equal(await getBadgeText(), "");
});

it("Inject function runs specified script in the web page", async() =>
{
  const newText = "Injected text";
  const evType = "inject";
  await addTestAction(setTextContentScript("#changeContent", newText), evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const evType = "cs-inject";
  await addTestAction(setTextContentScript("#changeContent", newText), evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("Jquery is accessible through cs-inject", async() =>
{
  const newText = "Jquery in CS injected text";
  const query = "#changeContent";
  await addTestAction(`$("${query}").text("${newText}")`, "cs-inject", "");
  await playTestProject();
  equal(await getTextContent(query), newText);
});

it("bg-inject function runs specified script in background page", async() =>
{
  const value = "BG injected text";
  const data = `window["${bgGlobalVarName}"] = "${value}";`;
  const evType = "bg-inject";
  await addTestAction(data, evType, "");
  await playTestProject();
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
  await addTestAction(data, evType, "");
  const injectText = "Next action is played";
  const query = "#changeContent";
  await addTestAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject();
  await wait();
  notOk(await getCookie("https://www.example.com/", "cba"));
  equal(await getTextContent(query), injectText);
});

it("Change action updates value of a textbox, focuses and fires a change event", async() =>
{
  const newText = "Injected value";
  const id = "cba-textbox";
  const query = `#${id}`;
  const evType = "change";
  await addTestAction(query, evType, newText);
  let changeEvent = null;
  setListener(query, "change", (e) =>
  {
    changeEvent = e;
  });
  await wait();
  await playTestProject();
  equal(await getValue(query), newText);
  equal(await getActiveElementId(), id);
  ok(changeEvent);
});

it("Change action updates value of selectbox and textarea", async() =>
{
  const evType = "change";
  const selectboxQuery = "#cba-selectbox";
  await addTestAction(selectboxQuery, evType, "2");

  const newText = "Injected value";
  const textareaQuery = "#cba-textarea";
  await addTestAction(textareaQuery, evType, newText);
  
  await playTestProject();
  equal(await getSelectedValue(selectboxQuery), "2");
  equal(await getValue(textareaQuery), newText);
});

it("Check action checks the checkbox", async() =>
{
  const query = "#cba-checkbox";
  const evType = "check";
  await addTestAction(query, evType, "");
  await playTestProject();
  ok(await isChecked(query));
});

it("Click action toggle the checkbox", async() =>
{
  const query = "#cba-click";
  const evType = "click";
  await addTestAction(query, evType, "");
  await playTestProject();
  ok(await isChecked(query));
  await playTestProject();
  notOk(await isChecked(query))
});

it("submit-click should wait for the page load before proceeding with next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  await addTestAction("#cba-submit", "submit-click", "");
  await addTestAction(setTextContentScript(query, injectText), "inject", "");
  await playTestProject();
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Update should wait for the page load before proceeding with next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  await addTestAction(gotoRedirectPageScript(), "inject", "");
  await addTestAction("", "update", "");
  await addTestAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject();
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Timer should wait for specified amount of milliseconds before proceeding with the next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  await addTestAction(gotoRedirectPageScript(), "inject", "");
  await addTestAction("", "timer", "150");
  await addTestAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject();
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Redirect should redirect to specific page and wait for page load before proceeding with the next actions", async() =>
{
  const injectText = "Injected text";
  const query = "#cba-text";
  await addTestAction("/redirect", "redirect", "");
  await addTestAction(setTextContentScript(query, injectText), "inject", injectText);
  await playTestProject();
  await wait();
  equal(await getTextContent(query), injectText);
});

it("Copy action should save element content into the clipboard and <$clipboard=copy> can be used to paste value", async() =>
{
  const pasteQuery = "#cba-paste";
  await addTestAction("#cba-copy", "copy", "");
  await addTestAction(pasteQuery, "change", "<$clipboard=copy>");
  await playTestProject();
  await wait();
  equal(await getValue(pasteQuery), "Copy me");
});

it("Pause action pauses the workflow until the project is played again and set '||' badge text", async() =>
{
  const beforePauseText = "First change";
  const afterPauseText = "Second change";
  await addTestAction(setTextContentScript("#changeContent", beforePauseText), "inject", "");
  await addTestAction("", "pause", "");
  await addTestAction(setTextContentScript("#changeContent", afterPauseText), "inject", "");
  await playTestProject();
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
  await addTestAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "inject", "");
  await addTestAction(setContentFromClipboardScript("#changeContent", clipboardName) , "cs-inject", "");
  await addTestAction(`window["${bgGlobalVarName}"] = clipboard["${clipboardName}"];`, "bg-inject", "");
  await playTestProject();
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), clipboardValue);
});

it("Clipboard set in cs-inject should be accessible in inject and bg-inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  const bgGlobalVarName = "cba-bg-test";
  await addTestAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "cs-inject", "");
  await addTestAction(setContentFromClipboardScript("#changeContent", clipboardName) , "inject", "");
  await addTestAction(`window["${bgGlobalVarName}"] = clipboard["${clipboardName}"];`, "bg-inject", "");
  await playTestProject();
  await wait();
  equal(await getTextContent("#changeContent"), clipboardValue);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), clipboardValue);
});

it("Clipboard set in bg-inject should be accessible in inject", async() =>
{
  const clipboardValue = "cba-test-value";
  const clipboardName = "cba-test";
  await addTestAction(`clipboard["${clipboardName}"] = "${clipboardValue}";`, "bg-inject", "");
  await addTestAction(setContentFromClipboardScript("#changeContent", clipboardName) , "inject", "");
  await playTestProject();
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
  await addTestAction(`clipboard["${clipboardKey}"] = "${clipboardValue}";`, "bg-inject", "");
  await addTestAction(`<$function=removeCookie> <$attr=clipboard["${clipboardKey}"]>`, "bg-function", "");
  await playTestProject();
  await wait();
  notOk(await getCookie("https://www.example1.com/", "cba"));
  ok(await getCookie("https://www.example2.com/", "cba"));
});

it("<$unique=> placeholder should generate random number with the specified characters length", async() =>
{
  const pasteQuery = "#cba-paste";
  await addTestAction(pasteQuery, "change", "<$unique=2>");
  await playTestProject();
  const firstUnique = await getValue(pasteQuery);
  equal(firstUnique.length, 2);
  await addTestAction(pasteQuery, "change", "<$unique=2>");
  await playTestProject();
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

  await addTestAction(code, "inject");
  await playTestProject(4);
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
  await addTestAction(code, "bg-inject");
  await addTestAction(`window["${bgGlobalVarName}"] = "${secondActionText}";`, "bg-inject");
  await playTestProject();
  await wait(200);
  equal(await getBackgroundGlobalVar(bgGlobalVarName), secondActionText);
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

module.exports = {pageSetup};
