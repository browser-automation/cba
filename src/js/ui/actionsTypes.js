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

const website = "https://chrome-automation.com";
const actionTypes = [
  {
    name: "inject",
    description: "Injects script into web page and iframes.",
    link: `${website}/inject`
  },
  {
    name: "cs-inject",
    description: "Injects javascript code into the content script.",
    link: `${website}/inject-cs`
  },
  {
    name: "bg-inject",
    description: "Inject script into backroung page of the extension.",
    link: `${website}/bg-inject`
  },
  {
    name: "bg-function",
    description: "Predefined scripts that are executed in the context of the background page.",
    link: `${website}/bg-function`
  },
  {
    name: "change",
    description: "Changes value of HTML inputs.",
    link: `${website}/change`
  },
  {
    name: "check",
    description: "Checks/unchecks checkboxes.",
    link: `${website}/check`
  },
  {
    name: "click",
    description: "Triggers click event.",
    link: `${website}/click`
  },
  {
    name: "click-update",
    description: "Triggers click event and waits for the page to update to proceed with the rest of the actions.",
    link: `${website}/click-update`
  },
  {
    name: "update",
    description: "Waits for the browser update and then continue with workflow.",
    link: `${website}/update`
  },
  {
    name: "timer",
    description: "Timer action is used to stop workflow of project for mentioned period in milliseconds then continue with it.",
    link: `${website}/timer`
  },
  {
    name: "redirect",
    description: "Redirects the page to mentioned URL and wait for browser update to continue with project workflow.",
    link: `${website}/redirect`
  },
  {
    name: "copy",
    description: "Copy content of the element into clipboard['copy'] object, which can be used later during the execution.",
    link: `${website}/copy`
  },
  {
    name: "copy-html",
    description: "Copy HTML content of the element into clipboard['copy'] object, which can be used later during the execution.",
    link: `${website}/copy-html`
  },
  {
    name: "pause",
    description: "Pause project workflow, waits for 'resume' button to be clicked in extension popup.",
    link: `${website}/pause`
  }
];

module.exports = actionTypes;