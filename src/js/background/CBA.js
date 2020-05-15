class CBA {
  constructor() {
    this.allowRec = 0;
    this.allowPlay = 0;
    this.paused = 0;
    this.playingProjectId;
    this.instructArray;
    this.defInstructArray;
    this.playingTabId = 0;
    this.instruction;
    this.selectedProjectId;
    this.lastEvType;
    this.currentTab;
    this.update = false;
    this.projectRepeat = 1;
    this.lastSelectedProjectId;
    this.selectedProjObj;
  }

  setProject(projObj, currProjectId, repeatVal) {
    if(this.clipboard == null) {
      this.clipboard = {};
    }

    this.allowPlay = 1;
    this.projectRepeat = repeatVal;
    this.playingProjectId = currProjectId;
    this.update = false;
    this.selectedProjObj = projObj;
    const dataObj = JSON.parse(localStorage.getItem("data"));

    const projectsArray = dataObj[projObj["group"]].projects;
    for(let i=0; i < projectsArray.length; i++) {
      if(projectsArray[i].name == projObj["project"]) {
        this.instructArray = projectsArray[i].action;
      }
    }

    this.defInstructArray = this.instructArray.slice(0);
  }

  stop() {
    this.allowRec = 0;
    this.allowPlay = 0;
    this.paused = 0;
  }

  pause() {
    this.allowPlay = 0;
    this.paused = 1;
  }

  record(projObj, projectId) {
    this.selectedProjObj = projObj;
    this.selectedProjectId = projectId;
    this.allowRec = 1;
  }

  setInstructionArray(arr)
  {
    this.instructArray = arr;
  }

  restore() {
    this.paused = 0;
    this.allowPlay = 1;
  }
}

module.exports.CBA = CBA;
