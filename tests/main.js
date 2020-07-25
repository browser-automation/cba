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
      this.timeout(5000);
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
        const backgroundPageTarget = targets.find(({ _targetInfo }) => _targetInfo.title === extensionName && _targetInfo.type === "background_page");
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
