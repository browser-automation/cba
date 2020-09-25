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
