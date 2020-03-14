const assert = require("assert");
const equal = assert.strictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {backgroundPage, page} = require("../main");

beforeEach(async () =>
{
  
});

it("TBA", async() =>
{
  const date = `document.getElementById("textToChange").textContent = "Changed text";`;
  const evType = "inject";
  await setTestProject(date, evType, "");
  await playTestProject();
});

async function setTestProject(data, evType, newValue)
{
  const dataObj = {
    "testGroup": {
      "name": "testGroup",
      "level": "0",
      "parent": "",
      "isLeaf": false,
      "expanded": true,
      "loaded": true,
      "projects": [{
        "action": [
        {
          data,
          evType,
          "msgType": "userEvent",
          newValue
        }],
        "name": "testProject",
        "level": "1",
        "isLeaf": true,
        "expanded": false,
        "loaded": true
      }]
    }
  };
  return backgroundPage().evaluate((data) => localStorage.setItem("data", JSON.stringify(data)) , dataObj);
}

async function playTestProject()
{
  const porjectData = {
    isProject: true,
    project: "testProject",
    group: "testGroup",
    groupObj: ""
  };
  const projectId = "2";
  const repeate = "1";
  backgroundPage().evaluate((porjectData, projectId, repeate) => playButtonClick(porjectData, projectId, repeate), porjectData, projectId, repeate);
}

async function wait(milliseconds = 200)
{
  return page().waitFor(milliseconds);
}

