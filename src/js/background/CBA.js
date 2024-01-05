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

/**
 * @typedef State
 * @property {boolean} allowRec - Whether recording is allowed.
 * @property {{[key: string]: any} | null} clipboard - The clipboard.
 * @property {number} allowPlay - Whether playing is allowed.
 * @property {number} paused - Whether playing is paused.
 * @property {string | null} playingProjectId - The ID of the project being played.
 * @property {number} playingActionIndex - The index of the action being played.
 * @property {string | null} recordingProjectId - The ID of the project being recorded.
 * @property {string | null} recordingGroupId - The ID of the group being recorded.
 * @property {import("../db/projects").Action[]} instructArray - The array of actions being played.
 * @property {import("../db/projects").Action[]} defInstructArray - The array of actions being played.
 * @property {number | null | undefined} playingTabId - The ID of the tab being played.
 * @property {import("../db/projects").ActionType} lastEvType - The type of the last event.
 * @property {number | string} projectRepeat - The number of times the project should be repeated.
 */

// @ts-check

class CBA {
  allowRec = false;
  allowPlay = 0;
  /** @type {State["clipboard"]} */
  clipboard = null;
  paused = 0;
  /** @type {State["playingProjectId"]} */
  playingProjectId = null;
  playingActionIndex = -1;
  /** @type {State["recordingProjectId"]} */
  recordingProjectId = null;
  /** @type {State["recordingGroupId"]} */
  recordingGroupId = null;
  /** @type {State["instructArray"]} */
  instructArray;
  /** @type {State["defInstructArray"]} */
  defInstructArray; // Q: Do we need this?
  /** @type {State["playingTabId"]} */
  playingTabId = null;
  /** @type {State["lastEvType"]} */
  lastEvType;
  /** @type {State["projectRepeat"]} */
  projectRepeat = 1; // TODO: Accept only numbers.

  constructor() {}

  /**
   * @param {import("../db/projects").Action[]} actions
   * @param {string} repeatVal
   * @param {string} currProjectId
   */
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

  /**
   * Get the current CBA state.
   * @returns {State}
   */
  getState() {
    return {
      allowPlay: this.allowPlay,
      allowRec: this.allowRec,
      clipboard: this.clipboard,
      paused: this.paused,
      playingProjectId: this.playingProjectId,
      playingActionIndex: this.playingActionIndex,
      recordingProjectId: this.recordingProjectId,
      recordingGroupId: this.recordingGroupId,
      instructArray: this.instructArray,
      defInstructArray: this.defInstructArray,
      playingTabId: this.playingTabId,
      lastEvType: this.lastEvType,
      projectRepeat: this.projectRepeat,
    };
  }
}

module.exports.CBA = CBA;
