const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, addTestAction, getTextContent, getValue, isChecked,
       getActiveElementId, setListener, getPageUrl,
       getBackgroundGlobalVar, resetBackgroundGlobalVar, addCookie, getCookie, wait} = require("./utils");
const {backgroundPage, server, setTestPage, navigateToTestPage} = require("../main");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  body: `
    <div id='changeContent'>Change me</div>
    <input id="cba-textbox" type="text" />
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

it("bg-inject function runs specified script in background page", async() =>
{
  const value = "BG injected text";
  const data = `window["${bgGlobalVarName}"] = "${value}";`;
  const evType = "bg-inject";
  await addTestAction(data, evType, "");
  await playTestProject();
  equal(await getBackgroundGlobalVar(bgGlobalVarName), value);
});

it("bg-function should execute predefined function", async() =>
{
  await addCookie("https://www.example.com/", "cba", "1");
  ok(await getCookie("https://www.example.com/", "cba"));
  const data = `
<$function=removeCookie>
<$attr=example>
  `;
  const evType = "bg-function";
  await addTestAction(data, evType, "");
  await playTestProject();
  await wait();
  notOk(await getCookie("https://www.example.com/", "cba"));
});

it("Change action updates value of an input and focuses", async() =>
{
  const newText = "Injected value";
  const id = "cba-textbox";
  const query = `#${id}`;
  const evType = "change";
  await addTestAction(query, evType, newText);
  await playTestProject();
  equal(await getValue(query), newText);
  equal(await getActiveElementId(), id);
  // TODO fix and create test for https://github.com/Manvel/cba/issues/2
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
  equal(await getValue(pasteQuery), "Copy me");
});

it("Pause action pauses the workflow until the project is played again", async() =>
{
  const beforePauseText = "First change";
  const afterPauseText = "Second change";
  await addTestAction(setTextContentScript("#changeContent", beforePauseText), "inject", "");
  await addTestAction("", "pause", "");
  await addTestAction(setTextContentScript("#changeContent", afterPauseText), "inject", "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), beforePauseText);
  await playTestProject();
  equal(await getTextContent("#changeContent"), afterPauseText);
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
