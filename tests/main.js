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

const puppeteer = require("puppeteer");
const extensionPath = "dist";
const {tests, server, closeBrowser} = require("./config");

let browser;
let page;
let backgroundPage;

function run()
{
  for (const {file, name} of tests)
  {
    describe(name, function() {
      this.timeout(0);
      const {pageSetup} = require(`./tests/${file}`);
      before(async () =>
      {
        browser = await puppeteer.launch({headless: false, args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          "--no-sandbox"
        ]});
        page = await browser.newPage();
        const extensionName = "Chromium browser automation";
        const targets = await browser.targets();
        const backgroundPageTarget = targets.find(({ _targetInfo }) => _targetInfo.title.startsWith(extensionName) && _targetInfo.type === "background_page");
        backgroundPage = await backgroundPageTarget.page();
        const [,, extensionID] = backgroundPage.url().split('/');

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36");
        if (pageSetup) {
          if (pageSetup.path.startsWith("http"))
            await navigateTo(pageSetup.path);
          else
            await navigateTo(`chrome-extension://${extensionID}/${pageSetup.path}`);
        }
      });
      after(async () =>
      {
        if (closeBrowser)
          await browser.close();
      })
    });
  }
}

async function navigateTo(path)
{
  return page.goto(path);
}

async function setTestPage(pageSetup)
{
  return page.evaluate((bodyHTML) => document.body.innerHTML = bodyHTML, pageSetup);
}

module.exports = {backgroundPage: () => backgroundPage, page: () => page, run, server, setTestPage, navigateTo};
