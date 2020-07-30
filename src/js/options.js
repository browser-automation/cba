require("./analytics");
require("./ui/import-export");
require("./ui/functions");
require("./ui/tabs");

async function setVersion()
{
  const {version} = await browser.app.getDetails();
  document.querySelector("#version").textContent = `v. ${version}`;
}

setVersion();
