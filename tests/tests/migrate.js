const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {getWindowLocalStorage, setWindowLocalStorage, wait, reloadExtension,
       getLocalStorageData} = require("./utils");

const oldData = {
  "oldGroup": {
    "name": "testGroup",
    "level": "0",
    "parent": "",
    "isLeaf": false,
    "expanded": true,
    "loaded": true,
    "projects": [{
      "action": [],
      "name": "oldProject",
      "level": "1",
      "isLeaf": true,
      "expanded": false,
      "loaded": true
    }]
  },
  "oldGroup1": {
  "name": "group1",
  "level": "0",
  "parent": "",
  "isLeaf": false,
  "expanded": false,
  "loaded": true,
  "projects": [
    {
      "action": [
        {
          "data": "Please enter the time in milliseconds",
          "evType": "timer",
          "newValue": "70000"
        },
        {
          "data": "this event will let the script wait for page update",
          "evType": "update",
          "newValue": "",
          "name": "Update"
        }
      ],
      "name": "oldProject0",
      "level": "1",
      "isLeaf": true,
      "expanded": false,
      "loaded": true
    },
    {
      "action": [
        {
          "data": "console.log(\"heloo World\");",
          "evType": "inject",
          "newValue": "",
          "msgType": "userEvent"
        }
      ],
      "name": "oldProject2",
      "level": "1",
      "isLeaf": true,
      "expanded": false,
      "loaded": true
    }
  ]
  }
};

beforeEach(async () =>
{
  await setWindowLocalStorage("data", oldData);
  await reloadExtension();
  await wait();
});

it("Extension should move and backup old data", async() =>
{
  const {backup} = await getLocalStorageData("backup");
  const migratedData = {
    collections: [{
      text: "oldGroup",
      type: "group",
      expanded: false,
      subItems: [
        {
          text: "oldProject",
          type: "project",
          actions: []
        }
      ]
    }, {
      text: "oldGroup1",
      type: "group",
      expanded: false,
      subItems: [
        {
          text: "oldProject0",
          type: "project",
          actions: [{
            data: "Please enter the time in milliseconds",
            evType: "timer",
            value: "70000"
          },
          {
            data: "this event will let the script wait for page update",
            evType: "update",
            value: ""
          }]
        },
        {
          text: "oldProject2",
          type: "project",
          actions: [{
            data: "console.log(\"heloo World\");",
            evType: "inject",
            value: ""
          }]
        }
      ]
    }]
  };

  equal(await getWindowLocalStorage("data"), null, "Old window.localStorageo('data') is deleted");
  deepEqual(backup.data, oldData, "Old data is backed up in browser.storage.local.get('backup')");
  deepEqual(await getLocalStorageData("collections"), migratedData, "Old data should be reconstructed moved into browser.storage.local.get('collections')");
});
