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
