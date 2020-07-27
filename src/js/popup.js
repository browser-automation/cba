const {_gaq} = require("./analytics");
require("./ui/projects");

function trackButtonClick(e) {
   _gaq.push(['_trackEvent', e.target.id, 'clicked']);
};

function analytAllButtons() {
  var buttons = document.querySelectorAll('cba-button');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', trackButtonClick);
  }
}

analytAllButtons();

const params = (new URL(window.location)).searchParams;
if (params.has("options")) {
  document.body.classList.add("options");
}
