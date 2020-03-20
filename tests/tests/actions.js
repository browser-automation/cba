const assert = require("assert");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, getTextContent, getValue, isChecked,
       getActiveElementId, setListener,
       getBackgroundGlobalVar, addCookie, getCookie, wait} = require("./utils");
const {backgroundPage} = require("../main");

const pageSetup = {
  body: `
    <div id='changeContent'>Change me</div>
    <input id="cba-textbox" type="text" />
    <input id="cba-checkbox" type="checkbox" />
    <input id="cba-click" type="checkbox" />
    <a id="cba-redirect" href="/redirect" >redirect page</a>
  `
}

it("Inject function runs specified script in the web page", async() =>
{
  const newText = "Injected text";
  const data = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "inject";
  await setTestProject(data, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const data = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "cs-inject";
  await setTestProject(data, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("bg-inject function runs specified script in background page", async() =>
{
  const value = "BG injected text";
  const data = `window.cba = "${value}";`;
  const evType = "bg-inject";
  await setTestProject(data, evType, "");
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
  await setTestProject(data, evType, "");
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
  await setTestProject(query, evType, newText);
  await playTestProject();
  equal(await getValue(query), newText);
  equal(await getActiveElementId(), id);
  // TODO fix and createst for https://github.com/Manvel/cba/issues/2
});

it("Check action checks the checkbox", async() =>
{
  const query = "#cba-checkbox";
  const evType = "check";
  await setTestProject(query, evType, "");
  await playTestProject();
  ok(await isChecked(query));
});

it("Click action toggle the checkbox", async() =>
{
  const query = "#cba-click";
  const evType = "click";
  await setTestProject(query, evType, "");
  await playTestProject();
  ok(await isChecked(query));
  await playTestProject();
  notOk(await isChecked(query))
});

it("Update should wait for the page load before proceeding with next actions", async() =>
{
  
});

module.exports = {pageSetup};
