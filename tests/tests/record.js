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
const deepEqual = assert.deepStrictEqual;
const notDeepEqual = assert.notDeepStrictEqual;
const ok = assert.ok;
const notOk = (value) => ok(!value);
const {setProjects, getTextContent, getPageUrl,
       resetBackgroundGlobalVar, startTestRecording, stopTestRecording,
       getTestProjectActions, focusAndType, wait, getBadgeText,
       stopPropagation} = require("./utils");
const {setTestPage, navigateTo, page} = require("../main");
const {server} = require("../config");

const bgGlobalVarName = "cba-test";

const pageSetup = {
  body: `
    <a href="/redirect" />Redirect page</a>
    <a id="cba-reference-link" href="#top" />Page top</a>
    <a id="cba-empty-link" href="" />Empty link</a>
    <input id="cba-input-submit" type="submit" />
    <input id="cba-input-image" type="image" />
    <input id="cba-input-text" type="text" />
    <input id="cba-input-password" type="password" />
    <textarea></textarea>
    <select>
      <option value="1" selected>
      </option><option value="2"></option>
    </select>
    <input id="cba-radio" type="radio" name="cba-radio" value="cba-radio">
    <input id="cba-checkbox" type="checkbox" name="cba-checkbox" value="cba-checkbox">
    <button id="cba-button">click me</button>
    <input id="cba-input-button" type="button" value="click me" />
    <div id="testing-path">
      <input type="radio" name="cba-checkbox" value="cba-checkbox1">
      <input type="radio" name="cba-checkbox" value="cba-checkbox2">
      <input type="radio" name="cba-checkbox" value="cba-checkbox3">
      <button id="cba-path-button">click me</button>
      <button id="cba-path-button-nested"><span>click me</span></button>
    </div>
    <div id="cba-editable" contenteditable="true"><p>Editable content</p></div>
  `,
  path: server
}

beforeEach(async () =>
{
  await setProjects();
  const pageUrl = await getPageUrl();
  await resetBackgroundGlobalVar(bgGlobalVarName);

  if (path.relative(pageUrl, server) != "")
    await navigateTo(server);
  await setTestPage(pageSetup.body);
});

it("Starting and stoping the recording adds a redirect action", async() =>
{
  await startTestRecording();
  await stopTestRecording();
  equal(await getTestProjectActions(0, "type"), "redirect");
  deepEqual(await getTestProjectActions(0, "inputs"), [`${server}/`, ""]);
});

it("Starting recording should set 'rec' badge text and stopping recording should remove it", async() =>
{
  await startTestRecording();
  equal(await getBadgeText(), "rec");
  await stopTestRecording();
  equal(await getBadgeText(), "");
});

it("Clicking anchor should add a redirect action", async() =>
{
  await startTestRecording();
  await page().click("a");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("/redirect", "redirect"));
});

it("Clicking anchor with empty/missing href or beginning with # should add a click event", async() =>
{
  await startTestRecording();
  await page().click("a[href^='#']");
  await page().click("a[href='']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-reference-link", "click"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-empty-link", "click"));
});

it("Clicking input[type=submit], input[type=image] should create click-update action using target selector", async() =>
{
  await startTestRecording();
  await page().click("input[type=submit]");
  await page().click("input[type=image]");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-input-submit", "click-update"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-input-image", "click-update"));
});

it("Changing input[type=text], input[type=password], textarea, select should create change action using target selector", async() =>
{
  const inputTextValue = "Input type text value";
  const inputPasswordValue = "Input type password value";
  const textAreaValue = "textarea value";
  await startTestRecording();
  await focusAndType("input[type=text]", inputTextValue);
  await focusAndType("input[type=password]", inputPasswordValue);
  await focusAndType("textarea", textAreaValue);
  await page().keyboard.press("Tab");
  await page().select("select", "2");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-input-text", "change", inputTextValue));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-input-password", "change", inputPasswordValue));
  deepEqual(await getTestProjectActions(3),
            createAction("body > textarea", "change", textAreaValue));
  deepEqual(await getTestProjectActions(4),
            createAction("body > select", "change", "2"));
});

it("Changing input[type=radio], input[type=checkbox] should create check action using target selector", async() =>
{
  await startTestRecording();
  await page().click("input[type='radio']");
  await page().click("input[type='checkbox']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-radio", "check"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-checkbox", "check"));
});

it("Changing content of the contenteditable element, should create change action using target selector", async() =>
{
  const value = "Content change";
  const initialValue = await getTextContent("[contenteditable=true]");
  await startTestRecording();

  await focusAndType("[contenteditable=true]", value);
  await page().keyboard.press("Tab");
  await stopTestRecording();
  const input2 = `<p>${value}${initialValue}</p>`;
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-editable", "change", input2));
});

it("Clicking button, input[type='button'] should create click action using target selector", async() =>
{
  await startTestRecording();
  await page().click("button");
  await page().click("input[type='button']");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-button", "click"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-input-button", "click"));
});

it("Clicking element should use DOM tree to construct CSS selector(Testing path)", async() =>
{
  await startTestRecording();
  await page().click("#testing-path input[type='radio']:nth-of-type(1)");
  await page().click("#testing-path input[type='radio']:nth-of-type(2)");
  await page().click("#testing-path input[type='radio']:nth-of-type(3)");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#testing-path > input", "check"));
  deepEqual(await getTestProjectActions(2),
            createAction("#testing-path > input:nth-of-type(2)", "check"));
  deepEqual(await getTestProjectActions(3),
            createAction("#testing-path > input:nth-of-type(3)", "check"));
});

it("Clicking element with ID should use ID as access data(Testing path)", async() =>
{
  await startTestRecording();
  await page().click("#cba-path-button");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-path-button", "click"));
});

it("Clicking element inside catchable one should get recorded accordingly and use path to the catchable one(Testing path)", async() =>
{
  await startTestRecording();
  await page().click("#cba-path-button-nested span");
  await stopTestRecording();
  await wait(50);
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-path-button-nested", "click"));
});

it("Clicking or changing element that has canceled event propagation should still record action", async() =>
{
  await stopPropagation("#cba-button", "click");
  await stopPropagation("#cba-input-text", "change");

  const inputTextValue = "New value";
  await startTestRecording();
  await page().click("#cba-button");
  await focusAndType("#cba-input-text", inputTextValue);
  await page().keyboard.press("Tab");
  await stopTestRecording();
  deepEqual(await getTestProjectActions(1),
            createAction("#cba-button", "click"));
  deepEqual(await getTestProjectActions(2),
            createAction("#cba-input-text", "change", inputTextValue));
});

function createAction(data, type, value="")
{
  return {
    type, inputs: [data, value]
  }
}

module.exports = {pageSetup};
