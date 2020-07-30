const cbaTabs = document.querySelector("cba-tabs");
const {load, saveState} = require("../db/tab")

async function selectTab()
{
  const tab = await load();
  if (tab)
    cbaTabs.select(tab);
  else
    cbaTabs.select("import-tab");
}

selectTab();
cbaTabs.addEventListener("tabChange", async({detail}) =>
{
  saveState(detail);
});
