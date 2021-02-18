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

class CBA {
  constructor() {
    this.allowRec = false;
    this.allowPlay = 0;
    this.paused = 0;
    this.playingProjectId;
    this.playingActionIndex = -1;
    this.recordingProjectId = null;
    this.recordingGroupId = null;
    this.instructArray;
    this.defInstructArray;
    this.playingTabId = null;
    this.instruction;
    this.selectedProjectId;
    this.lastEvType;
    this.currentTab;
    this.projectRepeat = 1;
    this.lastSelectedProjectId;
    this.lastSelectedActionId;
    this.selectedProjObj;
  }

  setProject(actions, repeatVal, currProjectId) {
    if(this.clipboard == null) {
      this.clipboard = {};
    }

    this.allowPlay = 1;
    this.projectRepeat = repeatVal;
    if (currProjectId)
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

  record(groupId, projectId) {
    this.recordingProjectId = projectId;
    this.recordingGroupId = groupId;
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

  async getPlayingTabId() {
    if (this.playingTabId)
      return this.playingTabId;

    const [activeTab] = await browser.tabs.query({active: true});
    return activeTab.id;
  }
}

module.exports.CBA = CBA;
