const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {getLocalStorageData, sendCurrentTabRequest, getStyle, projectsDb, wait} = require("./utils");
const {setTestPage} = require("../main");
const {server} = require("../config");

const pageSetup = {
  body: `
    <span id="higlight">Highlight me</span>
  `,
  path: server
}

beforeEach(async () =>
{
  await setTestPage(pageSetup.body);
});

it("Starting the extension should set default actions", async() =>
{
  const initialData = {
    projects: [{
      text: "group",
      type: "group",
      id: "group",
      expanded: false,
      subItems: [
        {
          text: "project",
          type: "project",
          id: "project",
          actions: []
        }
      ]
    }]
  };
  deepEqual(await getLocalStorageData(projectsDb), initialData);
});

it("Sending highlight and unHighlight event should outline specific element according to selector", async() =>
{
  const query = "#higlight";
  await sendCurrentTabRequest({"action": "highlight" ,"selector": query});
  equal(await getStyle(query, "outline"), "red solid 1px");
  await sendCurrentTabRequest({"action": "unHighlight" ,"selector": query});
  equal(await getStyle(query, "outline"), "");
});

module.exports = {pageSetup};
