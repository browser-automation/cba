const puppeteer = require("puppeteer");
const extensionPath = "dist";
const tests = [
  {path:"play.js", name: "Testing actions"},
  {path:"record.js", name: "Testing recording"},
  {path:"generic.js", name: "Running generic Tests"},
];
const server = "http://127.0.0.1:3001";

let browser;
let page;
let backgroundPage;

function run()
{
  for (const {path, name} of tests)
  {
    describe(name, () => {
      const {pageSetup} = require(`./tests/${path}`);
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
        const backgroundPageTarget = targets.find(({ _targetInfo }) => _targetInfo.title === extensionName && _targetInfo.type === "background_page");
        backgroundPage = await backgroundPageTarget.page();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36");
        await navigateToTestPage();
        await setTestPage(pageSetup);
      });
      after(async () =>
      {
        await browser.close();
      })
    });
  }
}

async function navigateToTestPage()
{
  return page.goto(server);
}

async function setTestPage(pageSetup)
{
  return page.evaluate((bodyHTML) => document.body.innerHTML = bodyHTML, pageSetup.body);
}

module.exports = {backgroundPage: () => backgroundPage, page: () => page, run, server, setTestPage, navigateToTestPage};
