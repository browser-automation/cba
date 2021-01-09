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

const NO_PROJ_SELECTED = "Please select project";
const NO_PROJ_GROUP_SELECTED = "Please select Group or Project";
const NO_ACTION_SELECTED = "Please select action";
const SELECT_PROJ_NOT_GROUP = "Please select project (not group)";
const CHANGES_SAVED = "Changes has been saved";
const PROJECT_IMPORTED = "The group or project is imported";
const NO_GROUP_ROOT_SELECTED = "Please select group or 'Root'";
const NO_IMPORT_DATA = "Please specify the import data";
const NO_PROJ_GROUP_TYPE = "Type should either be of type 'group' or 'project'";
const NO_FUNCTION_NAME = "Please specify 'name' of the function";
const NO_SELECTED_FUNCTION = "Please select a function";
const NAME_EXISTS_GROUP = "The group with choosen name already exists";
const NAME_EXISTS_PROJECT = "The group already has project with current name";
const PROJECT_EDIT = "Please click 'save' below projects list to finish renaming";

class Notification {
  constructor(query) {
    this.notificationElement = document.querySelector(query);
  }

  show(text, isError) {
    this.notificationElement.textContent = text;
    this.notificationElement.classList.remove("error");
    if (isError)
      this.notificationElement.classList.add("error");
  }
  clean() {
    this.show("");
  }

  error(text) {
    this.show(text, true);
  }
}

module.exports = {Notification, NO_PROJ_SELECTED, NO_PROJ_GROUP_SELECTED,
  NO_ACTION_SELECTED, SELECT_PROJ_NOT_GROUP, CHANGES_SAVED,
  NO_GROUP_ROOT_SELECTED, NO_IMPORT_DATA, NO_PROJ_GROUP_TYPE, PROJECT_IMPORTED,
  NO_FUNCTION_NAME, NO_SELECTED_FUNCTION, CHANGES_SAVED, NAME_EXISTS_GROUP,
  NAME_EXISTS_PROJECT, PROJECT_EDIT};
