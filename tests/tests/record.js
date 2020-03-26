const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, addTestAction, getTextContent, getPageUrl,
       resetBackgroundGlobalVar, startTestRecording, stopTestRecording, getTestProjectActions} = require("./utils");
const {server, setTestPage, navigateToTestPage} = require("../main");

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
  await startTestRecording();
  await setTestProject();
  const pageUrl = await getPageUrl();
  await resetBackgroundGlobalVar(bgGlobalVarName);

  if (path.relative(pageUrl, server) != "")
    await navigateToTestPage();
  await setTestPage(pageSetup);
});

it("Starting and stoping the recording will add a redirect action", async() =>
{
  await startTestRecording();
  await stopTestRecording();
  equal(await getTestProjectActions(0, "evType"), "redirect");
  equal(await getTestProjectActions(0, "data"), `${server}/`);
});

module.exports = {pageSetup};
