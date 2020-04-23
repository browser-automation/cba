const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {getLocalStorageData} = require("./utils");
const {setTestPage} = require("../main");

const pageSetup = {
  body: `
  `
}

beforeEach(async () =>
{
  await setTestPage(pageSetup);
});

it("Starting the extension should set default actions", async() =>
{
  const initialData = {
    group0: {
      expanded: false,
      isLeaf: false,
      level: "0",
      loaded: true,
      name: "group0",
      parent: "",
      projects: [
        {
          action: [],
          expanded: false,
          isLeaf: true,
          level: "1",
          loaded: true,
          name: "project"
        }
      ]
    }
  };
  deepEqual(await getLocalStorageData(), initialData);
});

module.exports = {pageSetup};
