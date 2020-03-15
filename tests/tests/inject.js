const assert = require("assert");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {playTestProject, setTestProject} = require("./common");

const pageSetup = {
  body: "Change me"
}

it("Inject function runs specified script in the web page", async() =>
{
  const date = `document.body.innerHTML = "Injected text";`;
  const evType = "inject";
  await setTestProject(date, evType, "");
  await playTestProject();
});

module.exports = {pageSetup};
