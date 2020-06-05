const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {wait} = require("./utils");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  path: "popup.html"
}

beforeEach(async () =>
{
});

it("TBA", async() =>
{
  wait(1000);
});

module.exports = {pageSetup};
