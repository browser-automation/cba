class CBA {
  constructor() {
    this.allowRec = false;
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
    this.projectRepeat = 1;
    this.lastSelectedProjectId;
    this.selectedProjObj;
  }

  setProject(actions, repeatVal, currProjectId) {
    if(this.clipboard == null) {
      this.clipboard = {};
    }

    this.allowPlay = 1;
    this.projectRepeat = repeatVal;
    this.playingProjectId = currProjectId;

    this.instructArray = actions;
    this.defInstructArray = this.instructArray.slice(0);
  }

  stop() {
    this.allowRec = false;
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
    this.allowRec = true;
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
