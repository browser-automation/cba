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
 *  @typedef {import("../db/projects").ActionType} ActionType
 */

/**
 * @callback RpcHandler
 * @param {RpcMessages} msg
 * @param {import("webextension-polyfill").Runtime.Port} port
 */

/**
 * Record triggered event.
 * @typedef  {object} RpcRecordedEvent
 * @property {"RecordedEvent"} msgType - Message ID.
 * @property {import("../db/projects").Action} action - action to record.
 */

/**
 * Projects containing actions.
 * @typedef  {object} RpcPlayProject
 * @property {"PlayProject"} msgType - Message ID.
 * @property {import("../db/projects").Action[]} actions - Injectable actions.
 * @property {string} repeatTimes - Repeat times.
 * @property {string} id - Unique Identifier.
 */

/**
 * Projects containing actions.
 * @typedef  {object} RpcStopProject
 * @property {"StopProject"} msgType - Message ID.
 */

/**
 * Projects containing actions.
 * @typedef  {object} RpcRecordProject
 * @property {"RecordProject"} msgType - Message ID.
 * @property {string} groupId - Unique groupId Identifier.
 * @property {string} projectId - Unique projectId Identifier.
 */

/**
 * Get CBA state.
 * @typedef  {object} RpcGetState
 * @property {"GetState"} msgType - Message ID.
 * @property {string} id - unique id of the request.
 */

/**
 * Get CBA state.
 * @typedef  {object} RpcGetStateResponse
 * @property {"GetStateResponse"} msgType - Message ID.
 * @property {import("../background/CBA").State} state - CBA state.
 * @property {string} id - unique id of the request.
 */

/**
 * @typedef  {RpcRecordedEvent|RpcPlayProject|RpcGetState|RpcGetStateResponse|RpcStopProject|RpcRecordProject} RpcMessages
 */ 

module.exports = {}; // Unless specified types are not being imported.
