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


require("./record");
require("./actions");

browser.runtime.onMessage.addListener((request) => {
  if(request.action == "highlight") {
    return setHighlight(request.selector);
  }
  else if(request.action == "unHighlight") {
    return setHighlight(request.selector, false);
  }
});

function setHighlight(query, highlight = true)
{
  const target = document.querySelector(query);
  if (target) {
    target.style["outline-style"] = highlight ? "solid" : "";
    target.style["outline-color"] = highlight ? "red" : "";
    target.style["outline-width"] = highlight ? "1px" : "";
  }
}
