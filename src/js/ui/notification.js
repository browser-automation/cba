const NO_PROJ_SELECTED = "Please select project";
const NO_PROJ_GROUP_SELECTED = "Please select Group or Project";
const NO_ACTION_SELECTED = "Please select action";
const SELECT_PROJ_NOT_GROUP = "Please select project (not group)";
const CHANGES_SAVED = "Changes has been saved";

const notification = {
  show: (text, isError) => {
    const notification = document.querySelector("#notification");
    console.log(notification);
    notification.textContent = text;
    notification.classList.remove("error");
    if (isError)
      notification.classList.add("error");
  },
  clean: () => notification.show(""),
  error: (text) => notification.show(text, true),
  NO_PROJ_SELECTED, NO_PROJ_GROUP_SELECTED, NO_ACTION_SELECTED,
  SELECT_PROJ_NOT_GROUP, CHANGES_SAVED
}

module.exports = notification;
