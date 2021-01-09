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

const actionTypes = require("./actionsTypes");
const secondaryDisabled = ["inject", "cs-inject", "bg-inject", "bg-function",
                      "check", "click", "click-update", "update",
                      "redirect", "copy", "copy-html", "pause"];
const mainDisabled = ["update", "timer", "pause"];
const revertInputs = ["timer"];

class ActionInputs {
    constructor(data) {
      const {type, inputs, text, info = {}} = data;
      const [main, secondary] = inputs;
      this.typeInput = document.querySelector(type);
      this.mainInput = document.querySelector(main);
      this.secondaryInput = document.querySelector(secondary);
      this.functionNameInput = document.querySelector(text);
      this.functionDescriptionInput = document.querySelector(info.description);
      this.functionLinkInput = document.querySelector(info.link);
      this.tooltip = null;
      this.typeInput.addEventListener("change", this.onTypeChange.bind(this));
      this._populateTypes();
      this.onTypeChange();
    }

    get _type() {
      return this.typeInput.value;
    }

    set _type(value) {
      this.typeInput.value = value;
      this.onTypeChange();
    }

    get _main() {
      return this.mainInput.value;
    }

    set _main(value) {
      this.mainInput.value = value;
    }

    get _secondary() {
      return this.secondaryInput.value;
    }

    set _secondary(value) {
      this.secondaryInput.value = value;
    }

    get _functionName() {
      return this.functionNameInput.value;
    }

    set _functionName(value) {
      this.functionNameInput.value = value;
    }

    get _functionDescription() {
      return this.functionDescriptionInput.value;
    }

    set _functionDescription(value) {
      this.functionDescriptionInput.value = value;
    }

    get _functionLink() {
      return this.functionLinkInput.value;
    }

    set _functionLink(value) {
      this.functionLinkInput.value = value;
    }

    isReverse() {
      return revertInputs.includes(this._type);
    }

    isFunction() {
      return this.functionNameInput;
    }

    _populateTypes() {
      for (const {name} of actionTypes) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        this.typeInput.appendChild(option);
      }
    }

    setTooltip(query) {
      this.tooltip = document.querySelector(query);
      this.setTooltipInfo();
    }

    setTooltipInfo() {
      const {link, description, name} = actionTypes.filter(({name}) => name === this._type)[0];
      const heading = name;
      const text = description;
      const linkText = "Learn more";
      this.tooltip.setData({heading, text, link, linkText});
    }

    reset() {
      this.typeInput.selectedIndex = 0;
      this._main = "";
      this._secondary = "";
    }

    getItem() {
      const inputs = [this._main, this._secondary];
      const data = {
        type: this._type,
        inputs: this.isReverse() ? inputs.reverse() : inputs
      };
      if (this.isFunction()) {
        return {data, text: this._functionName,
                info: {description: this._functionDescription,
                       link: this._functionLink}};
      }
      else {
        return data;
      }
    }

    setItem(item) {
      let text, type, inputs = "", info;
      if (this.isFunction() && item.data) {
        ({type, inputs} = item.data);
        ({info = {}, text} = item);
      }
      else {
        ({type, inputs} = item);
      }

      if (type)
        this._type = type;
      else
        this.typeInput.selectedIndex = 0;

      if (!inputs) {
        this._main = "";
        this._secondary = "";
      }
      else if (this.isReverse()) {
        this._main = inputs[1] || "";
        this._secondary = inputs[0] || "";
      }
      else {
        this._main = inputs[0] || "";
        this._secondary = inputs[1] || "";
      }

      if (text)
        this._functionName = text;
      if (info && info.description)
        this._functionDescription = info.description;
      if (info && info.link)
        this._functionLink = info.link;
    }

    onTypeChange() {
      this.mainInput.disabled = false;
      this.secondaryInput.disabled = false;
      const type = this._type;
      if (this.tooltip)
      {
        this.setTooltipInfo();
      }

      if (secondaryDisabled.includes(type))
      {
        this.secondaryInput.disabled = true;
      }
      if (mainDisabled.includes(type))
      {
        this.mainInput.disabled = true;
      }
    }
}

module.exports = ActionInputs;
