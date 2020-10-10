const name = "prefs";

async function init()
{
  let prefs = await load();
  if (!prefs)
  {
    prefs = {
      // Hide tooltip for powerful actions
      hidePowerfulActionWarning: false
    }
    return browser.storage.local.set({prefs});
  }
}

async function load() {
  const result = await browser.storage.local.get(name);
  return result[name];
}

async function get(pref)
{
  const prefs = await load();
  return (prefs && prefs[pref]) ? prefs[pref] : false;
}

async function set(pref, value)
{
  const prefs = await load();
  if (prefs && pref in prefs)
  {
    prefs[pref] = value;
    return browser.storage.local.set({prefs});
  }
  return false;
}

init();

module.exports = {load, get, set};
