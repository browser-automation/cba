class CBA {
  constructor() {
    this.allowRec = 0;
		this.allowPlay = 0;
		this.pause = 0;
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

  play() {
    // TBA
  }

  stop() {
    // TBA
  }

  record() {
    // TBA
  }

  setInstructionArray(arr)
  {
    this.instructArray = arr;
  }
}

module.exports.CBA = CBA;
