const assert = require("assert");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject, getTextContent} = require("./common");

const pageSetup = {
  body: "<div id='changeContent'>Change me</div>"
}

it("Inject function runs specified script in the web page", async() =>
{
  const newText = "Injected text";
  const date = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "inject";
  await setTestProject(date, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("cs-inject function runs specified script in content script", async() =>
{
  const newText = "CS injected text";
  const date = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "cs-inject";
  await setTestProject(date, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

it("bg-inject function runs specified script in background page", async() =>
{
  const newText = "CS injected text";
  const date = `document.querySelector('#changeContent').textContent = "${newText}";`;
  const evType = "cs-inject";
  await setTestProject(date, evType, "");
  await playTestProject();
  equal(await getTextContent("#changeContent"), newText);
});

module.exports = {pageSetup};
