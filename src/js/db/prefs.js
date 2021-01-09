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
