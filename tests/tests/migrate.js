const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const projectsDb = require("../../src/js/db/projects");
const {getWindowLocalStorage, setWindowLocalStorage, wait, reloadExtension,
       getLocalStorageData} = require("./utils");
const customActionsDb = require("../../src/js/db/customActions");

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

const oldCbaFunctions = 
[
  {
    name: "Timer",
    data:"Please enter the time in milliseconds",
    evType:"timer",
    msgType:"apiEvent",
    newValue:"1000"
  },
  {
    name: "Update",
    data:"this event will let the script wait for page update",
    evType:"update",
    msgType:"apiEvent",
    newValue:""
  },
  {
    name: "Clear cookies",
    data:"<$function=removeCookie>\n<$attr=.*>",
    evType:"bg-function",
    msgType:"apiEvent",
    newValue:"use regular expressions to filter domains"
  },
  {
    name: "Clipboard",
    data:'<$function=saveToClipboard>\n<$attr={"name": "value"}>',
    evType:"bg-function",
    msgType:"apiEvent",
    newValue:"Write to clipboard Object to access data later. Use Json in the attr."
  },
];

beforeEach(async () =>
{
  await setWindowLocalStorage("data", oldData);
  await setWindowLocalStorage("cba-functions", oldCbaFunctions);
  await reloadExtension();
  await wait();
});

it("Extension should move and backup old data", async() =>
{
  const {backup} = await getLocalStorageData("backup");
  const migratedData = {
    projects: [{
      text: "oldGroup",
      id: "oldGroup",
      type: "group",
      expanded: false,
      subItems: [
        {
          text: "oldProject",
          id: "oldGroup_oldProject",
          type: "project",
          actions: []
        }
      ]
    }, {
      text: "oldGroup1",
      id: "oldGroup1",
      type: "group",
      expanded: false,
      subItems: [
        {
          text: "oldProject0",
          id: "oldGroup1_oldProject0",
          type: "project",
          actions: [{
            type: "timer",
            inputs: ["Please enter the time in milliseconds", "70000"],
          },
          {
            type: "update",
            inputs: ["this event will let the script wait for page update", ""],
          }]
        },
        {
          text: "oldProject2",
          id: "oldGroup1_oldProject2",
          type: "project",
          actions: [{
            type: "inject",
            inputs: ["console.log(\"heloo World\");", ""]
          }]
        }
      ]
    }]
  };

  const migratedCustomActions = {
    customActions: [
      {
        data: {
          type: "timer",
          inputs: ["Please enter the time in milliseconds", "1000"]
        },
        text: "Timer"
      },
      {
        data: {
          type: "update",
          inputs: ["this event will let the script wait for page update", ""],
        },
        text: "Update"
      },
      {
        data: {
          type: "bg-function",
          inputs: ["<$function=removeCookie>\n<$attr=.*>", "use regular expressions to filter domains"]
        },
        text: "Clear cookies"
      },
      {
        data: {
          type: "bg-function",
          inputs: ['<$function=saveToClipboard>\n<$attr={"name": "value"}>', "Write to clipboard Object to access data later. Use Json in the attr."],
        },
        text: "Clipboard"
      }
    ]
  };

  equal(await getWindowLocalStorage("data"), null, "Old window.localStorageo('data') is deleted");
  deepEqual(backup.data, oldData, "Old data is backed up in browser.storage.local.get('backup')");
  deepEqual(await getLocalStorageData(projectsDb.name), migratedData, `Old data should be reconstructed moved into browser.storage.local.get('${projectsDb.name}')`);
  deepEqual(await getLocalStorageData(customActionsDb.name), migratedCustomActions, `Old cba-functions should be reconstructed moved into browser.storage.local.get('${customActionsDb.name}')`);
});
