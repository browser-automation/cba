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
  const version = await getExtensionVersion();
  equal(await getTextContent("#version"), `v. ${version}`);
});

it("Last opened tab should be remembered, otherwise 'Import/export' tab should be selected", async() =>
{
  await wait();
  const importTabId = "import-tab";
  const cbaTabId = "cba-tab";
  const functionsTabId = "functions-tab";
  
  equal(await getSelectedTabId(), importTabId);

  page().click(`#${cbaTabId}`);
  await wait(50);
  equal(await getSelectedTabId(), cbaTabId);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait();
  equal(await getSelectedTabId(), cbaTabId);

  page().click(`#${functionsTabId}`);
  await wait(100);
  equal(await getSelectedTabId(), functionsTabId);

  await page().reload({waitUntil: "domcontentloaded"});
  await wait();
  equal(await getSelectedTabId(), functionsTabId);
});

function getSelectedTabId()
{
  return getElementAttribute("cba-tabs [aria-selected='true']", "id");
}

module.exports = {pageSetup};
