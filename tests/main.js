const puppeteer = require("puppeteer");
const extensionPath = "dist";
const tests = [
  {path:"cba-test.js", name: "TBA"}
];

let browser;
let page;

function run()
{
  for (const {path, name} of tests)
  {
    describe(name, () => {
      require(`./tests/${path}`);
      before(async () =>
      {
        browser = await puppeteer.launch({headless: false, args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`
        ]});
        page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36");
      });
      after(async () =>
      {
        await browser.close();
      })
    });
  }
}

module.exports = {page: () => page, run};
