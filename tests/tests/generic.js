const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {getProjectActions} = require("./utils");
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
  ok(await getProjectActions("group0", "project"));
});

module.exports = {pageSetup};
