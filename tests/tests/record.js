const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, addTestAction, getTextContent, getPageUrl,
       resetBackgroundGlobalVar, startTestRecording, stopTestRecording, getTestProjectActions, focusAndType, wait} = require("./utils");
const {server, setTestPage, navigateToTestPage, page} = require("../main");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  body: `
    <a href="/redirect" />Redirect page</a>
    <a id="cba-reference-link" href="#top" />Page top</a>
    <a id="cba-empty-link" href="" />Empty link</a>
    <input type="submit" />
    <input type="image" />
    <input type="text" />
    <input type="password" />
    <textarea></textarea>
    <select>
      <option value="1" selected>
      </option><option value="2"></option>
    </select>
    <input type="radio" name="cba-radio" value="cba-radio">
    <input type="checkbox" name="cba-checkbox" value="cba-checkbox">
    <button>click me</button>
    <input type="button" value="click me" />
    <div id="testing-path">
      <button>click me</button>
      <button id="cba-button">click me</button>
      <button class="cba-class1 cba-class2">click me</button>
    </div>
  `
}

beforeEach(async () =>
{
  await startTestRecording();
  await setTestProject();
  const pageUrl = await getPageUrl();
  await resetBackgroundGlobalVar(bgGlobalVarName);

  if (path.relative(pageUrl, server) != "")
    await navigateToTestPage();
  await setTestPage(pageSetup);
});

it("Starting and stoping the recording adds a redirect action", async() =>
{
  await startTestRecording();
  await stopTestRecording();
  equal(await getTestProjectActions(0, "evType"), "redirect");
  equal(await getTestProjectActions(0, "data"), `${server}/`);
});

it("Clicking anchor should add a redirect action", async() =>
{
  await startTestRecording();
  await page().click("a");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("/redirect", "redirect"));
});

it("Clicking anchor with empty/missing href or beginning with # should add a click event", async() =>
{
  await startTestRecording();
  await page().click("a[href^='#']");
  await page().click("a[href='']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-reference-link", "click"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-empty-link", "click"));
});

it("Clicking input[type=submit], input[type=image] should create submit-click action using target selector", async() =>
{
  await startTestRecording();
  await page().click("input[type=submit]");
  await page().click("input[type=image]");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("body INPUT", "submit-click"));
  deepEqual(await getTestProjectActions(2),
            createAction("body INPUT", "submit-click"));
});

it("Changing input[type=text], input[type=password], textarea, select should create change action using target selector", async() =>
{
  const inputTextValue = "Input type text value";
  const inputPasswordValue = "Input type password value";
  const textAreaValue = "textarea value";
  await startTestRecording();
  await focusAndType("input[type=text]", inputTextValue);
  await focusAndType("input[type=password]", inputPasswordValue);
  await focusAndType("textarea", textAreaValue);
  await page().keyboard.press("Tab");
  await page().select("select", "2");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("body INPUT", "change", inputTextValue));
  deepEqual(await getTestProjectActions(2),
            createAction("body INPUT", "change", inputPasswordValue));
  deepEqual(await getTestProjectActions(3),
            createAction("body TEXTAREA", "change", textAreaValue));
  deepEqual(await getTestProjectActions(4),
            createAction("body SELECT", "change", "2"));
});

it("Changing input[type=radio], input[type=checkbox] should create check action using target selector", async() =>
{
  await startTestRecording();
  await page().click("input[type='radio']");
  await page().click("input[type='checkbox']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("body INPUT", "check"));
  deepEqual(await getTestProjectActions(2),
            createAction("body INPUT", "check"));
});

it("Clicking button, input[type='button'] should create click action using target selector", async() =>
{
  await startTestRecording();
  await page().click("button");
  await page().click("input[type='button']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("body BUTTON", "click"));
  deepEqual(await getTestProjectActions(2),
            createAction("body INPUT", "click"));
});

it("Clicking element use DOM tree to construct path(Testing path)", async() =>
{
  // TODO this might update with https://github.com/Manvel/cba/issues/5
  await startTestRecording();
  await page().click("#testing-path button");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("div#testing-path BUTTON", "click"));
});

it("Clicking element with ID should use ID as access data(Testing path)", async() =>
{
  await startTestRecording();
  await page().click("#cba-button");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-button", "click"));
});

it("Clicking element with class should include it's classes when constructing path tree(Testing path)", async() =>
{
  await startTestRecording();
  await page().click(".cba-class1");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("div#testing-path BUTTON.cba-class1.cba-class2", "click"));
});

function createAction(data, evType, newValue="")
{
  return {
    data, evType, newValue, msgType: "RecordedEvent"
  }
}

module.exports = {pageSetup};
