const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, addTestAction, getTextContent, getValue, isChecked,
       getActiveElementId, setListener, getPageUrl,
       getBackgroundGlobalVar, addCookie, getCookie, wait} = require("./utils");
const {backgroundPage, server, setTestPage} = require("../main");

const pageSetup = {
  body: `
    <div id='changeContent'>Change me</div>
    <input id="cba-textbox" type="text" />
    <input id="cba-checkbox" type="checkbox" />
    <input id="cba-click" type="checkbox" />
    <form action="/redirect">
      <input type="submit" id="cba-submit">Submit form</input>
    </form>
  `
}

beforeEach(async () =>
{
  await setTestProject();
  const pageUrl = await getPageUrl();
  if (path.relative(pageUrl, server) != "")
    await setTestPage(pageSetup);
});

it("Inject function runs specified script in the web page", async() =>
{
  const newText = "Injected text";
  const data = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "inject";
  await addTestAction(data, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const data = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "cs-inject";
  await addTestAction(data, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("bg-inject function runs specified script in background page", async() =>
{
  const value = "BG injected text";
  const data = `window.cba = "${value}";`;
  const evType = "bg-inject";
  await addTestAction(data, evType, "");
  await playTestProject();
  equal(await getBackgroundGlobalVar("cba"), value);
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
  // TODO fix and createst for https://github.com/Manvel/cba/issues/2
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

function gotoRedirectPageScript()
{
  return `window.location.pathname = "/redirect";`
}

function setTextContentScript(query, newText)
{
  return `document.querySelector("${query}").textContent = "${newText}";`;
}

module.exports = {pageSetup};
