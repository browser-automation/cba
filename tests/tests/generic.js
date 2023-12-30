/*
 * This file is part of Chromium Browser Automation.
 * Copyright (C) 2020-present Manvel Saroyan
 * 
 * Chromium Browser Automation is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Chromium Browser Automation is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Chromium Browser Automation. If not, see
 * <http://www.gnu.org/licenses/>.
 */

const assert = require("assert");
const path = require("path");
const equal = assert.strictEqual;
const notEqual = assert.notStrictEqual;
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {getLocalStorageData, sendCurrentTabRequest, getStyle,
       wait} = require("./utils");
const projectsDb = require("../../src/js/db/projects");
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
  await wait(500);
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
  deepEqual(await getLocalStorageData(projectsDb.name), initialData);
});

it("Sending highlight and unHighlight event should outline specific element according to selector", async() =>
{
  const query = "#higlight";
  await sendCurrentTabRequest({"action": "highlight" ,"selector": query});
  equal(await getStyle(query, "outline"), "red solid 1px");
  await sendCurrentTabRequest({"action": "unHighlight" ,"selector": query});
  equal(await getStyle(query, "outline"), "");
});

if (process.env.MV3)
{
  it("Run MV3 test", async() =>
  {
    equal(process.env.MV3, "1");
  });
}

module.exports = {pageSetup};
