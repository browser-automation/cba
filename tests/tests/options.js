const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait, getTextContent, getExtensionVersion, getElementAttribute} = require("./utils");
const {page} = require("../main");

const pageSetup = {
  path: "options.html"
}

beforeEach(async () =>
{
  await wait(50);
});

it("Extension version should be set in the header", async() =>
{
  equal(await getTextContent("#version"), await getExtensionVersion());
});

it("Last opened tab should be remembered, otherwise 'Import/export' tab should be selected", async() =>
{
  const importTabId = "import-tab";
  const cbaTabId = "cba-tab";
  const functionsTabId = "functions-tab";
  
  equal(await getSelectedTabId(), importTabId);

  page().click(`#${cbaTabId}`);
  await wait(50);
  equal(await getSelectedTabId(), cbaTabId);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  equal(await getSelectedTabId(), cbaTabId);

  page().click(`#${functionsTabId}`);
  await wait(50);
  equal(await getSelectedTabId(), functionsTabId);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait(50);
  equal(await getSelectedTabId(), functionsTabId);
});

function getSelectedTabId()
{
  return getElementAttribute("cba-tabs [aria-selected='true']", "id");
}

module.exports = {pageSetup};
