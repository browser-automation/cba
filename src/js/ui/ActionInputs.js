const actionTypes = ["inject", "cs-inject", "bg-inject", "bg-function", "change",
                     "check", "click", "click-update", "update", "timer",
                     "redirect", "copy", "copy-html", "pause"];
const secondaryDisabled = ["inject", "cs-inject", "bg-inject", "bg-function",
                      "check", "click", "click-update", "update",
                      "redirect", "copy", "copy-html", "pause"];
const mainDisabled = ["update", "timer", "pause"];
const revertInputs = ["timer"];

class ActionInputs {
    constructor(type, main, secondary, functionName) {
      this.typeInput = document.querySelector(type);
      this.mainInput = document.querySelector(main);
      this.secondaryInput = document.querySelector(secondary);
      this.functionNameInput = document.querySelector(functionName);
      this.typeInput.addEventListener("change", this.onTypeChange.bind(this));
      this._populateTypes();
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

    isReverse() {
      return revertInputs.includes(this._type);
    }

    isFunction() {
      return this.functionNameInput;
    }

    _populateTypes() {
      for (const actionType of actionTypes) {
        const option = document.createElement("option");
        option.value = actionType;
        option.textContent = actionType;
        this.typeInput.appendChild(option);
      }
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
        return {data, text: this._functionName};
      }
      else {
        return data;
      }
    }

    setItem(item) {
      let text, type, inputs = "";
      if (this.isFunction() && item.data) {
        ({type, inputs} = item.data);
        text = item.text;
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
    }

    onTypeChange() {
      this.mainInput.disabled = false;
      this.secondaryInput.disabled = false;
      const type = this._type;

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
